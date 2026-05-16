/**
 * Settings page UI spec — TDD tests written before implementation.
 *
 * Tests: loading state, not-in-family state, in-family state,
 * account section, copy family ID, approve join, leave family.
 *
 * Mirrors the mobile settings (family management) experience.
 */
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { userEvent } from '@testing-library/user-event';

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
  usePathname: () => '/app/settings',
  useParams: () => ({}),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());

// ── Mutable session mutation mocks ──────────────────────────────

const mockInitUser = vi.fn().mockResolvedValue({ familyId: 'fam-new' });
const mockRequestJoin = vi.fn().mockResolvedValue(undefined);
const mockApproveJoin = vi.fn().mockResolvedValue(undefined);
const mockLeaveFamily = vi.fn().mockResolvedValue(undefined);

// Track which mutation is requested — tests will configure
let mockCreateMutation = mockInitUser;

vi.mock('convex-helpers/react/sessions', () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSessionMutation: (mutationRef: unknown) => {
    // Return appropriate mock based on what the component requests
    return mockCreateMutation;
  },
  useSessionQuery: () => mockQueryResult,
  useSessionPaginatedQuery: () => ({
    results: [],
    status: 'Exhausted',
    isLoading: false,
    loadMore: vi.fn(),
  }),
}));

// ── Mutable query result ────────────────────────────────────────

let mockQueryResult: unknown = undefined; // loading
let mockIsLoading = true;

// Override useSessionQuery to respect loading state
const origSessionModule = {
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSessionMutation: () => mockCreateMutation,
  useSessionQuery: () => mockQueryResult,
  useSessionPaginatedQuery: () => ({
    results: [],
    status: 'Exhausted',
    isLoading: false,
    loadMore: vi.fn(),
  }),
};

vi.doMock('convex-helpers/react/sessions', () => origSessionModule);

// ── Re-mock with loading state support ─────────────────────────
vi.mock('convex-helpers/react/sessions', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const React = require('react');
  return {
    SessionProvider: ({ children }: { children: ReactNode }) => children,
    useSessionMutation: () => mockCreateMutation,
    useSessionQuery: () => (mockIsLoading ? undefined : mockQueryResult),
    useSessionPaginatedQuery: () => ({
      results: [],
      status: 'Exhausted',
      isLoading: false,
      loadMore: vi.fn(),
    }),
  };
});

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

// ── Clipboard mock ──────────────────────────────────────────────

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// ── Test helpers ────────────────────────────────────────────────

/** Reset all mutable mock state between tests. */
function resetMocks() {
  mockRouterPush.mockClear();
  mockInitUser.mockClear();
  mockRequestJoin.mockClear();
  mockApproveJoin.mockClear();
  mockLeaveFamily.mockClear();
  mockQueryResult = undefined;
  mockIsLoading = false;
  mockCreateMutation = mockInitUser;
  currentAuthState = {
    sessionId: 'test-session',
    state: 'authenticated',
    user: { _id: 'user-1', _creationTime: Date.now(), type: 'anonymous', name: 'Test User' },
    accessLevel: 'user',
    isSystemAdmin: false,
  };
}

/** Family mock with join requests. */
function makeFamilyResult(overrides?: Record<string, unknown>) {
  return {
    _id: 'fam-1',
    _creationTime: Date.now(),
    name: 'Test Family',
    joinRequests: [
      { _id: 'jr-1', userId: 'user-pending', status: 'pending' },
    ],
    ...overrides,
  };
}

/** Standard Google user auth state. */
function makeGoogleAuthState() {
  return {
    sessionId: 'test-session',
    state: 'authenticated',
    user: {
      _id: 'user-g1',
      _creationTime: Date.now(),
      type: 'google',
      name: 'Google User',
      email: 'google@example.com',
    },
    accessLevel: 'user',
    isSystemAdmin: false,
  } as Record<string, unknown>;
}

// ── Import page (after all mocks) ────────────────────────────────

import SettingsPage from './page';

// ── Tests ───────────────────────────────────────────────────────

describe('Settings page', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ── 1. Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('shows a spinner while family query loads', () => {
      mockIsLoading = true;
      mockQueryResult = undefined;

      render(<SettingsPage />);

      // Should show a loading indicator
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ── 2. Account section ────────────────────────────────────────

  describe('account section', () => {
    it('shows user name from auth state', async () => {
      mockIsLoading = false;
      mockQueryResult = null; // not in family

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Account')).toBeInTheDocument();
      });
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('shows "Anonymous user" for anonymous accounts', async () => {
      currentAuthState = {
        sessionId: 'test-session',
        state: 'authenticated',
        user: { _id: 'user-1', _creationTime: Date.now(), type: 'anonymous', name: '' },
        accessLevel: 'user',
        isSystemAdmin: false,
      };
      mockIsLoading = false;
      mockQueryResult = null;

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Anonymous user')).toBeInTheDocument();
      });
    });

    it('shows Google label for google auth', async () => {
      currentAuthState = makeGoogleAuthState();
      mockIsLoading = false;
      mockQueryResult = null;

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Google User')).toBeInTheDocument();
      });
      // Auth method should show "Google"
      const authMethodEls = screen.getAllByText('Google');
      expect(authMethodEls.length).toBeGreaterThan(0);
    });

    it('has a link to profile page', async () => {
      mockIsLoading = false;
      mockQueryResult = null;

      render(<SettingsPage />);

      await waitFor(() => {
        const profileLink = screen.getByText(/profile/i);
        expect(profileLink).toBeInTheDocument();
        expect(profileLink.closest('a')).toHaveAttribute('href', '/app/profile');
      });
    });
  });

  // ── 3. Not in family state ────────────────────────────────────

  describe('not in family', () => {
    beforeEach(() => {
      mockIsLoading = false;
      mockQueryResult = null;
    });

    it('shows "Create Family" button', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Family')).toBeInTheDocument();
      });
    });

    it('shows Family ID input and "Request to Join" button', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/family id/i)).toBeInTheDocument();
        expect(screen.getByText('Request to Join')).toBeInTheDocument();
      });
    });

    it('Create Family calls initUser mutation and shows family', async () => {
      mockCreateMutation = mockInitUser;
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Family')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Create Family'));

      await waitFor(() => {
        expect(mockInitUser).toHaveBeenCalled();
      });
    });

    it('Request to Join calls requestJoin with entered family ID', async () => {
      mockCreateMutation = mockRequestJoin;
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/family id/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/family id/i);
      await userEvent.type(input, 'fam-abc123');

      await userEvent.click(screen.getByText('Request to Join'));

      await waitFor(() => {
        expect(mockRequestJoin).toHaveBeenCalledWith(
          expect.objectContaining({ familyId: 'fam-abc123' })
        );
      });
    });
  });

  // ── 4. In family state ────────────────────────────────────────

  describe('in family', () => {
    beforeEach(() => {
      mockIsLoading = false;
      mockQueryResult = makeFamilyResult();
    });

    it('shows family section with family ID', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Family')).toBeInTheDocument();
      });
      expect(screen.getByText(/fam-1/)).toBeInTheDocument();
    });

    it('shows copy button for family ID', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/copy/i)).toBeInTheDocument();
      });
    });

    it('copies family ID to clipboard on copy click', async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/copy/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/copy/i));

      expect(writeTextSpy).toHaveBeenCalledWith('fam-1');
    });

    it('shows pending join requests', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/pending join/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/user-pending/)).toBeInTheDocument();
    });

    it('shows Approve button for pending requests', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
      });
    });

    it('Approve calls approveJoin with requesterUserId', async () => {
      mockCreateMutation = mockApproveJoin;
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Approve'));

      await waitFor(() => {
        expect(mockApproveJoin).toHaveBeenCalledWith(
          expect.objectContaining({ requesterUserId: 'user-pending' })
        );
      });
    });

    it('shows Leave Family button', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Leave Family')).toBeInTheDocument();
      });
    });

    it('shows confirmation UI when Leave is clicked', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Leave Family')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Leave Family'));

      await waitFor(() => {
        // Should now show a confirm step — either a "Confirm" button or warning text
        expect(screen.getByText(/confirm/i)).toBeInTheDocument();
      });
    });

    it('confirms leave and calls leave mutation', async () => {
      mockCreateMutation = mockLeaveFamily;
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Leave Family')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Leave Family'));

      await waitFor(() => {
        expect(screen.getByText(/confirm/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/confirm/i));

      await waitFor(() => {
        expect(mockLeaveFamily).toHaveBeenCalled();
      });
    });
  });

  // ── 5. Unauthenticated guard ──────────────────────────────────

  describe('unauthenticated', () => {
    it('renders nothing when not authenticated', () => {
      currentAuthState = {
        sessionId: 'test-session',
        state: 'unauthenticated',
        reason: 'test',
      };
      mockIsLoading = false;
      mockQueryResult = null;

      render(<SettingsPage />);

      expect(screen.queryByText('Account')).not.toBeInTheDocument();
      expect(screen.queryByText('Family')).not.toBeInTheDocument();
    });
  });
});
