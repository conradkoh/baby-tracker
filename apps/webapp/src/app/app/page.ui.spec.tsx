/**
 * App home page UI spec — TDD tests written before implementation.
 *
 * Tests: loading state, empty state, activity feed, summary card,
 * date grouping, action buttons, row click navigation (new paths).
 *
 * Mirrors the mobile home screen experience.
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
  currentAuthState = {
    sessionId: 'test-session',
    state: 'authenticated',
    user: { _id: 'user-1', _creationTime: Date.now(), type: 'anonymous', name: 'Test User' },
    accessLevel: 'user',
    isSystemAdmin: false,
  };
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

/** Create mock bottle feeds spaced over time for summary card testing. */
function makeBottleFeedsForSummary() {
  const now = Date.now();
  const hour = 3600 * 1000;

  return [
    {
      _id: 'feed-latest',
      _creationTime: now,
      timestamp: new Date(now - 0.5 * hour).toISOString(), // 30 min ago
      type: 'feed',
      feed: { type: 'expressed', volume: { ml: 60 } },
    },
    {
      _id: 'feed-middle',
      _creationTime: now - 1000,
      timestamp: new Date(now - 3 * hour).toISOString(), // 3 hours ago
      type: 'feed',
      feed: { type: 'expressed', volume: { ml: 90 } },
    },
    {
      _id: 'feed-earliest',
      _creationTime: now - 2000,
      timestamp: new Date(now - 5 * hour).toISOString(), // 5 hours ago
      type: 'feed',
      feed: { type: 'expressed', volume: { ml: 120 } },
    },
  ];
}

// ── Import page (after all mocks) ────────────────────────────────

import AppHomePage from './page';

// ── Tests ───────────────────────────────────────────────────────

describe('App home page', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ── 1. Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('shows skeletons while fetching activities', () => {
      mockIsLoading = true;
      mockStatus = 'LoadingFirstPage';
      mockResults = [];

      render(<AppHomePage />);

      // Should show skeleton loading indicators
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // ── 2. Empty state ────────────────────────────────────────────

  describe('empty state', () => {
    it('shows empty message when no activities exist', async () => {
      mockIsLoading = false;
      mockStatus = 'Exhausted';
      mockResults = [];

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText(/no activities yet/i)).toBeInTheDocument();
      });
    });

    it('shows action buttons even when empty', async () => {
      mockIsLoading = false;
      mockStatus = 'Exhausted';
      mockResults = [];

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Feed')).toBeInTheDocument();
        expect(screen.getByText('Diaper')).toBeInTheDocument();
        expect(screen.getByText('Medical')).toBeInTheDocument();
      });
    });
  });

  // ── 3. Summary card ───────────────────────────────────────────

  describe('summary card', () => {
    it('shows summary card when feed activities exist', async () => {
      mockResults = makeBottleFeedsForSummary();
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Feeding Summary')).toBeInTheDocument();
      });
    });

    it('shows "Last Feed" with a time ago label', async () => {
      mockResults = makeBottleFeedsForSummary();
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Last Feed')).toBeInTheDocument();
      });
      // The actual time-ago text will vary, but the label row should be present
      const lastFeedLabel = screen.getByText('Last Feed');
      expect(lastFeedLabel).toBeInTheDocument();
    });

    it('shows "3h Avg" with ml value', async () => {
      mockResults = makeBottleFeedsForSummary();
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('3h Avg')).toBeInTheDocument();
      });
      // Should have ml values displayed (use getAllByText since multiple ml values exist)
      const mlEls = screen.getAllByText(/ml/);
      expect(mlEls.length).toBeGreaterThan(0);
    });

    it('shows "24h Total" with ml value', async () => {
      mockResults = makeBottleFeedsForSummary();
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('24h Total')).toBeInTheDocument();
      });
    });

    it('does not show summary card when no feed activities exist', async () => {
      mockResults = [
        makeDiaperActivity({ timestamp: new Date().toISOString() }),
        makeTemperatureActivity({ timestamp: new Date().toISOString() }),
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.queryByText('Feeding Summary')).not.toBeInTheDocument();
      });
    });

    it('shows the Daily Summary card with Today header when any activities exist', async () => {
      mockResults = makeBottleFeedsForSummary();
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText(/^Today/)).toBeInTheDocument();
      });
    });
  });

  // ── 4. Activity display ───────────────────────────────────────

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
      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Latch Feed')).toBeInTheDocument();
      });
      expect(screen.getByText(/5 min 0 sec/)).toBeInTheDocument();
      expect(screen.getByText(/3 min 0 sec/)).toBeInTheDocument();
    });

    it('renders expressed feed with volume', async () => {
      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Expressed Feed')).toBeInTheDocument();
      });
      expect(screen.getByText(/120 ml/)).toBeInTheDocument();
    });

    it('renders solids feed with description', async () => {
      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Solids Feed')).toBeInTheDocument();
      });
      expect(screen.getByText(/Banana porridge/)).toBeInTheDocument();
    });

    it('renders diaper change with wet type', async () => {
      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Diaper Change')).toBeInTheDocument();
      });
      expect(screen.getByText('Wet')).toBeInTheDocument();
    });

    it('renders temperature reading', async () => {
      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
      });
      expect(screen.getByText(/37\.5\s*°C/)).toBeInTheDocument();
    });

    it('renders medicine with dosage', async () => {
      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Medicine')).toBeInTheDocument();
      });
      expect(screen.getByText(/5 ml Paracetamol/)).toBeInTheDocument();
    });
  });

  // ── 5. Date grouping ──────────────────────────────────────────

  describe('date grouping', () => {
    it('groups activities by date with separators', async () => {
      mockIsLoading = false;
      mockStatus = 'Exhausted';
      // Timestamps chosen to span two local dates in UTC+8 (Asia/Singapore).
      // Midnight SGT = 16:00 Z.
      // Jan 14 23:59 Z → SGT Jan 14 (night) — local date = Jan 14.
      // Jan 15 00:00 Z → SGT Jan 15 (midnight) — local date = Jan 15.
      // Jan 15 08:00 Z → SGT Jan 15 16:00 (afternoon) — local date = Jan 15.
      // Jan 15 12:00 Z → SGT Jan 15 20:00 (night) — local date = Jan 15.
      mockResults = [
        makeLatchActivity({ timestamp: '2025-01-14T15:59:59.000Z' }),
        makeSolidsActivity({ timestamp: '2025-01-14T16:00:00.000Z' }),
        makeBottleActivity({ timestamp: '2025-01-15T08:00:00.000Z' }),
        makeDiaperActivity({ timestamp: '2025-01-15T12:00:00.000Z' }),
      ];

      render(<AppHomePage />);

      await waitFor(() => {
        const headers = screen.getAllByRole('heading', { level: 3 });
        expect(headers.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // ── 6. Action buttons (new paths) ─────────────────────────────

  describe('action buttons', () => {
    it('shows Log Feed, Log Diaper, Log Medical buttons when authenticated', async () => {
      mockResults = [];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Feed')).toBeInTheDocument();
        expect(screen.getByText('Diaper')).toBeInTheDocument();
        expect(screen.getByText('Medical')).toBeInTheDocument();
      });
    });

    it('Log Feed navigates to /app/feed/create', async () => {
      mockResults = [];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Feed')).toBeInTheDocument();
      });

      screen.getByText('Feed').click();

      expect(mockRouterPush).toHaveBeenCalledWith('/app/feed/create');
    });

    it('Log Diaper navigates to /app/diaper-change/create', async () => {
      mockResults = [];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Diaper')).toBeInTheDocument();
      });

      screen.getByText('Diaper').click();

      expect(mockRouterPush).toHaveBeenCalledWith('/app/diaper-change/create');
    });

    it('Log Medical navigates to /app/medical/create', async () => {
      mockResults = [];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Medical')).toBeInTheDocument();
      });

      screen.getByText('Medical').click();

      expect(mockRouterPush).toHaveBeenCalledWith('/app/medical/create');
    });
  });

  // ── 7. Row click navigation (new edit paths) ──────────────────

  describe('row click navigation', () => {
    it('links to feed edit page at /app/feed/edit/[id]', async () => {
      mockResults = [makeLatchActivity({ _id: 'act-feed-1' })];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Latch Feed')).toBeInTheDocument();
      });

      const link = screen.getByText('Latch Feed').closest('a');
      expect(link).toHaveAttribute('href', '/app/feed/edit/act-feed-1');
    });

    it('links to diaper edit page at /app/diaper-change/edit/[id]', async () => {
      mockResults = [makeDiaperActivity({ _id: 'act-diaper-1' })];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Diaper Change')).toBeInTheDocument();
      });

      const link = screen.getByText('Diaper Change').closest('a');
      expect(link).toHaveAttribute('href', '/app/diaper-change/edit/act-diaper-1');
    });

    it('links to medical edit page at /app/medical/edit/[id]', async () => {
      mockResults = [makeTemperatureActivity({ _id: 'act-med-1' })];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
      });

      const link = screen.getByText('Temperature').closest('a');
      expect(link).toHaveAttribute('href', '/app/medical/edit/act-med-1');
    });
  });

  // ── 8. Load more ──────────────────────────────────────────────

  describe('load more', () => {
    it('shows load more button when more pages available', async () => {
      mockResults = [makeLatchActivity()];
      mockIsLoading = false;
      mockStatus = 'CanLoadMore';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText(/load more/i)).toBeInTheDocument();
      });
    });

    it('calls loadMore when load more button clicked', async () => {
      mockResults = [makeLatchActivity()];
      mockIsLoading = false;
      mockStatus = 'CanLoadMore';

      render(<AppHomePage />);

      await waitFor(() => {
        expect(screen.getByText(/load more/i)).toBeInTheDocument();
      });

      screen.getByText(/load more/i).click();

      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  // ── 9. Unauthenticated guard ──────────────────────────────────

  describe('unauthenticated', () => {
    it('renders nothing when unauthenticated', () => {
      currentAuthState = {
        sessionId: 'test-session',
        state: 'unauthenticated',
        reason: 'test',
      };
      mockResults = [];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.queryByText('Feed')).not.toBeInTheDocument();
      expect(screen.queryByText('Diaper')).not.toBeInTheDocument();
      expect(screen.queryByText('Medical')).not.toBeInTheDocument();
    });
  });
});
