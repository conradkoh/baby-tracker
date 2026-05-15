/**
 * Shared test utilities for rendering Next.js pages and components.
 *
 * Provides mock helpers for Next.js navigation, Convex, auth state,
 * and feature flags — all colocated for consistent test setup.
 */
import { render, type RenderOptions } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { vi } from 'vitest';

// ── Re-exports ──────────────────────────────────────────────────

export { render, screen, within, fireEvent, waitFor, act } from '@testing-library/react';
export { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── next/navigation mocks ───────────────────────────────────────

/**
 * Mock `next/navigation` hooks (useRouter, useSearchParams, usePathname).
 * Call in a `beforeEach` or at the top of a test file.
 *
 * @param overrides - Optional partial overrides for router and search params
 */
export function mockNextNavigation(overrides?: {
  pathname?: string;
  searchParams?: Record<string, string>;
}) {
  vi.mock('next/navigation', () => ({
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
      };
    },
    usePathname: () => overrides?.pathname ?? '/',
    useParams: () => ({}),
    notFound: vi.fn(),
    redirect: vi.fn(),
  }));
}

// ── next/link mock ──────────────────────────────────────────────

/**
 * Mock `next/link` to render as a plain `<a>` tag.
 * Call `vi.mock('next/link', ...)` in test files or setup.
 */
export function mockNextLink() {
  vi.mock('next/link', () => ({
    default: ({
      href,
      children,
      ...props
    }: { href: string; children: ReactNode } & ComponentProps<'a'>) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  }));
}

// ── Convex mocks ────────────────────────────────────────────────

/**
 * Mock `convex/react` and `convex-helpers/react/sessions`.
 * Provides no-op implementations for all commonly used hooks.
 */
export function mockConvexReact() {
  vi.mock('convex/react', () => ({
    ConvexProvider: ({ children }: { children: ReactNode }) => children,
    ConvexReactClient: vi.fn(),
    useQuery: vi.fn().mockReturnValue(undefined),
    useMutation: vi.fn().mockReturnValue(vi.fn()),
    useAction: vi.fn().mockReturnValue(vi.fn()),
    useConvex: vi.fn().mockReturnValue({}),
    useConvexAuth: vi.fn().mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
    }),
  }));

  vi.mock('convex-helpers/react/sessions', () => ({
    SessionProvider: ({ children }: { children: ReactNode }) => children,
    useSessionQuery: vi.fn().mockReturnValue(undefined),
    useSessionMutation: vi.fn().mockReturnValue(vi.fn()),
  }));
}

// ── Backend API mock ────────────────────────────────────────────

/**
 * Mock the Convex generated API module.
 */
export function mockConvexApi() {
  vi.mock('@workspace/backend/convex/_generated/api', () => ({
    api: {},
  }));
}

// ── Auth state mocks ────────────────────────────────────────────

/**
 * Mock `@/modules/auth/AuthProvider` with a configurable auth state.
 *
 * @param state - Auth state to return from `useAuthState()`. Pass `undefined` for loading.
 *                Defaults to an unauthenticated state.
 */
export function mockAuthState(state?: {
  sessionId?: string;
  state?: 'authenticated' | 'unauthenticated';
  reason?: string;
  user?: Record<string, unknown>;
  accessLevel?: string;
  isSystemAdmin?: boolean;
}) {
  const defaultState = {
    sessionId: 'test-session',
    state: 'unauthenticated' as const,
    reason: 'test',
  };

  const authState = state
    ? {
        sessionId: state.sessionId ?? 'test-session',
        state: state.state ?? 'unauthenticated',
        reason: state.reason ?? 'test',
        ...(state.state === 'authenticated'
          ? {
              user: state.user ?? { _id: 'test-user', _creationTime: Date.now(), type: 'anonymous', name: 'Test User' },
              accessLevel: state.accessLevel ?? 'user',
              isSystemAdmin: state.isSystemAdmin ?? false,
            }
          : {}),
      }
    : defaultState;

  vi.mock('@/modules/auth/AuthProvider', () => ({
    AuthProvider: ({ children }: { children: ReactNode }) => children,
    useAuthState: () => authState,
    useCurrentUser: () => (authState.state === 'authenticated' ? authState.user : undefined),
  }));
}

// ── Feature flag mocks ──────────────────────────────────────────

/**
 * Mock `@workspace/backend/config/featureFlags` with optional overrides.
 *
 * @param overrides - Partial feature flag values to merge with defaults
 */
export function mockFeatureFlags(overrides?: Record<string, unknown>) {
  const defaults = { disableLogin: false };

  vi.mock('@workspace/backend/config/featureFlags', () => ({
    featureFlags: { ...defaults, ...overrides },
  }));
}

// ── Render wrapper ──────────────────────────────────────────────

/**
 * Render a component with all standard providers mocked.
 * Wraps `@testing-library/react`'s `render` with common setup.
 *
 * @example
 * renderWithProviders(<MyPage />)
 */
export function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// ── Convenience: setup all mocks at once ────────────────────────

/**
 * Setup all standard mocks for a test file.
 * Call in a top-level `beforeAll` or directly in the test file.
 *
 * Mocks: next/navigation, next/link, convex, convex API, auth state, feature flags.
 *
 * @param opts - Optional overrides
 */
export function setupTestMocks(opts?: {
  pathname?: string;
  searchParams?: Record<string, string>;
  authState?: Parameters<typeof mockAuthState>[0];
  featureFlags?: Record<string, unknown>;
}) {
  mockNextNavigation({ pathname: opts?.pathname, searchParams: opts?.searchParams });
  mockNextLink();
  mockConvexReact();
  mockConvexApi();
  mockAuthState(opts?.authState);
  mockFeatureFlags(opts?.featureFlags);
}
