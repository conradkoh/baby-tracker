/**
 * Login page smoke test — verifies the page mounts and renders core content.
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
vi.mock('@workspace/backend/config/featureFlags', () => createFeatureFlagsMock());
vi.mock('@/modules/auth/AuthProvider', () => createAuthMock({ state: 'unauthenticated' }));

vi.mock('@/modules/app/useAppInfo', () => ({
  useGoogleAuthAvailable: () => false,
}));

vi.mock('@/modules/auth/AnonymousLoginButton', () => ({
  AnonymousLoginButton: () => <div data-testid="anon-login">Anonymous</div>,
}));

vi.mock('@/modules/auth/GoogleLoginButton', () => ({
  GoogleLoginButton: () => <div data-testid="google-login">Google</div>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Tests ───────────────────────────────────────────────────────

import LoginPage from './page';

describe('Login page', () => {
  it('renders the page without crashing', () => {
    expect(() => render(<LoginPage />)).not.toThrow();
  });

  it('displays the welcome heading', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('shows the login code option', () => {
    render(<LoginPage />);
    expect(screen.getByText('Enter Login Code')).toBeInTheDocument();
  });

  it('shows the account recovery link', () => {
    render(<LoginPage />);
    expect(screen.getByText('Lost access to your account?')).toBeInTheDocument();
  });

  it('shows the terms footer', () => {
    render(<LoginPage />);
    expect(screen.getByText(/terms of service/)).toBeInTheDocument();
  });
});
