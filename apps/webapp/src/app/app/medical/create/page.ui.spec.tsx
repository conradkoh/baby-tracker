/**
 * Medical create page UI spec — TDD tests written before implementation.
 *
 * Tests: medical type selection (Temperature/Medicine), conditional fields,
 * datetime input, submit mutation, cancel navigation, unauthenticated guard.
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
  usePathname: () => '/app/medical/create',
  useParams: () => ({}),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());

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

import MedicalCreatePage from './page';

// ── Tests ───────────────────────────────────────────────────────

describe('Medical create page', () => {
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
      const { container } = render(<MedicalCreatePage />);
      expect(container.innerHTML).toBe('');
    });
  });

  // ── 2. Medical type options ───────────────────────────────────

  describe('medical type options', () => {
    it('renders Temperature and Medicine options', async () => {
      render(<MedicalCreatePage />);

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('Medicine')).toBeInTheDocument();
      });
    });
  });

  // ── 3. Temperature fields ─────────────────────────────────────

  describe('temperature fields', () => {
    it('shows temperature value input when Temperature is selected', async () => {
      render(<MedicalCreatePage />);

      // Temperature should be default
      await waitFor(() => {
        expect(screen.getByLabelText(/temperature.*value/i)).toBeInTheDocument();
      });
    });
  });

  // ── 4. Medicine fields ────────────────────────────────────────

  describe('medicine fields', () => {
    it('shows medicine name, value, and unit inputs when Medicine is selected', async () => {
      const user = userEvent.setup();
      render(<MedicalCreatePage />);

      await user.click(screen.getByText('Medicine'));

      await waitFor(() => {
        expect(screen.getByLabelText(/medicine.*name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/unit/i)).toBeInTheDocument();
      });
    });
  });

  // ── 5. DateTime field ─────────────────────────────────────────

  describe('date time field', () => {
    it('renders a datetime-local input', async () => {
      render(<MedicalCreatePage />);

      await waitFor(() => {
        const dtInput = screen.getByLabelText(/date/i);
        expect(dtInput).toBeInTheDocument();
        expect((dtInput as HTMLInputElement).type).toBe('datetime-local');
      });
    });
  });

  // ── 6. Submit temperature ─────────────────────────────────────

  describe('submit temperature', () => {
    it('calls create mutation with temperature shape', async () => {
      const user = userEvent.setup();
      render(<MedicalCreatePage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/temperature.*value/i)).toBeInTheDocument();
      });

      // Clear and type temperature
      const tempInput = screen.getByLabelText(/temperature.*value/i);
      await user.clear(tempInput);
      await user.type(tempInput, '37.5');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith({
          activity: {
            timestamp: expect.any(String),
            type: 'medical',
            medical: {
              type: 'temperature',
              temperature: { value: 37.5 },
            },
          },
        });
      });
    });
  });

  // ── 7. Submit medicine ────────────────────────────────────────

  describe('submit medicine', () => {
    it('calls create mutation with medicine shape', async () => {
      const user = userEvent.setup();
      render(<MedicalCreatePage />);

      await user.click(screen.getByText('Medicine'));

      await waitFor(() => {
        expect(screen.getByLabelText(/medicine.*name/i)).toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText(/medicine.*name/i));
      await user.type(screen.getByLabelText(/medicine.*name/i), 'Paracetamol');
      await user.clear(screen.getByLabelText(/value/i));
      await user.type(screen.getByLabelText(/value/i), '5');
      await user.clear(screen.getByLabelText(/unit/i));
      await user.type(screen.getByLabelText(/unit/i), 'ml');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith({
          activity: {
            timestamp: expect.any(String),
            type: 'medical',
            medical: {
              type: 'medicine',
              medicine: { name: 'Paracetamol', value: 5, unit: 'ml' },
            },
          },
        });
      });
    });
  });

  // ── 8. Post-save navigation ───────────────────────────────────

  describe('post-save navigation', () => {
    it('navigates to activities list after successful save', async () => {
      const user = userEvent.setup();
      render(<MedicalCreatePage />);

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/app');
      });
    });
  });

  // ── 9. Cancel ─────────────────────────────────────────────────

  describe('cancel', () => {
    it('navigates to activities list when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<MedicalCreatePage />);

      await user.click(screen.getByText('Cancel'));

      expect(mockRouterPush).toHaveBeenCalledWith('/app');
    });
  });
});
