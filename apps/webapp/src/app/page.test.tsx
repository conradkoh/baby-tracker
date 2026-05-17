/**
 * Landing page smoke test — verifies the page mounts and renders core content.
 */
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { createApiMock, createConvexReactMock, createFeatureFlagsMock, createNextLinkMock, createNextNavMock } from '@/__tests__/test-utils';

// ── Top-level mocks ─────────────────────────────────────────────

vi.mock('next/navigation', () => createNextNavMock());
vi.mock('next/link', () => createNextLinkMock());
vi.mock('convex/react', () => createConvexReactMock());
vi.mock('@workspace/backend/convex/_generated/api', () => createApiMock());
vi.mock('@workspace/backend/config/featureFlags', () => createFeatureFlagsMock());

vi.mock('@/modules/app/useAppInfo', () => ({
  useAppVersion: () => '1.0.0-test',
}));

// ── Tests ───────────────────────────────────────────────────────

import LandingPage from './page';

describe('Landing page', () => {
  it('renders the page without crashing', () => {
    expect(() => render(<LandingPage />)).not.toThrow();
  });

  it('displays the app title as a heading', async () => {
    render(<LandingPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Baby Tracker' })).toBeInTheDocument();
    });
  });

  it('displays a Get Started call-to-action', async () => {
    render(<LandingPage />);
    await waitFor(() => {
      expect(screen.getByText('Get Started Free')).toBeInTheDocument();
    });
  });

  it('renders the features section', async () => {
    render(<LandingPage />);
    await waitFor(() => {
      expect(screen.getByText('Feed Tracking')).toBeInTheDocument();
      expect(screen.getByText('Diaper Changes')).toBeInTheDocument();
      expect(screen.getByText('Medical Logs')).toBeInTheDocument();
    });
  });

  it('displays download buttons', async () => {
    render(<LandingPage />);
    await waitFor(() => {
      expect(screen.getByText('App Store (Coming Soon)')).toBeInTheDocument();
      expect(screen.getByText('Google Play (Coming Soon)')).toBeInTheDocument();
    });
  });
});
