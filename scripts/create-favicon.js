// Script to add background to favicon
const fs = require('fs');
const path = require('path');

// Read the logo
const logoPath = path.join(__dirname, 'public', 'gondor-logo.png');

// SVG templates with background
const svg32 = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#0d0d10"/>
  <image href="/gondor-logo.png" x="4" y="4" width="24" height="24"/>
</svg>`;

const svg16 = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" rx="3" fill="#0d0d10"/>
  <image href="/gondor-logo.png" x="2" y="2" width="12" height="12"/>
</svg>`;

console.log('SVG favicons created with dark background like GitHub');
