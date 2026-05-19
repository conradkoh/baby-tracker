import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Last24hSummaryCard } from './Last24hSummaryCard';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
});

describe('Last24hSummaryCard', () => {
  it('renders all 6 rows even when all values are empty or zero', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    const { container } = render(
      <Last24hSummaryCard summary={summary} nowMs={Date.now()} />
    );
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText(/Last:/)).toBeInTheDocument();
    expect(screen.getByText(/3h:/)).toBeInTheDocument();
    expect(screen.getByText(/24h:/)).toBeInTheDocument();
    expect(screen.getByText('Wet:')).toBeInTheDocument();
    expect(screen.getByText('Mixed:')).toBeInTheDocument();
    expect(screen.getByText('Dirty:')).toBeInTheDocument();
    expect(screen.getAllByText(/^\u2014$/)).toHaveLength(6);
  });

  it('renders feed stats when values are non-zero', () => {
    const summary = {
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
    expect(screen.getByText(/^\d+h ago$/)).toBeInTheDocument();
  });

  it('renders non-zero values alongside em-dashes for zero values', () => {
    const summary = {
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 60, total24hMl: 60, bottleCount: 1 },
      diapers: { wet: 2, dirty: 0, mixed: 0, total: 2 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('1h ago')).toBeInTheDocument();
    expect(screen.getAllByText(/60 ml/)).toHaveLength(2);
    expect(screen.getByText(/^2$/)).toBeInTheDocument();
    expect(screen.getAllByText(/^\u2014$/)).toHaveLength(2);
  });

  it('renders no em-dashes when all values are non-zero', () => {
    const summary = {
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 60, total24hMl: 120, bottleCount: 2 },
      diapers: { wet: 2, dirty: 1, mixed: 3, total: 6 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.queryByText('\u2014')).not.toBeInTheDocument();
  });

  it('renders diaper labels in DOM order', () => {
    const summary = {
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

  it('applies font-medium only to volume values, not time-ago', () => {
    const summary = {
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
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 99, mixed: 99, dirty: 99, total: 297 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('Wet:')).toBeInTheDocument();
    expect(screen.getByText('Mixed:')).toBeInTheDocument();
    expect(screen.getByText('Dirty:')).toBeInTheDocument();
    expect(screen.getAllByText(/^99$/)).toHaveLength(3);
  });

  it('applies dark mode classes via semantic color tokens', () => {
    const summary = {
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 0, total24hMl: 0, bottleCount: 0 },
      diapers: { wet: 1, dirty: 0, mixed: 0, total: 1 },
    };
    const { container } = render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    const root = container.firstChild as Element;
    expect(root.className).toMatch(/bg-rose-50/);
    expect(root.className).toMatch(/dark:bg-rose-950/);
  });
});
