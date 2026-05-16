/**
 * Feed create page UI spec — TDD tests written before implementation.
 *
 * Tests: feed type selection (Latch/Expressed/Formula/Water/Solids),
 * form fields per type, date/time input, submit mutation, cancel navigation,
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
const mockCreateActivity = vi.fn().mockResolvedValue({ activityId: 'act-new' });

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
  usePathname: () => '/app/feed/create',
  useParams: () => ({}),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());

// ── Mutable session mutation mock ───────────────────────────────

vi.mock('convex-helpers/react/sessions', () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  useSessionMutation: () => mockCreateActivity,
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

/** Reset all mutable mock state between tests. */
function resetMocks() {
  mockRouterPush.mockClear();
  mockCreateActivity.mockClear();
  mockCreateActivity.mockResolvedValue({ activityId: 'act-new' });
  currentAuthState = {
    sessionId: 'test-session',
    state: 'authenticated',
    user: { _id: 'user-1', _creationTime: Date.now(), type: 'anonymous', name: 'Test User' },
    accessLevel: 'user',
    isSystemAdmin: false,
  };
}

// ── Import page (after all mocks) ────────────────────────────────

import FeedCreatePage from './page';

// ── Tests ───────────────────────────────────────────────────────

describe('Feed create page', () => {
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

      const { container } = render(<FeedCreatePage />);
      expect(container.innerHTML).toBe('');
    });
  });

  // ── 2. Feed type options ──────────────────────────────────────

  describe('feed type selection', () => {
    it('renders all feed type options', async () => {
      render(<FeedCreatePage />);

      await waitFor(() => {
        expect(screen.getByText('Latch')).toBeInTheDocument();
        expect(screen.getByText('Expressed')).toBeInTheDocument();
        expect(screen.getByText('Formula')).toBeInTheDocument();
        expect(screen.getByText('Water')).toBeInTheDocument();
        expect(screen.getByText('Solids')).toBeInTheDocument();
      });
    });
  });

  // ── 3. Latch form fields ──────────────────────────────────────

  describe('latch feed form', () => {
    it('shows duration inputs for left and right when Latch is selected', async () => {
      render(<FeedCreatePage />);

      // Latch should be the default
      await waitFor(() => {
        expect(screen.getByLabelText(/left.*min/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/left.*sec/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/right.*min/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/right.*sec/i)).toBeInTheDocument();
      });
    });
  });

  // ── 4. Bottle form fields ─────────────────────────────────────

  describe('bottle feed form', () => {
    it('shows volume input when Expressed is selected', async () => {
      const user = userEvent.setup();
      render(<FeedCreatePage />);

      await user.click(screen.getByText('Expressed'));

      await waitFor(() => {
        expect(screen.getByLabelText(/volume/i)).toBeInTheDocument();
      });
    });

    it('shows volume input when Formula is selected', async () => {
      const user = userEvent.setup();
      render(<FeedCreatePage />);

      await user.click(screen.getByText('Formula'));

      await waitFor(() => {
        expect(screen.getByLabelText(/volume/i)).toBeInTheDocument();
      });
    });

    it('shows volume input when Water is selected', async () => {
      const user = userEvent.setup();
      render(<FeedCreatePage />);

      await user.click(screen.getByText('Water'));

      await waitFor(() => {
        expect(screen.getByLabelText(/volume/i)).toBeInTheDocument();
      });
    });
  });

  // ── 5. Solids form fields ─────────────────────────────────────

  describe('solids feed form', () => {
    it('shows description input when Solids is selected', async () => {
      const user = userEvent.setup();
      render(<FeedCreatePage />);

      await user.click(screen.getByText('Solids'));

      await waitFor(() => {
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });
    });
  });

  // ── 6. DateTime field ─────────────────────────────────────────

  describe('date time field', () => {
    it('renders a datetime input', async () => {
      render(<FeedCreatePage />);

      await waitFor(() => {
        const dtInput = screen.getByLabelText(/date/i);
        expect(dtInput).toBeInTheDocument();
        expect((dtInput as HTMLInputElement).type).toBe('datetime-local');
      });
    });
  });

  // ── 7. Submit creates activity ────────────────────────────────

  describe('submit', () => {
    it('calls create mutation with latch activity shape', async () => {
      const user = userEvent.setup();
      render(<FeedCreatePage />);

      // Latch is default — fill in duration fields
      await user.clear(screen.getByLabelText(/left.*min/i));
      await user.type(screen.getByLabelText(/left.*min/i), '10');
      await user.clear(screen.getByLabelText(/left.*sec/i));
      await user.type(screen.getByLabelText(/left.*sec/i), '30');
      await user.clear(screen.getByLabelText(/right.*min/i));
      await user.type(screen.getByLabelText(/right.*min/i), '5');
      await user.clear(screen.getByLabelText(/right.*sec/i));
      await user.type(screen.getByLabelText(/right.*sec/i), '0');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith({
          activity: {
            timestamp: expect.any(String),
            type: 'feed',
            feed: {
              type: 'latch',
              duration: {
                left: { seconds: 630 },
                right: { seconds: 300 },
              },
            },
          },
        });
      });
    });

    it('calls create mutation with bottle activity shape', async () => {
      const user = userEvent.setup();
      render(<FeedCreatePage />);

      await user.click(screen.getByText('Expressed'));
      await user.clear(screen.getByLabelText(/volume/i));
      await user.type(screen.getByLabelText(/volume/i), '150');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith({
          activity: {
            timestamp: expect.any(String),
            type: 'feed',
            feed: {
              type: 'expressed',
              volume: { ml: 150 },
            },
          },
        });
      });
    });

    it('calls create mutation with solids activity shape', async () => {
      const user = userEvent.setup();
      render(<FeedCreatePage />);

      await user.click(screen.getByText('Solids'));
      await user.clear(screen.getByLabelText(/description/i));
      await user.type(screen.getByLabelText(/description/i), 'Apple puree');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith({
          activity: {
            timestamp: expect.any(String),
            type: 'feed',
            feed: {
              type: 'solids',
              description: 'Apple puree',
            },
          },
        });
      });
    });

    it('navigates to activities list after successful save', async () => {
      const user = userEvent.setup();
      render(<FeedCreatePage />);

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/app');
      });
    });
  });

  // ── 8. Cancel navigation ──────────────────────────────────────

  describe('cancel', () => {
    it('navigates to activities list when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedCreatePage />);

      await user.click(screen.getByText('Cancel'));

      expect(mockRouterPush).toHaveBeenCalledWith('/app');
    });
  });
});
