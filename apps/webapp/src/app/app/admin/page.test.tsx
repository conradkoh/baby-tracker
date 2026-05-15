/**
 * Admin dashboard page smoke test — verifies the page mounts and
 * renders system status cards.
 */
import { render, screen } from '@/__tests__/test-utils';
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
    appInfo: {
      version: '2.0.0',
      googleAuthAvailable: true,
      googleAuthDetails: { isConfiguredInDatabase: true },
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

// ── Tests ───────────────────────────────────────────────────────

import AdminDashboard from './page';

describe('Admin dashboard page', () => {
  it('renders the page without crashing', () => {
    expect(() => render(<AdminDashboard />)).not.toThrow();
  });

  it('displays the admin dashboard heading', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('displays the app version status card', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('App Version')).toBeInTheDocument();
  });

  it('displays the google auth status card', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Google Auth')).toBeInTheDocument();
  });

  it('displays the system information section', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('System Information')).toBeInTheDocument();
  });
});
