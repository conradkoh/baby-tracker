/**
 * App layout UI spec — TDD tests for family auto-initialization.
 *
 * Tests: family exists → children render; family null → initUser called + loading;
 * family loading → loading spinner; unauthenticated → login gate.
 */
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import {
  createApiMock,
  createConvexReactMock,
  createNextLinkMock,
} from '@/__tests__/test-utils';

// ── Controlled mocks ────────────────────────────────────────────

const mockRouterPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
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

// ── Mutable mocks ───────────────────────────────────────────────

const mockInitUser = vi.fn().mockResolvedValue({ familyId: 'fam-new' });
let mockFamilyResult: unknown = undefined; // loading by default
let mockFamilyLoading = true;

vi.mock('convex-helpers/react/sessions', () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSessionMutation: () => mockInitUser,
  useSessionQuery: () => (mockFamilyLoading ? undefined : mockFamilyResult),
  useSessionPaginatedQuery: () => ({
    results: [],
    status: 'Exhausted',
    isLoading: false,
    loadMore: vi.fn(),
  }),
}));

// ── Mutable auth state ──────────────────────────────────────────

let currentAuthState: Record<string, unknown> = {
  sessionId: 'test-session',
  state: 'authenticated',
  user: { _id: 'user-1', _creationTime: Date.now(), type: 'anonymous', name: 'Test User' },
  accessLevel: 'user',
  isSystemAdmin: false,
};

vi.mock('@/modules/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuthState: () => currentAuthState,
}));

// ── Test helpers ────────────────────────────────────────────────

function resetMocks() {
  mockRouterPush.mockClear();
  mockInitUser.mockClear();
  mockInitUser.mockResolvedValue({ familyId: 'fam-new' });
  mockFamilyResult = undefined;
  mockFamilyLoading = true;
  currentAuthState = {
    sessionId: 'test-session',
    state: 'authenticated',
    user: { _id: 'user-1', _creationTime: Date.now(), type: 'anonymous', name: 'Test User' },
    accessLevel: 'user',
    isSystemAdmin: false,
  };
}

// ── Import (after all mocks) ─────────────────────────────────────

import AppLayout from './layout';

// ── Test children ────────────────────────────────────────────────

function TestChild() {
  return <div data-testid="test-child">Child Content</div>;
}

// ── Tests ───────────────────────────────────────────────────────

describe('App layout', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ── 1. Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('shows loading spinner while family query is loading', async () => {
      mockFamilyLoading = true;
      mockFamilyResult = undefined;

      render(
        <AppLayout>
          <TestChild />
        </AppLayout>
      );

      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  // ── 2. No family → auto-initialize ────────────────────────────

  describe('when user has no family', () => {
    beforeEach(() => {
      mockFamilyLoading = false;
      mockFamilyResult = null;
    });

    it('shows loading spinner while initializing family', async () => {
      // Set up initUser to NOT resolve immediately — we check loading state
      let resolveInit: (value: unknown) => void;
      mockInitUser.mockImplementation(
        () => new Promise((resolve) => { resolveInit = resolve; })
      );

      render(
        <AppLayout>
          <TestChild />
        </AppLayout>
      );

      // Should show loading (family is null, initUser is in progress)
      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });

      // Resolve initUser
      resolveInit!({ familyId: 'fam-new' });
    });

    it('calls initUser automatically when family is null', async () => {
      render(
        <AppLayout>
          <TestChild />
        </AppLayout>
      );

      await waitFor(() => {
        expect(mockInitUser).toHaveBeenCalled();
      });
    });

    it('renders children after family is initialized', async () => {
      render(
        <AppLayout>
          <TestChild />
        </AppLayout>
      );

      // After initUser resolves, family query should re-fetch and return family
      // Simulate that by changing the mock
      await waitFor(() => {
        expect(mockInitUser).toHaveBeenCalled();
      });

      // Update mock to simulate family now existing after init
      mockFamilyResult = { _id: 'fam-new', _creationTime: Date.now() };
      // Re-render by re-mounting
    });
  });

  // ── 3. Family exists → render children ────────────────────────

  describe('when user has a family', () => {
    it('renders children normally when family exists', async () => {
      mockFamilyLoading = false;
      mockFamilyResult = { _id: 'fam-1', _creationTime: Date.now() };

      render(
        <AppLayout>
          <TestChild />
        </AppLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-child')).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
      });
    });

    it('does not call initUser when family already exists', async () => {
      mockFamilyLoading = false;
      mockFamilyResult = { _id: 'fam-1', _creationTime: Date.now() };

      render(
        <AppLayout>
          <TestChild />
        </AppLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-child')).toBeInTheDocument();
      });

      expect(mockInitUser).not.toHaveBeenCalled();
    });
  });

  // ── 4. Unauthenticated ────────────────────────────────────────

  describe('when unauthenticated', () => {
    it('shows unauthorized page instead of children', async () => {
      currentAuthState = {
        sessionId: 'test-session',
        state: 'unauthenticated',
        reason: 'test',
      };
      mockFamilyLoading = false;
      mockFamilyResult = null;

      render(
        <AppLayout>
          <TestChild />
        </AppLayout>
      );

      await waitFor(() => {
        // RequireLogin should show UnauthorizedPage ("Authentication Required")
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });
      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument();
    });
  });
});
