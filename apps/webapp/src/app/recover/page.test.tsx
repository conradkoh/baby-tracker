/**
 * Recover account page smoke test — verifies the page mounts and
 * renders the recovery form.
 */
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { describe, expect, it, vi } from 'vitest';

import {
  createApiMock,
  createAuthMock,
  createConvexReactMock,
  createFeatureFlagsMock,
  createNextLinkMock,
  createNextNavMock,
  createSessionHelpersMock,
} from '@/__tests__/test-utils';

// ── Top-level mocks ─────────────────────────────────────────────

vi.mock('next/navigation', () => createNextNavMock());
vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('convex-helpers/react/sessions', () => createSessionHelpersMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());
vi.mock('@/modules/auth/AuthProvider', () => createAuthMock());
vi.mock('@workspace/backend/config/featureFlags', () => createFeatureFlagsMock());

// sonner toast uses a portal; mock it to avoid portal-related issues
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Tests ───────────────────────────────────────────────────────

import RecoverAccountPage from './page';

describe('Recover account page', () => {
  it('renders the page without crashing', () => {
    expect(() => render(<RecoverAccountPage />)).not.toThrow();
  });

  it('displays the recover account heading', async () => {
    render(<RecoverAccountPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Recover Account').length).toBeGreaterThan(0);
    });
  });

  it('displays the recovery code input area', async () => {
    render(<RecoverAccountPage />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Paste your recovery code here')
      ).toBeInTheDocument();
    });
  });

  it('shows the recover button', async () => {
    render(<RecoverAccountPage />);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /recover account/i })
      ).toBeInTheDocument();
    });
  });

  it('shows the back to login link', async () => {
    render(<RecoverAccountPage />);
    await waitFor(() => {
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });
  });
});
