/**
 * Profile page smoke test — verifies the page mounts and renders
 * different content based on auth state.
 */
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { describe, expect, it, vi } from 'vitest';

import {
  createApiMock,
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

// Mock sub-components to isolate page-level rendering
vi.mock('@/modules/auth/AuthProvider', () => ({
  useAuthState: () => ({
    sessionId: 'test-session',
    state: 'authenticated' as const,
    user: { _id: 'u1', _creationTime: Date.now(), type: 'anonymous', name: 'Test' },
    accessLevel: 'user' as const,
    isSystemAdmin: false,
  }),
}));

vi.mock('@/modules/profile/NameEditForm', () => ({
  NameEditForm: () => <div data-testid="name-edit-form">Name Edit Form</div>,
}));

vi.mock('@/modules/auth/LoginCodeGenerator', () => ({
  LoginCodeGenerator: () => <div data-testid="login-code-gen">Login Code Generator</div>,
}));

vi.mock('@/modules/theme/ThemeSettings', () => ({
  ThemeSettings: () => <div data-testid="theme-settings">Theme Settings</div>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Tests ───────────────────────────────────────────────────────

import ProfilePage from './page';

describe('Profile page', () => {
  it('renders the page without crashing', () => {
    expect(() => render(<ProfilePage />)).not.toThrow();
  });

  it('displays the profile heading', async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  it('renders the account information section', async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
  });

  it('renders the name edit form', async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByTestId('name-edit-form')).toBeInTheDocument();
    });
  });

  it('renders the theme settings', async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByTestId('theme-settings')).toBeInTheDocument();
    });
  });

  it('renders the account recovery section', async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Account Recovery')).toBeInTheDocument();
    });
  });
});
