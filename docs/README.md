# Gondor - Secret Management System

A production-grade multi-tenant secret management system built with Next.js 14, PostgreSQL, and Prisma.

## Overview

Gondor is a SaaS application for managing sensitive configuration data (API keys, database credentials, tokens) across multiple organizations and projects. It provides secure encryption, role-based access control, and comprehensive audit logging.

## Key Features

- Multi-tenant architecture with Organization/Project hierarchy
- AES-256-GCM encryption for all secrets (at rest)
- Environment isolation (Development, Staging, Production)
- Folder-based secret organization (hierarchical)
- Role-Based Access Control (RBAC) at project level
- Comprehensive audit logging (all actions tracked)
- Alert/Notification system (expiry, security, membership)
- Dynamic Secrets (PostgreSQL, MySQL, MongoDB, Redis credentials)
- Secret Rotation (scheduled + manual via cron jobs)
- External Integrations (GitHub, AWS, GCP, Azure, Slack)
- Secrets Pagination (decrypted on-demand, not in list view)
- Rate Limiting (brute-force protection on auth endpoints)
- React Query caching (automatic background refetch)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, React Query
- **Backend**: Next.js API Routes, NextAuth.js v5
- **Database**: PostgreSQL with Prisma ORM (15 performance indexes)
- **Authentication**: NextAuth.js with credentials provider
- **Encryption**: AES-256-GCM (`MASTER_KEY` env var)

## Quick Links

- [System Architecture](./architecture/SYSTEM_ARCHITECTURE.md)
- [Database Schema](./database/SCHEMA.md)
- [API Documentation](./api/API_OVERVIEW.md)
- [Feature Documentation](./features/PROJECT_SECRETS.md)
- [Setup Guide](./setup/LOCAL_SETUP.md)
