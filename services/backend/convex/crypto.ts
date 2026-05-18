'use node';

import { v } from 'convex/values';

import { action } from './_generated/server';

// Helper to generate a secure random alphanumeric string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join('');
}

export const generateRecoveryCode = action({
  args: { length: v.optional(v.number()) },
  handler: async (_ctx, args) => {
    const code = generateRandomString(args.length ?? 128);
    return code;
  },
});

/**
 * Generate a cryptographically random base64url-encoded invite token.
 * 24 bytes → 32 characters in base64url.
 */
export function generateInviteToken(): string {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  // btoa produces standard base64; replace +/= with base64url-safe chars.
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
