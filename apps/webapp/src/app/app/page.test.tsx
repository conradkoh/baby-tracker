/**
 * App home page smoke test — verifies the page mounts with
 * the new activity feed + summary card implementation.
 */
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import {
  createApiMock,
  createConvexReactMock,
  createNextLinkMock,
} from '@/__tests__/test-utils';

// ── Top-level mocks ─────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/app',
  useParams: () => ({}),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());

vi.mock('convex-helpers/react/sessions', () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSessionPaginatedQuery: () => ({
    results: [],
    status: 'Exhausted',
    isLoading: false,
    loadMore: vi.fn(),
  }),
}));

// Mutable auth state
let currentAuthState: Record<string, unknown> = {
  sessionId: 'test-session',
  state: 'unauthenticated',
  reason: 'test',
};

vi.mock('@/modules/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuthState: () => currentAuthState,
}));

// ── Tests ───────────────────────────────────────────────────────

import AppHomePage from './page';

describe('App home page', () => {
  describe('when unauthenticated', () => {
    it('renders the page without crashing', () => {
      currentAuthState = { sessionId: 'test-session', state: 'unauthenticated', reason: 'test' };
      expect(() => render(<AppHomePage />)).not.toThrow();
    });

    it('returns null (renders nothing) when unauthenticated', () => {
      currentAuthState = { sessionId: 'test-session', state: 'unauthenticated', reason: 'test' };
      render(<AppHomePage />);
      expect(screen.queryByText('Feed')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    it('shows action buttons', async () => {
      currentAuthState = {
        sessionId: 'test-session',
        state: 'authenticated',
        user: { _id: 'user-1', _creationTime: Date.now(), type: 'anonymous', name: 'Test User' },
        accessLevel: 'user',
        isSystemAdmin: false,
      };
      render(<AppHomePage />);
      await waitFor(() => {
        expect(screen.getByText('No activities yet')).toBeInTheDocument();
      });
      expect(screen.getByText('Feed')).toBeInTheDocument();
    });
  });
});
