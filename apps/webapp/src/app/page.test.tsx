/**
 * Home page smoke test — verifies the page mounts and renders core content.
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

import Home from './page';

describe('Home page', () => {
  it('renders the page without crashing', () => {
    expect(() => render(<Home />)).not.toThrow();
  });

  it('displays the app title', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText('Baby Tracker')).toBeInTheDocument();
    });
  });

  it('displays the app version', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/1\.0\.0-test/)).toBeInTheDocument();
    });
  });
});
