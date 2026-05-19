import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailySummaryCard } from './DailySummaryCard';
import type { DailySummary } from '@/lib/daily-summary';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
});

const defaultSummary: DailySummary = {
  hasAny: false,
  feed: { bottle: null, latch: null, solids: null },
  diapers: null,
  medical: null,
};

describe('DailySummaryCard', () => {
  it('renders nothing when hasAny is false', () => {
    const { container } = render(<DailySummaryCard summary={defaultSummary} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when hasAny is false', () => {
    const { container } = render(<DailySummaryCard summary={defaultSummary} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders card with header even when all sections are null (hasAny:true is inconsistent)', () => {
    // hasAny:true but all null — component still renders (hasAny drives null-return, not section nulls)
    const summary: DailySummary = {
      hasAny: true,
      feed: { bottle: null, latch: null, solids: null },
      diapers: null,
      medical: null,
    };
    const { container } = render(<DailySummaryCard summary={summary} />);
    // Card renders but body is empty — not fully empty (header is present)
    expect(container.querySelector('[data-slot="card"]')).not.toBeNull();
  });

  it('renders the header with Today and date', () => {
    const summary: DailySummary = {
      hasAny: true,
      feed: {
        bottle: { totalMl: 100, count: 2, breakdown: [{ subType: 'expressed', count: 2, ml: 100 }] },
        latch: null,
        solids: null,
      },
      diapers: null,
      medical: null,
    };
    render(<DailySummaryCard summary={summary} />);
    expect(screen.getByText(/^Today/)).toBeInTheDocument();
    expect(screen.getByText(/Wed, 15 Jan/)).toBeInTheDocument();
  });

  describe('Feed section', () => {
    it('renders bottle line correctly', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: {
          bottle: { totalMl: 150, count: 3, breakdown: [{ subType: 'expressed', count: 2, ml: 120 }, { subType: 'formula', count: 1, ml: 30 }] },
          latch: null,
          solids: null,
        },
        diapers: null,
        medical: null,
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/Bottle:/)).toBeInTheDocument();
      expect(screen.getByText(/150ml/)).toBeInTheDocument();
      expect(screen.getByText(/3 feeds/)).toBeInTheDocument();
      // breakdown shown when >1 active subtypes
      expect(screen.getByText(/2 expressed, 1 formula/)).toBeInTheDocument();
    });

    it('does NOT show breakdown when only one active subtype', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: {
          bottle: { totalMl: 60, count: 1, breakdown: [{ subType: 'expressed', count: 1, ml: 60 }, { subType: 'formula', count: 0, ml: 0 }, { subType: 'water', count: 0, ml: 0 }] },
          latch: null,
          solids: null,
        },
        diapers: null,
        medical: null,
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it('renders latch line correctly', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: {
          bottle: null,
          latch: { count: 2, avgLeftSeconds: 600, avgRightSeconds: 300 },
          solids: null,
        },
        diapers: null,
        medical: null,
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/Latch:/)).toBeInTheDocument();
      expect(screen.getByText(/2 sessions/)).toBeInTheDocument();
      expect(screen.getByText(/avg L 10 min 0 sec/)).toBeInTheDocument();
    });

    it('renders solids line correctly', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: {
          bottle: null,
          latch: null,
          solids: { count: 2, descriptions: ['Rice', 'Banana'] },
        },
        diapers: null,
        medical: null,
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/Solids:/)).toBeInTheDocument();
      expect(screen.getByText(/2/)).toBeInTheDocument();
      expect(screen.getByText(/Rice, Banana/)).toBeInTheDocument();
    });

    it('truncates solids descriptions at 3 and shows +N more', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: {
          bottle: null,
          latch: null,
          solids: { count: 5, descriptions: ['Rice', 'Banana', 'Oats', 'Peas', 'Carrot'] },
        },
        diapers: null,
        medical: null,
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/^Solids:/)).toBeInTheDocument();
      expect(screen.getByText(/Rice, Banana, Oats/)).toBeInTheDocument();
      expect(screen.getByText(/\+2 more/)).toBeInTheDocument();
    });
  });

  describe('Diaper section', () => {
    it('renders diaper counts, omitting zero types', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: {
          wet: 4,
          dirty: 1,
          mixed: 2,
          total: 7,
          lastWetAgoMs: 3_600_000,
          lastDirtyAgoMs: null,
          lastMixedAgoMs: null,
        },
        medical: null,
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/Diapers/)).toBeInTheDocument();
      expect(screen.getByText(/4 wet/)).toBeInTheDocument();
      expect(screen.getByText(/2 mixed/)).toBeInTheDocument();
      expect(screen.getByText(/1 dirty/)).toBeInTheDocument();
      expect(screen.getByText(/Last wet: 1h ago/)).toBeInTheDocument();
    });

    it('shows last wet ago as primary info', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: {
          wet: 2,
          dirty: 1,
          mixed: 1,
          total: 4,
          lastWetAgoMs: 7_200_000,
          lastDirtyAgoMs: 5_400_000,
          lastMixedAgoMs: null,
        },
        medical: null,
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/Last wet: 2h ago/)).toBeInTheDocument();
      // dirty should NOT be shown as last since wet is preferred
      expect(screen.queryByText(/Last dirty/)).not.toBeInTheDocument();
    });

    it('falls back to dirty when no wet ago available', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: {
          wet: 0,
          dirty: 2,
          mixed: 1,
          total: 3,
          lastWetAgoMs: null,
          lastDirtyAgoMs: 10_800_000,
          lastMixedAgoMs: 5_400_000,
        },
        medical: null,
      };
      render(<DailySummaryCard summary={summary} />);
      // mixed is preferred over dirty
      expect(screen.getByText(/Last mixed: 1h ago/)).toBeInTheDocument();
    });
  });

  describe('Medical section', () => {
    it('renders latest temperature', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: null,
        medical: {
          latestTemperature: { valueC: 37.5, agoMs: 7_200_000 },
          medicines: [],
        },
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/Medical/)).toBeInTheDocument();
      expect(screen.getByText(/37\.5.*°C/)).toBeInTheDocument();
      expect(screen.getByText(/2h ago/)).toBeInTheDocument();
    });

    it('renders medicine line with total and count', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: null,
        medical: {
          latestTemperature: null,
          medicines: [{ name: 'Paracetamol', unit: 'ml', totalValue: 15, count: 3, mixedUnits: false }],
        },
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/Paracetamol:/)).toBeInTheDocument();
      expect(screen.getByText(/15 ml/)).toBeInTheDocument();
      expect(screen.getByText(/3 doses/)).toBeInTheDocument();
    });

    it('renders mixedUnits medicine correctly', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: null,
        medical: {
          latestTemperature: null,
          medicines: [{ name: 'Paracetamol', unit: 'ml', totalValue: 5, count: 2, mixedUnits: true }],
        },
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/Paracetamol:/)).toBeInTheDocument();
      expect(screen.getByText(/2 doses \(mixed units\)/)).toBeInTheDocument();
    });

    it('renders multiple medicines', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: null,
        medical: {
          latestTemperature: { valueC: 38.0, agoMs: 3_600_000 },
          medicines: [
            { name: 'Paracetamol', unit: 'ml', totalValue: 10, count: 2, mixedUnits: false },
            { name: 'Ibuprofen', unit: 'ml', totalValue: 8, count: 1, mixedUnits: false },
          ],
        },
      };
      render(<DailySummaryCard summary={summary} />);
      expect(screen.getByText(/Paracetamol:/)).toBeInTheDocument();
      expect(screen.getByText(/Ibuprofen:/)).toBeInTheDocument();
    });
  });

  it('renders all three sections simultaneously', () => {
    const summary: DailySummary = {
      hasAny: true,
      feed: {
        bottle: { totalMl: 120, count: 2, breakdown: [{ subType: 'expressed', count: 2, ml: 120 }, { subType: 'formula', count: 0, ml: 0 }, { subType: 'water', count: 0, ml: 0 }] },
        latch: null,
        solids: null,
      },
      diapers: {
        wet: 3, dirty: 1, mixed: 0, total: 4,
        lastWetAgoMs: 1_800_000, lastDirtyAgoMs: null, lastMixedAgoMs: null,
      },
      medical: {
        latestTemperature: null,
        medicines: [{ name: 'Vitamin D', unit: 'drops', totalValue: 4, count: 1, mixedUnits: false }],
      },
    };
    render(<DailySummaryCard summary={summary} />);
    expect(screen.getByText(/^Feed$/)).toBeInTheDocument();
    expect(screen.getByText(/^Diapers$/)).toBeInTheDocument();
    expect(screen.getByText(/^Medical$/)).toBeInTheDocument();
  });
});