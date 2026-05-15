/**
 * Shared test utilities for rendering Next.js pages and components.
 *
 * Provides mock factories for Next.js navigation, Convex, auth state,
 * and feature flags. Each test file calls `vi.mock()` at the top level
 * using these factories — this ensures Vitest's hoisting mechanism works.
 *
 * @example
 * ```tsx
 * import { createNextNavMock } from '@/__tests__/test-utils';
 * vi.mock('next/navigation', () => createNextNavMock());
 * ```
 */
import { render, type RenderOptions } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { vi } from 'vitest';

// ── Re-exports ──────────────────────────────────────────────────

export { render, screen, within, fireEvent, waitFor, act } from '@testing-library/react';
export { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── next/navigation mock factory ────────────────────────────────

/**
 * Create a mock for `next/navigation` hooks.
 * Use in a top-level `vi.mock('next/navigation', () => createNextNavMock())` call.
 *
 * @param overrides - Optional pathname and search params
 */
export function createNextNavMock(overrides?: {
  pathname?: string;
  searchParams?: Record<string, string>;
}) {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => {
      const params = new URLSearchParams(overrides?.searchParams);
      return {
        get: (key: string) => params.get(key) ?? null,
        getAll: (key: string) => params.getAll(key),
        has: (key: string) => params.has(key),
        forEach: (fn: (value: string, key: string) => void) => params.forEach(fn),
        entries: () => params.entries(),
        keys: () => params.keys(),
        values: () => params.values(),
        toString: () => params.toString(),
        size: Array.from(params.keys()).length,
        [Symbol.iterator]: () => params[Symbol.iterator](),
      };
    },
    usePathname: () => overrides?.pathname ?? '/',
    useParams: () => ({}),
    notFound: vi.fn(),
    redirect: vi.fn(),
  };
}

// ── next/link mock factory ──────────────────────────────────────

/**
 * Mock implementation for `next/link` that renders a plain `<a>` tag.
 * Use in: `vi.mock('next/link', () => createNextLinkMock())`
 */
export function createNextLinkMock() {
  return {
    default: ({
      href,
      children,
      ...props
    }: { href: string; children: ReactNode } & ComponentProps<'a'>) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
}

// ── Convex mock factory ─────────────────────────────────────────

/**
 * Create mocks for `convex/react` and `convex-helpers/react/sessions`.
 * Use in top-level `vi.mock()` calls.
 */
export function createConvexReactMock() {
  return {
    ConvexProvider: ({ children }: { children: ReactNode }) => children,
    ConvexReactClient: vi.fn(),
    useQuery: vi.fn().mockReturnValue(undefined),
    useMutation: vi.fn().mockReturnValue(vi.fn()),
    useAction: vi.fn().mockReturnValue(vi.fn()),
    useConvex: vi.fn().mockReturnValue({}),
    useConvexAuth: vi.fn().mockReturnValue({ isLoading: false, isAuthenticated: false }),
  };
}

export function createSessionHelpersMock() {
  return {
    SessionProvider: ({ children }: { children: ReactNode }) => children,
    useSessionQuery: vi.fn().mockReturnValue(undefined),
    useSessionMutation: vi.fn().mockReturnValue(vi.fn()),
    useSessionId: vi.fn().mockReturnValue('test-session-id'),
  };
}

// ── Backend API mock factory ────────────────────────────────────

/**
 * Create a mock for the Convex generated API module.
 * Use in: `vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock())`
 */
export function createApiMock() {
  return { api: {} };
}

// ── Auth state mock factory ─────────────────────────────────────

export type MockAuthState = {
  sessionId: string;
  state: 'authenticated' | 'unauthenticated';
  reason?: string;
  user?: Record<string, unknown>;
  accessLevel?: string;
  isSystemAdmin?: boolean;
};

/**
 * Create a mock auth state for `@/modules/auth/AuthProvider`.
 * Use in: `vi.mock('@/modules/auth/AuthProvider', () => createAuthMock(...))`
 */
export function createAuthMock(state?: Partial<MockAuthState>) {
  const authState: MockAuthState = {
    sessionId: 'test-session',
    state: 'unauthenticated',
    reason: 'test',
    ...state,
  };

  return {
    AuthProvider: ({ children }: { children: ReactNode }) => children,
    useAuthState: () => authState,
    useCurrentUser: () => (authState.state === 'authenticated' ? authState.user : undefined),
  };
}

// ── Feature flag mock factory ───────────────────────────────────

/**
 * Create a mock for `@workspace/backend/config/featureFlags`.
 * Use in: `vi.mock('@workspace/backend/config/featureFlags', () => createFeatureFlagsMock(...))`
 */
export function createFeatureFlagsMock(overrides?: Record<string, unknown>) {
  const defaults = { disableLogin: false };
  return { featureFlags: { ...defaults, ...overrides } };
}

// ── Render wrapper ──────────────────────────────────────────────

/**
 * Render a component with all standard providers mocked.
 * Thin wrapper around `@testing-library/react`'s `render`.
 */
export function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// ── Convenience: setup all mocks at once ────────────────────────

/**
 * Set up all common mocks for a test file.
 * Call AFTER all `vi.mock()` calls at the top of the test file.
 *
 * @example
 * ```tsx
 * vi.mock('next/navigation', () => createNextNavMock());
 * vi.mock('next/link', () => createNextLinkMock());
 * vi.mock('convex/react', () => createConvexReactMock());
 * vi.mock('convex-helpers/react/sessions', () => createSessionHelpersMock());
 * vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());
 * vi.mock('@/modules/auth/AuthProvider', () => createAuthMock({ state: 'authenticated' }));
 * vi.mock('@workspace/backend/config/featureFlags', () => createFeatureFlagsMock());
 * ```
 */
