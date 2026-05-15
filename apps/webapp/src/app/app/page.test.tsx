/**
 * App dashboard page smoke test — verifies the page mounts and
 * renders different content based on auth state.
 */
import { render, screen } from '@/__tests__/test-utils';
import { describe, expect, it, vi } from 'vitest';

import {
  createApiMock,
  createAuthMock,
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

// ── Tests ───────────────────────────────────────────────────────

import AppPage from './page';

describe('App dashboard page', () => {
  describe('when unauthenticated', () => {
    beforeEach(() => {
      vi.doMock('@/modules/auth/AuthProvider', () =>
        createAuthMock({ state: 'unauthenticated' })
      );
    });

    it('renders the page without crashing', () => {
      expect(() => render(<AppPage />)).not.toThrow();
    });

    it('displays the welcome heading', () => {
      render(<AppPage />);
      expect(screen.getByText('Welcome to the App')).toBeInTheDocument();
    });

    it('shows the view profile link', () => {
      render(<AppPage />);
      expect(screen.getByText('View Profile')).toBeInTheDocument();
    });
  });

  describe('when authenticated as anonymous user', () => {
    beforeEach(() => {
      vi.doMock('@/modules/auth/AuthProvider', () =>
        createAuthMock({
          state: 'authenticated',
          user: {
            _id: 'test-user',
            _creationTime: Date.now(),
            type: 'anonymous',
            name: 'Test User',
          },
          accessLevel: 'user',
          isSystemAdmin: false,
        })
      );
    });

    it('renders the what\'s next section when authenticated', () => {
      render(<AppPage />);
      expect(screen.getByText("What's Next?")).toBeInTheDocument();
    });
  });
});
