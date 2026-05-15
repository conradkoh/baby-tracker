/**
 * App dashboard page smoke test — verifies the page mounts and
 * renders different content based on auth state.
 */
import { render, screen } from '@/__tests__/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import {
  createApiMock,
  createConvexReactMock,
  createFeatureFlagsMock,
  createNextLinkMock,
  createNextNavMock,
  createSessionHelpersMock,
} from '@/__tests__/test-utils';

// ── Top-level mocks ─────────────────────────────────────────────

vi.mock('next/navigation', () => createNextNavMock());
vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('convex-helpers/react/sessions', () => createSessionHelpersMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());
vi.mock('@workspace/backend/config/featureFlags', () => createFeatureFlagsMock());

// Mutable auth state — update in tests to change what useAuthState returns
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

import AppPage from './page';

describe('App dashboard page', () => {
  describe('when unauthenticated', () => {
    it('renders the page without crashing', () => {
      currentAuthState = { sessionId: 'test-session', state: 'unauthenticated', reason: 'test' };
      expect(() => render(<AppPage />)).not.toThrow();
    });

    it('displays the welcome heading', () => {
      currentAuthState = { sessionId: 'test-session', state: 'unauthenticated', reason: 'test' };
      render(<AppPage />);
      expect(screen.getByText('Welcome to the App')).toBeInTheDocument();
    });
  });

  describe('when authenticated as anonymous user', () => {
    it("renders the what's next section when authenticated", () => {
      currentAuthState = {
        sessionId: 'test-session',
        state: 'authenticated',
        user: { _id: 'test-user', _creationTime: Date.now(), type: 'anonymous', name: 'Test User' },
        accessLevel: 'user',
        isSystemAdmin: false,
      };
      render(<AppPage />);
      expect(screen.getByText("What's Next?")).toBeInTheDocument();
    });
  });
});
