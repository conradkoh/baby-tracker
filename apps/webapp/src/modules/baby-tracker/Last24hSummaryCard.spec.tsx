import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Last24hSummaryCard } from './Last24hSummaryCard';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
});

const defaultSummary = {
  hasAny: false,
  feed: { lastFeedAtMs: null, threeHourAvgMl: 0, total24hMl: 0, bottleCount: 0 },
  diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
};

describe('Last24hSummaryCard', () => {
  it('renders nothing when hasAny is false', () => {
    const { container } = render(
      <Last24hSummaryCard summary={defaultSummary} nowMs={Date.now()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders feed stats correctly with ≥2 bottle feeds', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, threeHourAvgMl: 90, total24hMl: 240, bottleCount: 3 },
      diapers: { wet: 2, dirty: 1, mixed: 0, total: 3 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('Last 24h')).toBeInTheDocument();
    expect(screen.getByText(/Last:/)).toBeInTheDocument();
    expect(screen.getByText(/3h avg:/)).toBeInTheDocument();
    expect(screen.getByText(/90 ml/)).toBeInTheDocument();
    expect(screen.getByText(/24h:/)).toBeInTheDocument();
    expect(screen.getByText(/240 ml/)).toBeInTheDocument();
  });

  it('hides 3h avg / 24h total when bottleCount < 2', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, threeHourAvgMl: 0, total24hMl: 60, bottleCount: 1 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/Last:/)).toBeInTheDocument();
    expect(screen.queryByText(/3h avg:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/24h:/)).not.toBeInTheDocument();
  });

  it('renders diaper counts excluding zeros', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, threeHourAvgMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 3, dirty: 1, mixed: 0, total: 4 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/3 wet/)).toBeInTheDocument();
    expect(screen.getByText(/1 dirty/)).toBeInTheDocument();
    expect(screen.queryByText(/mixed/)).not.toBeInTheDocument();
  });

  it('shows "No feeds" when lastFeedAtMs is null', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: null, threeHourAvgMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('No feeds')).toBeInTheDocument();
  });

  it('shows "No changes" when no diapers', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, threeHourAvgMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('No changes')).toBeInTheDocument();
  });

  it('applies dark mode classes via semantic color tokens', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, threeHourAvgMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 1, dirty: 0, mixed: 0, total: 1 },
    };
    const { container } = render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    const root = container.firstChild as Element;
    expect(root.className).toMatch(/bg-indigo-50/);
    expect(root.className).toMatch(/dark:bg-indigo-950/);
  });
});