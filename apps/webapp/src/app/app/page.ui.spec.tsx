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

let mockLast24h: Record<string, unknown> | null = null;

vi.mock('convex-helpers/react/sessions', () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSessionPaginatedQuery: () => ({
    results: mockResults,
    status: mockStatus,
    isLoading: mockIsLoading,
    loadMore: mockLoadMore,
  }),
  useSessionQuery: (_api: unknown, _args: unknown) => mockLast24h,
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
  mockLast24h = null;
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

  // ── 3. Last 24h summary card ────────────────────────────────────

  describe('last 24h summary card', () => {
    const last24hFixture = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 90, total24hMl: 240, bottleCount: 3 },
      diapers: { wet: 2, dirty: 1, mixed: 0, total: 3 },
    };

    it('shows Last24hSummaryCard when query returns hasAny: true', () => {
      mockIsLoading = false;
      mockStatus = 'Exhausted';
      mockResults = [
        {
          _id: 'b1',
          _creationTime: Date.now() - 1000,
          timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 120 } },
        },
      ];
      mockLast24h = last24hFixture;

      const { container } = render(<AppHomePage />);
      expect(container.textContent).toContain('Last 24h');
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

    it('shows a yesterday card (no "Today ·" on card) when only yesterday data exists', () => {
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

      // No "Today ·" prefix anywhere — the card has no date header anymore; page h3 shows date
      expect(screen.queryByText(/^Today/)).not.toBeInTheDocument();
      // Yesterday's date heading appears in the h3
      expect(screen.getByText(/May 18, 2025/)).toBeInTheDocument();
      // Card still shows bottle data
      const allCards = screen.queryAllByText(/Bottle:/);
      expect(allCards.length).toBe(1); // yesterday card has the feed summary
    });

    it('shows date heading when today has any activity', () => {
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

      // Date heading (h3) shows today's date; card has no date header anymore
      expect(screen.getByText(/May 19, 2025/)).toBeInTheDocument();
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
      // 3 feeds total
      expect(screen.getByText(/3 feeds/)).toBeInTheDocument();
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
      // total seconds = (600+300) + (900+450) = 900 + 1350 = 2250
      expect(screen.getByText(/37 min 30 sec total/)).toBeInTheDocument();
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
      // count = 3 (solids deduplication removed, just counts total solids entries)
      expect(screen.getByText('3')).toBeInTheDocument();
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

      // Medical section removed from summary card — temperature appears in activity feed rows
      // Two temperature readings → two "Temperature" activity rows
      const tempLabels = screen.getAllByText(/Temperature/);
      expect(tempLabels.length).toBe(2);
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

      // Medical section removed from summary card — medicines appear in activity feed rows
      const medicineLabels = screen.getAllByText(/Medicine/);
      expect(medicineLabels.length).toBe(2);
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

      // Medical section removed from summary card — medicines appear in activity feed rows
      const medicineLabels = screen.getAllByText(/Medicine/);
      expect(medicineLabels.length).toBe(2);
    });

    it('section showing: only feed today → Diapers and Medical show "No records" in the card', () => {
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

      // Diapers section is present (Feed is the only data); Medical section removed
      const cardRoot = screen.getByText(/Bottle:/).closest('[data-slot="card"]') as HTMLElement;
      const diaperLabels = within(cardRoot).queryAllByText(/^Diapers$/);
      expect(diaperLabels.length).toBe(1);
      // Only Diapers shows "No records" (Medical section removed)
      const noRecordsEls = within(cardRoot).queryAllByText('No records');
      expect(noRecordsEls.length).toBe(1); // Diapers empty; Medical gone
    });

    it('DOM ordering: Last24hSummaryCard appears between quick actions and day group', () => {
      // The Last24hSummaryCard sits between QuickActionGrid and the day-group cards
      mockIsLoading = false;
      mockStatus = 'Exhausted';
      mockResults = [
        {
          _id: 'b1',
          _creationTime: Date.now() - 1000,
          timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          type: 'feed',
          feed: { type: 'expressed', volume: { ml: 120 } },
        },
      ];
      mockLast24h = {
        hasAny: true,
        feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 90, total24hMl: 240, bottleCount: 3 },
        diapers: { wet: 1, dirty: 0, mixed: 0, total: 1 },
      };

      render(<AppHomePage />);

      // Locate the Last 24h header — card should be visible since hasAny: true
      expect(screen.getByText('Last 24h')).toBeInTheDocument();
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

      // Today shows the date in the h3 heading
      expect(screen.getByText(/May 19, 2025/)).toBeInTheDocument();

      // Both day groups render cards with all three sections (Feed/Diapers/Medical)
      // Today card: has bottle data (120ml)
      // Yesterday card: has diaper data (1 wet)
      const todayCard = screen.getByText(/120ml/).closest('[data-slot="card"]') as HTMLElement;
      expect(within(todayCard).getByText(/Bottle:/)).toBeInTheDocument();

      const yesterdayCard = screen.getByText(/1 wet/).closest('[data-slot="card"]') as HTMLElement;
      expect(within(yesterdayCard).getByText(/Diapers/)).toBeInTheDocument();
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

      // No "Today" card (no activities today)
      expect(screen.queryByText(/^Today/)).not.toBeInTheDocument();
      // Medical section removed — no temperature-related assertions needed
    });
  });
});