/**
 * Diaper change create page UI spec — TDD tests written before implementation.
 *
 * Tests: diaper type options (Wet/Dirty/Mixed), default selection,
 * datetime input, submit mutation, cancel navigation,
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
  usePathname: () => '/app/activities/diaper-change/create',
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

import DiaperCreatePage from './page';

// ── Tests ───────────────────────────────────────────────────────

describe('Diaper change create page', () => {
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

      const { container } = render(<DiaperCreatePage />);
      expect(container.innerHTML).toBe('');
    });
  });

  // ── 2. Diaper type options ────────────────────────────────────

  describe('diaper type options', () => {
    it('renders Wet, Dirty, and Mixed options', async () => {
      render(<DiaperCreatePage />);

      await waitFor(() => {
        expect(screen.getByText('Wet')).toBeInTheDocument();
        expect(screen.getByText('Dirty')).toBeInTheDocument();
        expect(screen.getByText('Mixed')).toBeInTheDocument();
      });
    });

    it('selects Wet by default', async () => {
      render(<DiaperCreatePage />);

      await waitFor(() => {
        const wetOption = screen.getByRole('radio', { name: /wet/i });
        expect(wetOption).toBeChecked();
      });
    });
  });

  // ── 3. DateTime field ─────────────────────────────────────────

  describe('date time field', () => {
    it('renders a datetime-local input', async () => {
      render(<DiaperCreatePage />);

      await waitFor(() => {
        const dtInput = screen.getByLabelText(/date/i);
        expect(dtInput).toBeInTheDocument();
        expect((dtInput as HTMLInputElement).type).toBe('datetime-local');
      });
    });
  });

  // ── 4. Submit creates activity ────────────────────────────────

  describe('submit', () => {
    it('calls create mutation with wet diaper shape', async () => {
      const user = userEvent.setup();
      render(<DiaperCreatePage />);

      // Wet is default — just click Save
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith({
          activity: {
            timestamp: expect.any(String),
            type: 'diaper_change',
            diaperChange: { type: 'wet' },
          },
        });
      });
    });

    it('calls create mutation with dirty diaper shape', async () => {
      const user = userEvent.setup();
      render(<DiaperCreatePage />);

      await user.click(screen.getByRole('radio', { name: /dirty/i }));
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith({
          activity: {
            timestamp: expect.any(String),
            type: 'diaper_change',
            diaperChange: { type: 'dirty' },
          },
        });
      });
    });

    it('calls create mutation with mixed diaper shape', async () => {
      const user = userEvent.setup();
      render(<DiaperCreatePage />);

      await user.click(screen.getByRole('radio', { name: /mixed/i }));
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith({
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
      render(<DiaperCreatePage />);

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/app/activities');
      });
    });
  });

  // ── 5. Cancel navigation ──────────────────────────────────────

  describe('cancel', () => {
    it('navigates to activities list when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<DiaperCreatePage />);

      await user.click(screen.getByText('Cancel'));

      expect(mockRouterPush).toHaveBeenCalledWith('/app/activities');
    });
  });
});
