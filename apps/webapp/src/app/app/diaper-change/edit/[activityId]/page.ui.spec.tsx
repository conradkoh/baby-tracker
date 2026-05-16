/**
 * Diaper change edit page UI spec — TDD tests written before implementation.
 *
 * Tests: pre-populated diaper type + datetime, loading state,
 * save/delete mutations, cancel navigation, unauthenticated guard.
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
let mockQueryResult: Record<string, unknown> | undefined = undefined;
let mockMutate = vi.fn().mockResolvedValue(undefined);

const EXISTING_DIRTY: Record<string, unknown> = {
  _id: 'act-diaper-1',
  _creationTime: Date.now(),
  timestamp: '2025-01-15T10:00:00.000Z',
  type: 'diaper_change',
  diaperChange: { type: 'dirty' },
};

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
  usePathname: () => '/app/diaper-change/edit/act-diaper-1',
  useParams: () => ({ activityId: 'act-diaper-1' }),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());

vi.mock('convex-helpers/react/sessions', () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSessionQuery: () => mockQueryResult,
  useSessionMutation: () => mockMutate,
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
  mockMutate.mockClear();
  mockMutate.mockResolvedValue(undefined);
  mockQueryResult = undefined;
  currentAuthState = {
    sessionId: 'test-session',
    state: 'authenticated',
    user: { _id: 'user-1', _creationTime: Date.now(), type: 'anonymous', name: 'Test User' },
    accessLevel: 'user',
    isSystemAdmin: false,
  };
}

// ── Import page (after all mocks) ────────────────────────────────

import DiaperEditPage from './page';

// ── Tests ───────────────────────────────────────────────────────

describe('Diaper change edit page', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ── 1. Unauthenticated ────────────────────────────────────────

  describe('unauthenticated', () => {
    it('renders nothing when not authenticated', () => {
      currentAuthState = {
        sessionId: 'test-session',
        state: 'unauthenticated',
        reason: 'test',
      };

      const { container } = render(<DiaperEditPage />);
      expect(container.innerHTML).toBe('');
    });
  });

  // ── 2. Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('shows loading indicator while fetching activity', () => {
      mockQueryResult = undefined;
      render(<DiaperEditPage />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  // ── 3. Pre-populated diaper type ──────────────────────────────

  describe('pre-population', () => {
    beforeEach(() => {
      mockQueryResult = EXISTING_DIRTY;
    });

    it('selects existing diaper type (dirty) in radio group', async () => {
      render(<DiaperEditPage />);

      await waitFor(() => {
        const dirtyRadio = screen.getByRole('radio', { name: /dirty/i });
        expect(dirtyRadio).toBeChecked();
      });
    });

    it('pre-populates datetime from existing timestamp', async () => {
      render(<DiaperEditPage />);

      await waitFor(() => {
        const dtInput = screen.getByLabelText(/date/i) as HTMLInputElement;
        expect(dtInput.value).toBe('2025-01-15T10:00');
      });
    });
  });

  // ── 4. Save updates ───────────────────────────────────────────

  describe('save', () => {
    it('calls update mutation with modified type', async () => {
      const user = userEvent.setup();
      mockQueryResult = EXISTING_DIRTY;
      render(<DiaperEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /mixed/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: /mixed/i }));
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          activityId: 'act-diaper-1',
          activity: {
            timestamp: expect.any(String),
            type: 'diaper_change',
            diaperChange: { type: 'mixed' },
          },
        });
      });
    });

    it('navigates to activities list after successful save', async () => {
      const user = userEvent.setup();
      mockQueryResult = EXISTING_DIRTY;
      render(<DiaperEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/app');
      });
    });
  });

  // ── 5. Delete ─────────────────────────────────────────────────

  describe('delete', () => {
    it('renders a Delete button', async () => {
      mockQueryResult = EXISTING_DIRTY;
      render(<DiaperEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('calls delete mutation then navigates to activities', async () => {
      const user = userEvent.setup();
      mockQueryResult = EXISTING_DIRTY;
      render(<DiaperEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          activityId: 'act-diaper-1',
        });
        expect(mockRouterPush).toHaveBeenCalledWith('/app');
      });
    });
  });

  // ── 6. Cancel ─────────────────────────────────────────────────

  describe('cancel', () => {
    it('navigates to activities list when Cancel is clicked', async () => {
      const user = userEvent.setup();
      mockQueryResult = EXISTING_DIRTY;
      render(<DiaperEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      expect(mockRouterPush).toHaveBeenCalledWith('/app');
    });
  });
});
