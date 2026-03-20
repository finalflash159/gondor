import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/encryption';
import { invitationService } from '@/backend/services';
import { z } from 'zod';
import { checkRateLimit, registerRateLimiter } from '@/backend/middleware/rate-limit';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  inviteCode: z.string().optional(),
});

/**
 * Registration modes:
 *
 * 1. MASTER_INVITE_CODE set:
 *    - Anyone can register with this code
 *    - First user to use it becomes isMasterAdmin=true
 *    - Subsequent uses of the same code are REJECTED (single-use)
 *
 * 2. ALLOW_SELF_REGISTRATION=true (no MASTER_INVITE_CODE):
 *    - Anyone can register freely
 *
 * 3. ALLOW_SELF_REGISTRATION=false (no MASTER_INVITE_CODE):
 *    - Must provide a valid DB invite code (OrgInvitation)
 */
export async function POST(req: NextRequest) {
  // Rate limit check
  const rateLimit = checkRateLimit(registerRateLimiter, req);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: registerRateLimiter.message,
        retryAfterMs: rateLimit.retryAfterMs,
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.retryAfterMs || 0) / 1000).toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);
    const masterCode = process.env.MASTER_INVITE_CODE;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // ── MASTER_INVITE_CODE mode ──────────────────────────────────────────────────
    if (masterCode) {
      if (!validatedData.inviteCode) {
        return NextResponse.json(
          { error: 'Invitation code is required.' },
          { status: 403 }
        );
      }

      if (validatedData.inviteCode !== masterCode) {
        return NextResponse.json(
          { error: 'Invalid invitation code.' },
          { status: 400 }
        );
      }

      // Check if any user has already used this master code
      const masterAlreadyUsed = await db.user.findFirst({
        where: { isMasterAdmin: true },
      });
      if (masterAlreadyUsed) {
        return NextResponse.json(
          { error: 'This invitation code has already been used.' },
          { status: 400 }
        );
      }

      // First user to register with this code → becomes master admin
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await db.user.create({
        data: {
          email: validatedData.email.toLowerCase(),
          password: hashedPassword,
          name: validatedData.name,
          isMasterAdmin: true,
        },
      });

      // Track usage with null invitationId (no DB invite record for master codes)
      await invitationService.markAsUsed(null, user.id);

      return NextResponse.json(
        { id: user.id, email: user.email, name: user.name },
        { status: 201 }
      );
    }

    // ── NORMAL mode ─────────────────────────────────────────────────────────────
    const allowSelfRegistration = process.env.ALLOW_SELF_REGISTRATION === 'true';

    if (!allowSelfRegistration && !validatedData.inviteCode) {
      return NextResponse.json(
        { error: 'Registration is by invitation only. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Validate DB invite code
    let invitationData: {
      valid: boolean;
      error?: string;
      role?: string;
      invitationId?: string;
      orgId?: string;
    } = { valid: true };

    if (validatedData.inviteCode) {
      const dbValidation = await invitationService.validateForRegistration(
        validatedData.inviteCode,
        validatedData.email
      );
      if (!dbValidation.valid) {
        return NextResponse.json(
          { error: dbValidation.error || 'Invalid invitation code' },
          { status: 400 }
        );
      }
      invitationData = dbValidation;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(validatedData.password);
    const user = await db.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        name: validatedData.name,
      },
    });

    // If registered via DB invitation, add to organization
    if (invitationData.valid && invitationData.invitationId && invitationData.role && invitationData.orgId) {
      await invitationService.markAsUsed(invitationData.invitationId, user.id);
      await db.orgMember.create({
        data: {
          userId: user.id,
          orgId: invitationData.orgId,
          role: invitationData.role as 'admin' | 'member',
          invitationId: invitationData.invitationId,
        },
      });
    }

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
