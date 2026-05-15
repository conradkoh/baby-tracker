/**
 * Google Auth configuration page smoke test — verifies the page mounts
 * and renders the configuration form.
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
vi.mock('@/modules/auth/AuthProvider', () =>
  createAuthMock({
    state: 'authenticated',
    accessLevel: 'system_admin',
    isSystemAdmin: true,
  })
);
vi.mock('@workspace/backend/config/featureFlags', () => createFeatureFlagsMock());

vi.mock('@/modules/app/useAppInfo', () => ({
  useAppInfo: () => ({
    appInfo: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Tests ───────────────────────────────────────────────────────

import GoogleAuthConfigPage from './page';

describe('Google Auth config page', () => {
  it('renders the page without crashing', () => {
    expect(() => render(<GoogleAuthConfigPage />)).not.toThrow();
  });

  it('displays the configuration heading', async () => {
    render(<GoogleAuthConfigPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Google Authentication Configuration')
      ).toBeInTheDocument();
    });
  });

  it('displays the authentication control section', async () => {
    render(<GoogleAuthConfigPage />);
    await waitFor(() => {
      expect(screen.getByText('Google Authentication Control')).toBeInTheDocument();
    });
  });

  it('displays the configuration status section', async () => {
    render(<GoogleAuthConfigPage />);
    await waitFor(() => {
      expect(screen.getByText('Configuration Status')).toBeInTheDocument();
    });
  });

  it('displays the setup guide', async () => {
    render(<GoogleAuthConfigPage />);
    await waitFor(() => {
      expect(screen.getByText('Setup Guide')).toBeInTheDocument();
    });
  });
});
