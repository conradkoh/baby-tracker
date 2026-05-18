/**
 * Feed edit page UI spec — TDD tests written before implementation.
 *
 * Tests: pre-populated fields for latch/bottle/solids, date/time,
 * feed type tab, save/delete mutations, cancel navigation,
 * and unauthenticated guard.
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
const mockUpdateActivity = vi.fn().mockResolvedValue(undefined);
const mockDeleteActivity = vi.fn().mockResolvedValue(undefined);

// Mutable query result for useSessionQuery
let mockQueryResult: Record<string, unknown> | undefined = undefined;

// Mutable mutation mock — one for all mutations
let mockMutate = vi.fn().mockResolvedValue(undefined);

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
  usePathname: () => '/app/feed/edit/act-test-1',
  useParams: () => ({ activityId: 'act-test-1' }),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());

// ── Mutable session hooks mock ──────────────────────────────────

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
  mockUpdateActivity.mockClear();
  mockUpdateActivity.mockResolvedValue(undefined);
  mockDeleteActivity.mockClear();
  mockDeleteActivity.mockResolvedValue(undefined);
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

/** Get an input by its id. */
function getById(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

/** Create a mock latch activity for the query result. */
function makeLatchQueryResult() {
  return {
    status: 'found',
    data: {
      _id: 'act-test-1',
      _creationTime: Date.now(),
      timestamp: '2025-01-15T14:30:00.000Z',
      type: 'feed',
      feed: {
        type: 'latch',
        duration: {
          left: { seconds: 630 },
          right: { seconds: 300 },
        },
      },
    },
  };
}

/** Create a mock expressed bottle activity for the query result. */
function makeBottleQueryResult() {
  return {
    status: 'found',
    data: {
      _id: 'act-test-1',
      _creationTime: Date.now(),
      timestamp: '2025-01-15T14:30:00.000Z',
      type: 'feed',
      feed: {
        type: 'expressed',
        volume: { ml: 150 },
      },
    },
  };
}

/** Create a mock solids activity for the query result. */
function makeSolidsQueryResult() {
  return {
    status: 'found',
    data: {
      _id: 'act-test-1',
      _creationTime: Date.now(),
      timestamp: '2025-01-15T14:30:00.000Z',
      type: 'feed',
      feed: {
        type: 'solids',
        description: 'Apple puree',
      },
    },
  };
}

// ── Import page (after all mocks) ────────────────────────────────

import FeedEditPage from './page';

// ── Tests ───────────────────────────────────────────────────────

describe('Feed edit page', () => {
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

      const { container } = render(<FeedEditPage />);
      expect(container.innerHTML).toBe('');
    });
  });

  // ── 2. Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('shows loading indicator while fetching activity', () => {
      mockQueryResult = undefined;
      render(<FeedEditPage />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  // ── 3. Pre-populated latch fields ─────────────────────────────

  describe('latch feed pre-population', () => {
    beforeEach(() => {
      mockQueryResult = makeLatchQueryResult();
    });

    it('shows left min and sec pre-populated', async () => {
      render(<FeedEditPage />);

      await waitFor(() => {
        const leftMin = getById('left-min');
        const leftSec = getById('left-sec');
        expect(leftMin.value).toBe('10');
        expect(leftSec.value).toBe('30');
      });
    });

    it('shows right min and sec pre-populated', async () => {
      render(<FeedEditPage />);

      await waitFor(() => {
        const rightMin = getById('right-min');
        const rightSec = getById('right-sec');
        expect(rightMin.value).toBe('5');
        expect(rightSec.value).toBe('0');
      });
    });

    it('shows Latch tab as active', async () => {
      render(<FeedEditPage />);

      await waitFor(() => {
        const latchTab = screen.getByRole('tab', { name: 'Latch' });
        expect(latchTab.getAttribute('data-state')).toBe('active');
      });
    });
  });

  // ── 4. Pre-populated bottle fields ────────────────────────────

  describe('bottle feed pre-population', () => {
    beforeEach(() => {
      mockQueryResult = makeBottleQueryResult();
    });

    it('shows volume pre-populated', async () => {
      render(<FeedEditPage />);

      await waitFor(() => {
        const volumeInput = screen.getByLabelText(/volume/i) as HTMLInputElement;
        expect(volumeInput.value).toBe('150');
      });
    });

    it('shows Expressed tab as active', async () => {
      render(<FeedEditPage />);

      await waitFor(() => {
        const expressedTab = screen.getByRole('tab', { name: 'Expressed' });
        expect(expressedTab.getAttribute('data-state')).toBe('active');
      });
    });
  });

  // ── 5. Pre-populated solids fields ────────────────────────────

  describe('solids feed pre-population', () => {
    beforeEach(() => {
      mockQueryResult = makeSolidsQueryResult();
    });

    it('shows description pre-populated', async () => {
      render(<FeedEditPage />);

      await waitFor(() => {
        const descInput = screen.getByLabelText(/description/i) as HTMLInputElement;
        expect(descInput.value).toBe('Apple puree');
      });
    });

    it('shows Solids tab as active', async () => {
      render(<FeedEditPage />);

      await waitFor(() => {
        const solidsTab = screen.getByRole('tab', { name: 'Solids' });
        expect(solidsTab.getAttribute('data-state')).toBe('active');
      });
    });
  });

  // ── 6. DateTime pre-populated ─────────────────────────────────

  describe('date time pre-population', () => {
    it('shows existing timestamp in datetime input', async () => {
      mockQueryResult = makeLatchQueryResult();
      render(<FeedEditPage />);

      await waitFor(() => {
        const dtInput = screen.getByLabelText(/date/i) as HTMLInputElement;
        expect(dtInput.value).toBe('2025-01-15T22:30');
      });
    });
  });

  // ── 7. Save updates activity ──────────────────────────────────

  describe('save', () => {
    it('calls update mutation with modified values', async () => {
      const user = userEvent.setup();
      mockQueryResult = makeLatchQueryResult();
      render(<FeedEditPage />);

      await waitFor(() => {
        expect(getById('left-min')).toBeInTheDocument();
      });

      // Modify left min
      const leftMin = getById('left-min');
      await user.clear(leftMin);
      await user.type(leftMin, '15');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          activityId: 'act-test-1',
          activity: {
            timestamp: expect.any(String),
            type: 'feed',
            feed: {
              type: 'latch',
              duration: {
                left: { seconds: 930 },
                right: { seconds: 300 },
              },
            },
          },
        });
      });
    });

    it('navigates to activities list after successful update', async () => {
      const user = userEvent.setup();
      mockQueryResult = makeLatchQueryResult();
      render(<FeedEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/app');
      });
    });
  });

  // ── 8. Delete activity ────────────────────────────────────────

  describe('delete', () => {
    it('renders a Delete button', async () => {
      mockQueryResult = makeLatchQueryResult();
      render(<FeedEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('calls delete mutation then navigates to activities', async () => {
      const user = userEvent.setup();
      mockQueryResult = makeLatchQueryResult();
      render(<FeedEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          activityId: 'act-test-1',
        });
        expect(mockRouterPush).toHaveBeenCalledWith('/app');
      });
    });
  });

  // ── 9. Cancel navigation ──────────────────────────────────────

  describe('cancel', () => {
    it('navigates to activities list when Cancel is clicked', async () => {
      const user = userEvent.setup();
      mockQueryResult = makeLatchQueryResult();
      render(<FeedEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      expect(mockRouterPush).toHaveBeenCalledWith('/app');
    });
  });
});
