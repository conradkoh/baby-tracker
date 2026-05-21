import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Last24hSummaryCard } from './Last24hSummaryCard';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
});

describe('Last24hSummaryCard', () => {
  it('renders a skeleton placeholder when summary is undefined', () => {
    render(<Last24hSummaryCard summary={undefined} nowMs={Date.now()} />);
    expect(screen.getByText('Last 24h')).toBeInTheDocument();
    expect(screen.queryByText(/Last:/)).not.toBeInTheDocument();
  });


  it('renders all 6 rows even when all values are empty or zero', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
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
    // Last (1) + 3 diaper rows (3) = 4 standalone dash text nodes.
    expect(screen.getAllByText(/^\u2014$/)).toHaveLength(4);
    // ml part is its own cell; 3h ml + 24h ml = 2 dashed-ml cells.
    expect(screen.getAllByText(/^\u2014 ml$/)).toHaveLength(2);
    // latch part is its own cell prefixed with `· `; 3h + 24h = 2 dashed-latch cells.
    expect(screen.getAllByText(/^· \u2014 min \u2014 sec$/)).toHaveLength(2);
  });

  it('renders feed stats when values are non-zero', () => {
    const summary = {
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 90, total24hMl: 240, bottleCount: 3, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
      diapers: { wet: 2, dirty: 1, mixed: 0, total: 3 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('Last 24h')).toBeInTheDocument();
    expect(screen.getByText(/Last:/)).toBeInTheDocument();
    expect(screen.getByText(/3h:/)).toBeInTheDocument();
    expect(screen.getByText(/^90 ml$/)).toBeInTheDocument();
    expect(screen.getByText(/24h:/)).toBeInTheDocument();
    expect(screen.getByText(/^240 ml$/)).toBeInTheDocument();
    expect(screen.getByText(/^\d+h( \d+min)? ago$/)).toBeInTheDocument();
  });

  it('renders non-zero values alongside em-dashes for zero values', () => {
    const summary = {
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 60, total24hMl: 60, bottleCount: 1, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
      diapers: { wet: 2, dirty: 0, mixed: 0, total: 2 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText('1h ago')).toBeInTheDocument();
    expect(screen.getAllByText(/^60 ml$/)).toHaveLength(2);
    expect(screen.getByText(/^2$/)).toBeInTheDocument();
    // Two standalone diaper dashes (dirty=0, mixed=0). Feed latch cells embed
    // dashes inside the `· — min — sec` string, so they are not standalone.
    expect(screen.getAllByText(/^\u2014$/)).toHaveLength(2);
  });

  it('renders no standalone em-dashes when all values are non-zero', () => {
    const summary = {
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 60, total24hMl: 120, bottleCount: 2, last3hLatchSeconds: 480, total24hLatchSeconds: 1920, latchCount: 4 },
      diapers: { wet: 2, dirty: 1, mixed: 3, total: 6 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.queryByText(/^\u2014$/)).not.toBeInTheDocument();
  });

  it('renders diaper labels in DOM order', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
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
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 60, total24hMl: 120, bottleCount: 2, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    const timeAgoEl = screen.getByText(/^\d+h( \d+min)? ago$/);
    expect(timeAgoEl.className).not.toMatch(/font-medium/);
    expect(timeAgoEl.className).toMatch(/text-foreground/);
    const vol3h = screen.getByText(/^60 ml$/);
    expect(vol3h.className).toMatch(/font-medium/);
    const vol24h = screen.getByText(/^120 ml$/);
    expect(vol24h.className).toMatch(/font-medium/);
    // Latch cells are also font-medium for visual weight parity.
    const latchCells = screen.getAllByText(/^· \u2014 min \u2014 sec$/);
    expect(latchCells).toHaveLength(2);
    for (const cell of latchCells) {
      expect(cell.className).toMatch(/font-medium/);
    }
  });

  it('renders large diaper counts correctly', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
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
      feed: { lastFeedAtMs: Date.now() - 3_600_000, last3hMl: 0, total24hMl: 0, bottleCount: 0, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
      diapers: { wet: 1, dirty: 0, mixed: 0, total: 1 },
    };
    const { container } = render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    const root = container.firstChild as Element;
    expect(root.className).toMatch(/bg-rose-50/);
    expect(root.className).toMatch(/dark:bg-rose-950/);
  });

  it('renders 3h ml and latch in separate aligned grid cells', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 90, total24hMl: 240, bottleCount: 3, last3hLatchSeconds: 480, total24hLatchSeconds: 1920, latchCount: 4 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/^90 ml$/)).toBeInTheDocument();
    expect(screen.getByText(/^· 8 min 0 sec$/)).toBeInTheDocument();
  });

  it('renders dashed latch cell in 3h row when latch is absent', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 90, total24hMl: 240, bottleCount: 3, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/^90 ml$/)).toBeInTheDocument();
    // Both 3h and 24h render the same dashed latch cell.
    expect(screen.getAllByText(/^· \u2014 min \u2014 sec$/)).toHaveLength(2);
  });

  it('renders dashed ml cell in 3h row when ml is absent', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0, last3hLatchSeconds: 480, total24hLatchSeconds: 1920, latchCount: 4 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getAllByText(/^\u2014 ml$/)).toHaveLength(2);
    expect(screen.getByText(/^· 8 min 0 sec$/)).toBeInTheDocument();
  });

  it('renders both parts dashed in 3h row when neither ml nor latch present', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getAllByText(/^\u2014 ml$/)).toHaveLength(2);
    expect(screen.getAllByText(/^· \u2014 min \u2014 sec$/)).toHaveLength(2);
  });

  it('renders 24h ml and latch in separate aligned grid cells', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 240, bottleCount: 3, last3hLatchSeconds: 0, total24hLatchSeconds: 1920, latchCount: 4 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/^240 ml$/)).toBeInTheDocument();
    expect(screen.getByText(/^· 32 min 0 sec$/)).toBeInTheDocument();
  });

  it('renders dashed latch cell in 24h row when latch is absent', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 240, bottleCount: 3, last3hLatchSeconds: 0, total24hLatchSeconds: 0, latchCount: 0 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/^240 ml$/)).toBeInTheDocument();
  });

  it('renders dashed ml cell in 24h row when ml is absent', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 0, total24hMl: 0, bottleCount: 0, last3hLatchSeconds: 0, total24hLatchSeconds: 1920, latchCount: 4 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    render(<Last24hSummaryCard summary={summary} nowMs={Date.now()} />);
    expect(screen.getByText(/^· 32 min 0 sec$/)).toBeInTheDocument();
  });

  it('uses a 3-column grid so ml and latch align across 3h and 24h rows', () => {
    const summary = {
      feed: { lastFeedAtMs: null, last3hMl: 90, total24hMl: 240, bottleCount: 3, last3hLatchSeconds: 480, total24hLatchSeconds: 1920, latchCount: 4 },
      diapers: { wet: 0, dirty: 0, mixed: 0, total: 0 },
    };
    const { container } = render(
      <Last24hSummaryCard summary={summary} nowMs={Date.now()} />
    );
    // Feed inner grid uses 3 columns: label, ml, latch.
    const grids = container.querySelectorAll('div.grid');
    const feedGrid = Array.from(grids).find((el) =>
      el.className.includes('grid-cols-[auto_auto_1fr]')
    );
    expect(feedGrid).toBeDefined();
    // The Last row value cell spans both value columns.
    const colSpan = feedGrid?.querySelector('.col-span-2');
    expect(colSpan).not.toBeNull();
  });

  it('skeleton renders 4 skeleton rows per column', () => {
    const { container } = render(<Last24hSummaryCard summary={undefined} nowMs={Date.now()} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(8);
  });
});
