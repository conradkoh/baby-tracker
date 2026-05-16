/**
 * Medical edit page UI spec — TDD tests written before implementation.
 *
 * Tests: pre-populated temperature/medicine fields, datetime,
 * loading state, save/delete mutations, cancel, unauthenticated guard.
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

const EXISTING_TEMPERATURE: Record<string, unknown> = {
  _id: 'act-med-1',
  _creationTime: Date.now(),
  timestamp: '2025-01-15T10:00:00.000Z',
  type: 'medical',
  medical: { type: 'temperature', temperature: { value: 37.5 } },
};

const EXISTING_MEDICINE: Record<string, unknown> = {
  _id: 'act-med-2',
  _creationTime: Date.now(),
  timestamp: '2025-01-15T10:00:00.000Z',
  type: 'medical',
  medical: { type: 'medicine', medicine: { name: 'Paracetamol', value: 5, unit: 'ml' } },
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
  usePathname: () => '/app/medical/edit/act-med-1',
  useParams: () => ({ activityId: 'act-med-1' }),
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

import MedicalEditPage from './page';

// ── Tests ───────────────────────────────────────────────────────

describe('Medical edit page', () => {
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
      const { container } = render(<MedicalEditPage />);
      expect(container.innerHTML).toBe('');
    });
  });

  // ── 2. Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('shows loading indicator while fetching activity', () => {
      mockQueryResult = undefined;
      render(<MedicalEditPage />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  // ── 3. Pre-populated temperature ──────────────────────────────

  describe('temperature pre-population', () => {
    beforeEach(() => {
      mockQueryResult = EXISTING_TEMPERATURE;
    });

    it('shows temperature value pre-populated', async () => {
      render(<MedicalEditPage />);

      await waitFor(() => {
        const tempInput = screen.getByLabelText(/temperature.*value/i) as HTMLInputElement;
        expect(tempInput.value).toBe('37.5');
      });
    });

    it('shows Temperature tab as active', async () => {
      render(<MedicalEditPage />);

      await waitFor(() => {
        const tempTab = screen.getByRole('tab', { name: 'Temperature' });
        expect(tempTab.getAttribute('data-state')).toBe('active');
      });
    });
  });

  // ── 4. Pre-populated medicine ─────────────────────────────────

  describe('medicine pre-population', () => {
    beforeEach(() => {
      mockQueryResult = EXISTING_MEDICINE;
    });

    it('shows medicine fields pre-populated', async () => {
      render(<MedicalEditPage />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/medicine.*name/i) as HTMLInputElement;
        const valueInput = screen.getByLabelText(/value/i) as HTMLInputElement;
        const unitInput = screen.getByLabelText(/unit/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Paracetamol');
        expect(valueInput.value).toBe('5');
        expect(unitInput.value).toBe('ml');
      });
    });

    it('shows Medicine tab as active', async () => {
      render(<MedicalEditPage />);

      await waitFor(() => {
        const medTab = screen.getByRole('tab', { name: 'Medicine' });
        expect(medTab.getAttribute('data-state')).toBe('active');
      });
    });
  });

  // ── 5. DateTime pre-populated ─────────────────────────────────

  describe('date time pre-population', () => {
    it('shows existing timestamp', async () => {
      mockQueryResult = EXISTING_TEMPERATURE;
      render(<MedicalEditPage />);

      await waitFor(() => {
        const dtInput = screen.getByLabelText(/date/i) as HTMLInputElement;
        expect(dtInput.value).toBe('2025-01-15T10:00');
      });
    });
  });

  // ── 6. Save updates ───────────────────────────────────────────

  describe('save', () => {
    it('calls update mutation with modified temperature', async () => {
      const user = userEvent.setup();
      mockQueryResult = EXISTING_TEMPERATURE;
      render(<MedicalEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/temperature.*value/i)).toBeInTheDocument();
      });

      const tempInput = screen.getByLabelText(/temperature.*value/i);
      await user.clear(tempInput);
      await user.type(tempInput, '38.2');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          activityId: 'act-med-1',
          activity: {
            timestamp: expect.any(String),
            type: 'medical',
            medical: {
              type: 'temperature',
              temperature: { value: 38.2 },
            },
          },
        });
      });
    });

    it('calls update mutation with modified medicine', async () => {
      const user = userEvent.setup();
      mockQueryResult = EXISTING_MEDICINE;
      render(<MedicalEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/medicine.*name/i)).toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText(/medicine.*name/i));
      await user.type(screen.getByLabelText(/medicine.*name/i), 'Ibuprofen');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          activityId: 'act-med-1',
          activity: {
            timestamp: expect.any(String),
            type: 'medical',
            medical: {
              type: 'medicine',
              medicine: { name: 'Ibuprofen', value: 5, unit: 'ml' },
            },
          },
        });
      });
    });

    it('navigates to activities list after successful save', async () => {
      const user = userEvent.setup();
      mockQueryResult = EXISTING_TEMPERATURE;
      render(<MedicalEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/app');
      });
    });
  });

  // ── 7. Delete ─────────────────────────────────────────────────

  describe('delete', () => {
    it('renders a Delete button', async () => {
      mockQueryResult = EXISTING_TEMPERATURE;
      render(<MedicalEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('calls delete mutation then navigates', async () => {
      const user = userEvent.setup();
      mockQueryResult = EXISTING_TEMPERATURE;
      render(<MedicalEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({ activityId: 'act-med-1' });
        expect(mockRouterPush).toHaveBeenCalledWith('/app');
      });
    });
  });

  // ── 8. Cancel ─────────────────────────────────────────────────

  describe('cancel', () => {
    it('navigates to activities list when Cancel is clicked', async () => {
      const user = userEvent.setup();
      mockQueryResult = EXISTING_TEMPERATURE;
      render(<MedicalEditPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      expect(mockRouterPush).toHaveBeenCalledWith('/app');
    });
  });
});
