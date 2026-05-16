/**
 * Activity list page UI spec — TDD tests written before implementation.
 *
 * Tests: loading, empty, all activity types, display formatting,
 * date grouping, action buttons, and row click navigation.
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
  usePathname: () => '/app/activities',
  useParams: () => ({}),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());

// ── Mutable paginated query state ───────────────────────────────

let mockResults: Record<string, unknown>[] = [];
let mockStatus: string = 'Exhausted';
let mockIsLoading = false;
const mockLoadMore = vi.fn();

vi.mock('convex-helpers/react/sessions', () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSessionPaginatedQuery: () => ({
    results: mockResults,
    status: mockStatus,
    isLoading: mockIsLoading,
    loadMore: mockLoadMore,
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

/** Reset all mutable mock state between tests. */
function resetMocks() {
  mockResults = [];
  mockStatus = 'Exhausted';
  mockIsLoading = false;
  mockRouterPush.mockClear();
  mockLoadMore.mockClear();
}

/** Create a mock feed (latch) activity. */
function makeLatchActivity(overrides?: Partial<Record<string, unknown>>) {
  return {
    _id: 'act-1',
    _creationTime: Date.now(),
    timestamp: '2025-01-15T14:30:00.000Z',
    type: 'feed',
    feed: {
      type: 'latch',
      duration: { left: { seconds: 300 }, right: { seconds: 180 } },
    },
    ...overrides,
  };
}

/** Create a mock feed (expressed bottle) activity. */
function makeBottleActivity(overrides?: Partial<Record<string, unknown>>) {
  return {
    _id: 'act-2',
    _creationTime: Date.now() - 1000,
    timestamp: '2025-01-15T12:00:00.000Z',
    type: 'feed',
    feed: {
      type: 'expressed',
      volume: { ml: 120 },
    },
    ...overrides,
  };
}

/** Create a mock feed (solids) activity. */
function makeSolidsActivity(overrides?: Partial<Record<string, unknown>>) {
  return {
    _id: 'act-3',
    _creationTime: Date.now() - 2000,
    timestamp: '2025-01-14T18:00:00.000Z',
    type: 'feed',
    feed: {
      type: 'solids',
      description: 'Banana porridge',
    },
    ...overrides,
  };
}

/** Create a mock diaper change activity. */
function makeDiaperActivity(overrides?: Partial<Record<string, unknown>>) {
  return {
    _id: 'act-4',
    _creationTime: Date.now() - 3000,
    timestamp: '2025-01-14T16:30:00.000Z',
    type: 'diaper_change',
    diaperChange: {
      type: 'wet',
    },
    ...overrides,
  };
}

/** Create a mock medical (temperature) activity. */
function makeTemperatureActivity(overrides?: Partial<Record<string, unknown>>) {
  return {
    _id: 'act-5',
    _creationTime: Date.now() - 4000,
    timestamp: '2025-01-14T09:00:00.000Z',
    type: 'medical',
    medical: {
      type: 'temperature',
      temperature: { value: 37.5 },
    },
    ...overrides,
  };
}

/** Create a mock medical (medicine) activity. */
function makeMedicineActivity(overrides?: Partial<Record<string, unknown>>) {
  return {
    _id: 'act-6',
    _creationTime: Date.now() - 5000,
    timestamp: '2025-01-13T20:00:00.000Z',
    type: 'medical',
    medical: {
      type: 'medicine',
      medicine: { name: 'Paracetamol', unit: 'ml', value: 5 },
    },
    ...overrides,
  };
}

// ── Import page (after all mocks) ────────────────────────────────

import ActivityListPage from './page';

// ── Tests ───────────────────────────────────────────────────────

describe('Activity list page', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ── 1. Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('shows a loading indicator while fetching activities', () => {
      mockIsLoading = true;
      mockStatus = 'LoadingFirstPage';
      mockResults = [];

      render(<ActivityListPage />);

      // Should show a spinner or loading text
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  // ── 2. Empty state ────────────────────────────────────────────

  describe('empty state', () => {
    it('shows empty message when no activities exist', async () => {
      mockIsLoading = false;
      mockStatus = 'Exhausted';
      mockResults = [];

      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText(/no activities/i)).toBeInTheDocument();
      });
    });
  });

  // ── 3. Activity types & display format ────────────────────────

  describe('activity display', () => {
    beforeEach(() => {
      mockIsLoading = false;
      mockStatus = 'Exhausted';
      mockResults = [
        makeLatchActivity(),
        makeBottleActivity(),
        makeSolidsActivity(),
        makeDiaperActivity(),
        makeTemperatureActivity(),
        makeMedicineActivity(),
      ];
    });

    it('renders latch feed with duration', async () => {
      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Latch Feed')).toBeInTheDocument();
      });
      // 300s left + 180s right = 5 min 0 sec and 3 min 0 sec
      expect(screen.getByText(/5 min 0 sec/)).toBeInTheDocument();
      expect(screen.getByText(/3 min 0 sec/)).toBeInTheDocument();
    });

    it('renders expressed feed with volume', async () => {
      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Expressed Feed')).toBeInTheDocument();
      });
      expect(screen.getByText(/120 ml/)).toBeInTheDocument();
    });

    it('renders solids feed with description', async () => {
      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Solids Feed')).toBeInTheDocument();
      });
      expect(screen.getByText(/Banana porridge/)).toBeInTheDocument();
    });

    it('renders diaper change with wet type', async () => {
      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Diaper Change')).toBeInTheDocument();
      });
      expect(screen.getByText('Wet')).toBeInTheDocument();
    });

    it('renders temperature reading', async () => {
      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
      });
      expect(screen.getByText(/37\.5\s*°C/)).toBeInTheDocument();
    });

    it('renders medicine with dosage', async () => {
      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Medicine')).toBeInTheDocument();
      });
      expect(screen.getByText(/5 ml Paracetamol/)).toBeInTheDocument();
    });
  });

  // ── 4. Date grouping ──────────────────────────────────────────

  describe('date grouping', () => {
    it('groups activities by date with separators', async () => {
      mockIsLoading = false;
      mockStatus = 'Exhausted';
      mockResults = [
        makeLatchActivity({ timestamp: '2025-01-15T14:30:00.000Z' }),
        makeBottleActivity({ timestamp: '2025-01-15T12:00:00.000Z' }),
        makeSolidsActivity({ timestamp: '2025-01-14T18:00:00.000Z' }),
        makeDiaperActivity({ timestamp: '2025-01-14T16:30:00.000Z' }),
      ];

      render(<ActivityListPage />);

      await waitFor(() => {
        // Should have two date group headers
        const headers = screen.getAllByRole('heading', { level: 3 });
        expect(headers.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // ── 5. Action buttons ─────────────────────────────────────────

  describe('action buttons', () => {
    it('shows Log Feed, Log Diaper, Log Medical buttons when authenticated', async () => {
      mockResults = [];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Log Feed')).toBeInTheDocument();
        expect(screen.getByText('Log Diaper')).toBeInTheDocument();
        expect(screen.getByText('Log Medical')).toBeInTheDocument();
      });
    });

    it('hides action buttons when unauthenticated', () => {
      currentAuthState = {
        sessionId: 'test-session',
        state: 'unauthenticated',
        reason: 'test',
      };
      mockResults = [];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<ActivityListPage />);

      expect(screen.queryByText('Log Feed')).not.toBeInTheDocument();
      expect(screen.queryByText('Log Diaper')).not.toBeInTheDocument();
      expect(screen.queryByText('Log Medical')).not.toBeInTheDocument();
    });
  });

  // ── 6. Row click navigation ───────────────────────────────────

  describe('row click navigation', () => {
    it('navigates to feed edit page on latch activity click', async () => {
      mockResults = [makeLatchActivity({ _id: 'act-feed-1' })];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Latch Feed')).toBeInTheDocument();
      });

      screen.getByText('Latch Feed').closest('button')?.click();

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          expect.stringContaining('/app/activities/feed/edit/act-feed-1')
        );
      });
    });

    it('navigates to diaper edit page on diaper activity click', async () => {
      mockResults = [makeDiaperActivity({ _id: 'act-diaper-1' })];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Diaper Change')).toBeInTheDocument();
      });

      screen.getByText('Diaper Change').closest('button')?.click();

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          expect.stringContaining('/app/activities/diaper-change/edit/act-diaper-1')
        );
      });
    });

    it('navigates to medical edit page on medical activity click', async () => {
      mockResults = [makeTemperatureActivity({ _id: 'act-med-1' })];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
      });

      screen.getByText('Temperature').closest('button')?.click();

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          expect.stringContaining('/app/activities/medical/edit/act-med-1')
        );
      });
    });
  });

  // ── 7. Load more ──────────────────────────────────────────────

  describe('load more', () => {
    it('shows load more button when more pages available', async () => {
      mockResults = [makeLatchActivity()];
      mockIsLoading = false;
      mockStatus = 'CanLoadMore';

      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText(/load more/i)).toBeInTheDocument();
      });
    });

    it('calls loadMore when load more button clicked', async () => {
      mockResults = [makeLatchActivity()];
      mockIsLoading = false;
      mockStatus = 'CanLoadMore';

      render(<ActivityListPage />);

      await waitFor(() => {
        expect(screen.getByText(/load more/i)).toBeInTheDocument();
      });

      screen.getByText(/load more/i).click();

      expect(mockLoadMore).toHaveBeenCalled();
    });
  });
});
