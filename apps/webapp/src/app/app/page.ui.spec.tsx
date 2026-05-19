/**
 * App home page UI spec — TDD tests written before implementation.
 *
 * Tests: loading state, empty state, activity feed, summary card,
 * date grouping, action buttons, row click navigation (new paths).
 *
 * Mirrors the mobile home screen experience.
 */
import { render, screen, waitFor, within } from '@/__tests__/test-utils';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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
      // No fake timers — activity display tests don't need DateTime.now()
      mockResults = [
        makeLatchActivity(),
        makeBottleActivity(),
        makeSolidsActivity(),
        makeDiaperActivity(),
        makeTemperatureActivity(),
        makeMedicineActivity(),
      ];
    });

    it('renders latch feed with duration', () => {
      render(<AppHomePage />);
      // Scope to the activity feed link to avoid matching the DailySummaryCard
      const activityLink = screen.getByText('Latch Feed').closest('a') as HTMLElement;
      expect(within(activityLink).getByText(/5 min 0 sec/)).toBeInTheDocument();
      expect(within(activityLink).getByText(/3 min 0 sec/)).toBeInTheDocument();
    });

    it('renders expressed feed with volume', () => {
      render(<AppHomePage />);
      expect(screen.getByText('Expressed Feed')).toBeInTheDocument();
      expect(screen.getByText(/120 ml/)).toBeInTheDocument();
    });

    it('renders solids feed with description', () => {
      render(<AppHomePage />);
      // Description appears in both activity row and daily summary card — scope to activity link
      const activityLink = screen.getByText('Solids Feed').closest('a') as HTMLElement;
      expect(within(activityLink).getByText(/Banana porridge/)).toBeInTheDocument();
    });

    it('renders diaper change with wet type', () => {
      render(<AppHomePage />);
      expect(screen.getByText('Diaper Change')).toBeInTheDocument();
      expect(screen.getByText('Wet')).toBeInTheDocument();
    });

    it('renders temperature reading', () => {
      render(<AppHomePage />);
      // Temperature value appears in both card and activity row — scope to activity link
      const activityLink = screen.getByText('Temperature').closest('a') as HTMLElement;
      expect(within(activityLink).getByText(/37\.5\s*°C/)).toBeInTheDocument();
    });

    it('renders medicine with dosage', () => {
      render(<AppHomePage />);
      expect(screen.getByText('Medicine')).toBeInTheDocument();
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

  // ── 10. Daily Summary card (per-day) ─────────────────────────

  describe('daily summary card', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-05-19T10:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('is hidden when no activities exist', () => {
      mockResults = [];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.queryByText(/^Today/)).not.toBeInTheDocument();
    });

    it('shows a yesterday card (no "Today ·" prefix) when only yesterday data exists', () => {
      // yesterday 10:00 AM UTC = 2025-05-18T10:00:00Z
      mockResults = [
        {
          _id: 'act-yesterday',
          _creationTime: Date.now() - 86400000,
          timestamp: '2025-05-18T10:00:00.000Z',
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 120 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      // No "Today ·" card — but a yesterday card should exist (without Today prefix)
      expect(screen.queryByText(/^Today/)).not.toBeInTheDocument();
      // The yesterday card has a date heading (e.g. "Mon, 18 May") but no "Today ·" prefix
      // Just verify the card is rendered with a different date label
      const allCards = screen.queryAllByText(/Bottle:/);
      expect(allCards.length).toBe(1); // yesterday card has the feed summary
    });

    it('shows "Today · <date>" header when today has any activity', () => {
      // today at 08:00
      mockResults = [
        {
          _id: 'act-today',
          _creationTime: Date.now(),
          timestamp: '2025-05-19T08:00:00.000Z',
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 120 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/^Today/)).toBeInTheDocument();
    });

    it('bottle line shows breakdown with both subtypes for mixed expressed+formula', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'b1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 1 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 60 } },
        },
        {
          _id: 'b2',
          _creationTime: now - 2000,
          timestamp: new Date(now - 2 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 90 } },
        },
        {
          _id: 'b3',
          _creationTime: now - 3000,
          timestamp: new Date(now - 3 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'formula', volume: { ml: 120 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/Bottle:/)).toBeInTheDocument();
      // total = 60+90+120 = 270
      expect(screen.getByText(/270ml/)).toBeInTheDocument();
      // breakdown: 2 expressed, 1 formula (parenthetical)
      expect(screen.getByText(/2 expressed, 1 formula/)).toBeInTheDocument();
    });

    it('bottle line hides breakdown parenthetical when only one active subtype', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'b1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 1 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 60 } },
        },
        {
          _id: 'b2',
          _creationTime: now - 2000,
          timestamp: new Date(now - 2 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 90 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/Bottle:/)).toBeInTheDocument();
      // no parenthetical with mixed subtypes — no "expressed, " text
      expect(screen.queryByText(/expressed, /)).not.toBeInTheDocument();
    });

    it('latch line shows session count and avg L/R via formatDuration', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'l1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 1 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'latch', duration: { left: { seconds: 600 }, right: { seconds: 300 } } },
        },
        {
          _id: 'l2',
          _creationTime: now - 2000,
          timestamp: new Date(now - 3 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'latch', duration: { left: { seconds: 900 }, right: { seconds: 450 } } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/Latch:/)).toBeInTheDocument();
      expect(screen.getByText(/2 sessions/)).toBeInTheDocument();
      // avg L: (600+900)/2 = 750s = 12 min 30 sec; avg R: (300+450)/2 = 375s = 6 min 15 sec
      expect(screen.getByText(/avg L 12 min 30 sec/)).toBeInTheDocument();
      // "6 min 15 sec" is a contiguous text node inside the <p>; the "avg R " prefix
      // lives in a separate child element so it can't be matched as a single string.
      expect(screen.getByText(/6 min 15 sec/)).toBeInTheDocument();
    });

    it('solids deduplicates by case-insensitive name and shows all unique names', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 's1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 1 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'solids', description: 'Banana' },
        },
        {
          _id: 's2',
          _creationTime: now - 2000,
          timestamp: new Date(now - 2 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'solids', description: 'banana' },
        },
        {
          _id: 's3',
          _creationTime: now - 3000,
          timestamp: new Date(now - 3 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'solids', description: 'Rice' },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/Solids:/)).toBeInTheDocument();
      // count = 2 (unique names: Banana + Rice, case-insensitive dedup removes lowercase "banana")
      // "Solids:" and "2" are in separate child elements — match them individually
      expect(screen.getByText('2')).toBeInTheDocument();
      // Both unique names should appear (dedup by case-insensitive key, original case preserved, alpha-sorted: "Rice, banana")
      expect(screen.getByText(/Rice, banana/)).toBeInTheDocument();
      // Not 3 (the dup 'banana' should not add a third entry in the daily summary list)
      // Scoped to the DailySummaryCard to avoid matching the activity feed row label "Banana"
      const cardRoot = screen.getByText(/Today ·/).closest('[data-slot="card"]') as HTMLElement;
      expect(within(cardRoot).queryByText('Banana')).not.toBeInTheDocument();
    });

    it('diaper counts omit zero types (2 wet + 1 mixed, 0 dirty → no dirty text)', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'd1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 1 * hour).toISOString(),
          type: 'diaper_change',
          diaperChange: { type: 'wet' },
        },
        {
          _id: 'd2',
          _creationTime: now - 2000,
          timestamp: new Date(now - 2 * hour).toISOString(),
          type: 'diaper_change',
          diaperChange: { type: 'wet' },
        },
        {
          _id: 'd3',
          _creationTime: now - 3000,
          timestamp: new Date(now - 3 * hour).toISOString(),
          type: 'diaper_change',
          diaperChange: { type: 'mixed' },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/Diapers/)).toBeInTheDocument();
      expect(screen.getByText(/2 wet/)).toBeInTheDocument();
      expect(screen.getByText(/1 mixed/)).toBeInTheDocument();
      // dirty not shown
      expect(screen.queryByText(/dirty/)).not.toBeInTheDocument();
    });

    it('diaper shows "Last wet: 2h ago" when last wet was 2 hours ago', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'd1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 2 * hour).toISOString(),
          type: 'diaper_change',
          diaperChange: { type: 'wet' },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/Last wet:/)).toBeInTheDocument();
      expect(screen.getByText(/2h ago/)).toBeInTheDocument();
    });

    it('medical shows latest temperature from two readings (latest is 37.8°C)', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'm1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 3 * hour).toISOString(),
          type: 'medical',
          medical: { type: 'temperature', temperature: { value: 37.8 } },
        },
        {
          _id: 'm2',
          _creationTime: now - 2000,
          timestamp: new Date(now - 5 * hour).toISOString(),
          type: 'medical',
          medical: { type: 'temperature', temperature: { value: 37.0 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/Latest temp:/)).toBeInTheDocument();
      // The temperature "37.8°C" appears in both the card's summary section AND the
      // activity feed row. Use within() to scope to the DailySummaryCard to avoid ambiguity.
      const cardRoot = screen.getByText(/Today ·/).closest('[data-slot="card"]') as HTMLElement;
      expect(within(cardRoot).getByText(/37\.8/)).toBeInTheDocument();
      expect(within(cardRoot).getByText(/°C/)).toBeInTheDocument();
    });

    it('medicine roll-up: Paracetamol 5ml + 5ml → 10ml over 2 doses', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'med1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 1 * hour).toISOString(),
          type: 'medical',
          medical: { type: 'medicine', medicine: { name: 'Paracetamol', unit: 'ml', value: 5 } },
        },
        {
          _id: 'med2',
          _creationTime: now - 2000,
          timestamp: new Date(now - 2 * hour).toISOString(),
          type: 'medical',
          medical: { type: 'medicine', medicine: { name: 'Paracetamol', unit: 'ml', value: 5 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/Paracetamol:/)).toBeInTheDocument();
      expect(screen.getByText(/10\s*ml/)).toBeInTheDocument();
      expect(screen.getByText(/2 dose/)).toBeInTheDocument();
    });

    it('mixed units medicine: Paracetamol 5ml + 0.5g → no total, shows "mixed units" and dose count', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'med1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 1 * hour).toISOString(),
          type: 'medical',
          medical: { type: 'medicine', medicine: { name: 'Paracetamol', unit: 'ml', value: 5 } },
        },
        {
          _id: 'med2',
          _creationTime: now - 2000,
          timestamp: new Date(now - 2 * hour).toISOString(),
          type: 'medical',
          medical: { type: 'medicine', medicine: { name: 'Paracetamol', unit: 'g', value: 0.5 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      expect(screen.getByText(/Paracetamol:/)).toBeInTheDocument();
      expect(screen.getByText(/mixed units/i)).toBeInTheDocument();
      expect(screen.getByText(/2 dose/)).toBeInTheDocument();
      // No "10" (should not sum mixed units)
      expect(screen.queryByText(/10/)).not.toBeInTheDocument();
    });

    it('section hiding: only feed today → no Diapers heading, no Medical heading in the card', () => {
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'b1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 1 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 120 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      // Feed section heading (not the quick action "Feed" button)
      const feedSectionHeadings = screen.getAllByText(/^Feed$/);
      expect(feedSectionHeadings.length).toBeGreaterThan(0);

      // No Diapers or Medical sections in the Daily Summary card
      const cardRoot = screen.getByText(/Today ·/).closest('[data-slot="card"]') as HTMLElement;
      const diaperLabels = within(cardRoot).queryAllByText(/^Diapers$/);
      const medicalLabels = within(cardRoot).queryAllByText(/^Medical$/);
      expect(diaperLabels.length).toBe(0);
      expect(medicalLabels.length).toBe(0);
    });

    it('DOM ordering: today DailySummaryCard appears between day heading and activity Card inside the today group', () => {
      // With the per-day layout, the card sits BELOW the h3 date heading and ABOVE the
      // activity list Card within each day group.
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        {
          _id: 'b1',
          _creationTime: now - 1000,
          timestamp: new Date(now - 1 * hour).toISOString(),
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 120 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      // The today card appears in the page — its header contains "Today · ..."
      const dailySummaryCard = screen.getByText(/Today ·/).closest('[data-slot="card"]') as HTMLElement;
      expect(dailySummaryCard).not.toBeNull();

      // Feeding Summary is a separate rose card at the top of the page, above all day groups.
      const feedingSummary = screen.getByText('Feeding Summary');
      // Feeding Summary (top of page) precedes the DailySummaryCard (inside day group)
      expect(
        feedingSummary.compareDocumentPosition(dailySummaryCard)
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    // ── New tests for per-day layout ─────────────────────────────────

    it('multi-day: today feed + yesterday diaper → two DailySummaryCards, each with relevant data', () => {
      // Today has a bottle feed; yesterday has a wet diaper
      const now = Date.now();
      const hour = 3600 * 1000;
      mockResults = [
        // yesterday's wet diaper
        {
          _id: 'd-yesterday',
          _creationTime: now - 25 * hour,
          timestamp: new Date(now - 25 * hour).toISOString(), // 25h ago = yesterday
          type: 'diaper_change',
          diaperChange: { type: 'wet' },
        },
        // today's bottle feed
        {
          _id: 'b-today',
          _creationTime: now - hour,
          timestamp: new Date(now - hour).toISOString(),
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 120 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      // Today card has "Today · ..." prefix
      expect(screen.getByText(/^Today/)).toBeInTheDocument();

      // Yesterday card exists: has a card with a date label without "Today ·" prefix
      // (the date label for yesterday will be a date like "Sun, 18 May")
      const allCards = screen.queryAllByText(/Bottle:/);
      expect(allCards.length).toBe(1); // only today's card has bottle data
      const allDiapers = screen.queryAllByText(/Diapers/);
      expect(allDiapers.length).toBe(1); // only yesterday's card has diaper data
      // The yesterday card should have a date heading (e.g. "May 18, 2025")
      // We detect it by finding a card whose header does NOT include "Today ·"
      const yesterdayCard = screen.getByText(/Diapers/).closest('[data-slot="card"]') as HTMLElement;
      // Just verify the card is there (date heading could be any format like "Mon, 18 May" or "May 18, 2025")
      expect(yesterdayCard).not.toBeNull();
    });

    it('isToday=false suppresses "ago" for diaper: yesterday wet shows "Last wet at HH:mm"', () => {
      // System time = 2025-05-19T10:00:00Z → today is May 19.
      // Yesterday at 14:00 UTC
      mockResults = [
        {
          _id: 'd-yesterday',
          _creationTime: Date.now() - 20 * 3600 * 1000,
          timestamp: '2025-05-18T14:00:00.000Z',
          type: 'diaper_change',
          diaperChange: { type: 'wet' },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      // No "Today" card
      expect(screen.queryByText(/^Today/)).not.toBeInTheDocument();

      // Yesterday card: shows absolute time, NOT "Xh ago"
      // The card should show "Last wet: at HH:MM" (absolute format from formatTime)
      // We only assert that "at" is present (avoids timezone-specific HH:mm values)
      expect(screen.getByText(/Last wet: at/)).toBeInTheDocument();
      // Should NOT have "Xh ago"
      expect(screen.queryByText(/Last wet: \d+h ago/)).not.toBeInTheDocument();
    });

    it('isToday=false suppresses "ago" for medical temperature: yesterday shows "· at HH:mm"', () => {
      mockResults = [
        {
          _id: 't-yesterday',
          _creationTime: Date.now() - 20 * 3600 * 1000,
          timestamp: '2025-05-18T14:00:00.000Z',
          type: 'medical',
          medical: { type: 'temperature', temperature: { value: 37.5 } },
        },
      ];
      mockIsLoading = false;
      mockStatus = 'Exhausted';

      render(<AppHomePage />);

      // No "Today" card
      expect(screen.queryByText(/^Today/)).not.toBeInTheDocument();

      // Yesterday card: temperature line shows "· at HH:mm" (absolute, not "Xh ago")
      // We scope to the card since text spans multiple elements: "Latest temp: " + "37.5" + "°C" + " · at 10:00 PM"
      expect(screen.getByText(/Latest temp:/)).toBeInTheDocument();
      const card = screen.getByText(/Latest temp:/).closest('[data-slot="card"]') as HTMLElement;
      // The "at" text appears after the temperature value span
      expect(within(card).getByText(/at \d{1,2}:\d{2} (AM|PM)/)).toBeInTheDocument();
      // Should NOT have "Xh ago" anywhere in the card
      expect(within(card).queryByText(/\d+h ago/)).not.toBeInTheDocument();
    });
  });
});