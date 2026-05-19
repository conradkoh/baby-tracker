import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Last24hSummaryCard } from './Last24hSummaryCard';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
});

const defaultSummary = {
  hasAny: false,
  feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
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
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 90, total24hMl: 240, bottleCount: 3 },
      diapers: { wet: 2, dirty: 1, mixed: 0, total: 3 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('Last 24h')).toBeInTheDocument();
    expect(screen.getByText(/Last:/)).toBeInTheDocument();
    expect(screen.getByText(/3h:/)).toBeInTheDocument();
    expect(screen.getByText(/90 ml/)).toBeInTheDocument();
    expect(screen.getByText(/24h:/)).toBeInTheDocument();
    expect(screen.getByText(/240 ml/)).toBeInTheDocument();
  });

  it('renders both volume lines when bottleCount === 1', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 60, total24hMl: 60, bottleCount: 1 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/Last:/)).toBeInTheDocument();
    expect(screen.getByText(/3h:/)).toBeInTheDocument();
    expect(screen.getByText(/24h:/)).toBeInTheDocument();
    expect(screen.getAllByText(/60 ml/)).toHaveLength(2);
  });

  it('hides volume lines when bottleCount === 0', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/Last:/)).toBeInTheDocument();
    expect(screen.queryByText(/3h:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/24h:/)).not.toBeInTheDocument();
  });

  it('renders diaper counts excluding zeros', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 3, dirty: 1, mixed: 0, total: 4 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('Wet:')).toBeInTheDocument();
    expect(screen.getByText(/^3$/)).toBeInTheDocument();
    expect(screen.getByText('Dirty:')).toBeInTheDocument();
    expect(screen.getByText(/^1$/)).toBeInTheDocument();
    expect(screen.queryByText('Mixed:')).not.toBeInTheDocument();
  });

  it('shows "No feeds" when lastFeedAtMs is null', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('No feeds')).toBeInTheDocument();
  });

  it('shows "No changes" when no diapers', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('No changes')).toBeInTheDocument();
  });

  it('applies dark mode classes via semantic color tokens', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 1, dirty: 0, mixed: 0, total: 1 },
    };
    const { container } = render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    const root = container.firstChild as Element;
    expect(root.className).toMatch(/bg-rose-50/);
    expect(root.className).toMatch(/dark:bg-rose-950/);
  });

  it('hides 3h row when last3hMl is 0 even with bottles in window', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 5 * 3_600_000, last3hMl: 0, total24hMl: 60, bottleCount: 1 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/Last:/)).toBeInTheDocument();
    expect(screen.queryByText(/3h:/)).not.toBeInTheDocument();
    expect(screen.getByText(/24h:/)).toBeInTheDocument();
    expect(screen.getByText(/60 ml/)).toBeInTheDocument();
  });

  it('shows 3h row when last3hMl > 0 with a single recent bottle', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 60, total24hMl: 60, bottleCount: 1 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/3h:/)).toBeInTheDocument();
    expect(screen.getByText(/24h:/)).toBeInTheDocument();
    expect(screen.getAllByText(/60 ml/)).toHaveLength(2);
  });

  it('renders all diaper kinds in DOM order when all non-zero', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 2, mixed: 1, dirty: 3, total: 6 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    const labels = screen.getAllByText(/^(Wet|Mixed|Dirty):$/);
    expect(labels).toHaveLength(3);
    expect(labels[0].textContent).toBe('Wet:');
    expect(labels[1].textContent).toBe('Mixed:');
    expect(labels[2].textContent).toBe('Dirty:');
  });

  it('hides card when hasAny is false even with populated feed/diapers', () => {
    const summary = {
      hasAny: false,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 90, total24hMl: 240, bottleCount: 3 },
      diapers: { wet: 2, dirty: 1, mixed: 0, total: 3 },
    };
    const { container } = render(
      <Last24hSummaryCard summary={summary} nowMs={Date.now()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('applies font-medium only to volume values, not time-ago', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 60, total24hMl: 120, bottleCount: 2 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    const timeAgoEl = screen.getByText(/^\d+h ago$/);
    expect(timeAgoEl.className).not.toMatch(/font-medium/);
    expect(timeAgoEl.className).toMatch(/text-foreground/);
    const vol3h = screen.getByText(/^60 ml$/);
    expect(vol3h.className).toMatch(/font-medium/);
    const vol24h = screen.getByText(/^120 ml$/);
    expect(vol24h.className).toMatch(/font-medium/);
  });

  it('renders large diaper counts correctly', () => {
    const summary = {
      hasAny: true,
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 99, mixed: 99, dirty: 99, total: 297 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('Wet:')).toBeInTheDocument();
    expect(screen.getByText('Mixed:')).toBeInTheDocument();
    expect(screen.getByText('Dirty:')).toBeInTheDocument();
    expect(screen.getAllByText(/^99$/)).toHaveLength(3);
  });
});