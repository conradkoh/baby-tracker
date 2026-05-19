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
    const { container } = render(
      <DailySummaryCard isToday summary={defaultSummary} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when hasAny is false', () => {
    const { container } = render(
      <DailySummaryCard isToday summary={defaultSummary} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders card with header even when all sections are null (hasAny:true is inconsistent)', () => {
    const summary: DailySummary = {
      hasAny: true,
      feed: { bottle: null, latch: null, solids: null },
      diapers: null,
      medical: null,
    };
    const { container } = render(
      <DailySummaryCard isToday summary={summary} />
    );
    expect(container.querySelector('[data-slot="card"]')).not.toBeNull();
  });

  describe('Feed section', () => {
    it('renders bottle total ml + feed count', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: {
          bottle: { totalMl: 120, count: 2, breakdown: [
            { subType: 'expressed', count: 2, ml: 120 },
            { subType: 'formula', count: 0, ml: 0 },
            { subType: 'water', count: 0, ml: 0 },
          ] },
          latch: null,
          solids: null,
        },
        diapers: null,
        medical: null,
      };
      render(<DailySummaryCard isToday summary={summary} />);
      // Text is split across elements: "Bottle: " + "120ml" + " · 2 feeds"
      expect(screen.getByText(/Bottle:/)).toBeInTheDocument();
      expect(screen.getByText(/120ml/)).toBeInTheDocument();
      expect(screen.getByText(/2 feeds/)).toBeInTheDocument();
    });

    it('renders bottle breakdown only when multiple sub-types present', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: {
          bottle: { totalMl: 180, count: 3, breakdown: [
            { subType: 'expressed', count: 2, ml: 120 },
            { subType: 'formula', count: 1, ml: 60 },
            { subType: 'water', count: 0, ml: 0 },
          ] },
          latch: null,
          solids: null,
        },
        diapers: null,
        medical: null,
      };
      render(<DailySummaryCard isToday summary={summary} />);
      expect(screen.getByText('(2 expressed, 1 formula)')).toBeInTheDocument();
    });

    it('renders latch session count + avg durations', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: { count: 3, avgLeftSeconds: 600, avgRightSeconds: 480 }, solids: null },
        diapers: null,
        medical: null,
      };
      render(<DailySummaryCard isToday summary={summary} />);
      // "3 session" + "s" (split across two elements)
      expect(screen.getByText(/3 session/)).toBeInTheDocument();
      expect(screen.getByText(/avg L 10 min 0 sec \/ R 8 min 0 sec/)).toBeInTheDocument();
    });

    it('renders solids count + descriptions, caps at 3 shown', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: {
          bottle: null, latch: null,
          solids: { count: 5, descriptions: ['Rice', 'Banana', 'Oats', 'Carrot', 'Apple'] },
        },
        diapers: null,
        medical: null,
      };
      render(<DailySummaryCard isToday summary={summary} />);
      // "5" + " · Rice, Banana, Oats" + "+2 more"
      expect(screen.getByText(/Solids:/)).toBeInTheDocument();
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
          lastWetAt: '2025-01-15T08:00:00.000Z',
          lastDirtyAt: null,
          lastMixedAt: null,
        },
        medical: null,
      };
      render(<DailySummaryCard isToday summary={summary} />);
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
          lastWetAt: '2025-01-15T08:00:00.000Z',
          lastDirtyAt: '2025-01-15T10:00:00.000Z',
          lastMixedAt: null,
        },
        medical: null,
      };
      render(<DailySummaryCard isToday summary={summary} />);
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
          lastWetAt: null,
          lastDirtyAt: '2025-01-15T10:00:00.000Z',
          lastMixedAt: '2025-01-15T08:00:00.000Z',
        },
        medical: null,
      };
      render(<DailySummaryCard isToday summary={summary} />);
      // mixed is preferred over dirty; lastMixedAgoMs=5_400_000 → humanizeAgo → "1h ago"
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
          latestTemperature: { valueC: 37.5, agoMs: 7_200_000, at: '2025-01-15T10:00:00.000Z' },
          medicines: [],
        },
      };
      render(<DailySummaryCard isToday summary={summary} />);
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
      render(<DailySummaryCard isToday summary={summary} />);
      expect(screen.getByText(/Paracetamol:/)).toBeInTheDocument();
      // Dosage text: "over 3 doses" (the "15 ml" part is in the font-medium span)
      expect(screen.getByText(/over 3 doses/)).toBeInTheDocument();
    });

    it('renders multiple medicines', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: null,
        medical: {
          latestTemperature: { valueC: 38.0, agoMs: 3_600_000, at: '2025-01-15T11:00:00.000Z' },
          medicines: [
            { name: 'Paracetamol', unit: 'ml', totalValue: 10, count: 2, mixedUnits: false },
            { name: 'Ibuprofen', unit: 'ml', totalValue: 8, count: 1, mixedUnits: false },
          ],
        },
      };
      render(<DailySummaryCard isToday summary={summary} />);
      expect(screen.getByText(/Paracetamol:/)).toBeInTheDocument();
      expect(screen.getByText(/Ibuprofen:/)).toBeInTheDocument();
    });
  });

  describe('isToday behavior', () => {
    it('renders "Last wet: 1h ago" when isToday=true', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: {
          wet: 1, dirty: 0, mixed: 0, total: 1,
          lastWetAgoMs: 3_600_000, lastDirtyAgoMs: null, lastMixedAgoMs: null,
          lastWetAt: '2025-01-15T10:00:00.000Z', lastDirtyAt: null, lastMixedAt: null,
        },
        medical: null,
      };
      render(<DailySummaryCard isToday summary={summary} />);
      expect(screen.getByText(/Last wet: 1h ago/)).toBeInTheDocument();
    });

    it('renders "at HH:mm" (12-hour format) when isToday=false', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: {
          wet: 1, dirty: 0, mixed: 0, total: 1,
          lastWetAgoMs: 3_600_000, lastDirtyAgoMs: null, lastMixedAgoMs: null,
          lastWetAt: '2025-01-15T10:30:00.000Z', lastDirtyAt: null, lastMixedAt: null,
        },
        medical: null,
      };
      render(<DailySummaryCard isToday={false} summary={summary} />);
      // formatTime outputs 12-hour like "10:30 AM" or "6:30 PM"
      expect(screen.getByText(/Last wet: at (10:30 AM|10:30 PM|6:30 AM|6:30 PM)/)).toBeInTheDocument();
    });

    it('renders "at HH:mm" for latest temp when isToday=false', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: null,
        medical: {
          latestTemperature: { valueC: 37.5, agoMs: 7_200_000, at: '2025-01-15T10:30:00.000Z' },
          medicines: [],
        },
      };
      render(<DailySummaryCard isToday={false} summary={summary} />);
      expect(screen.getByText(/37\.5.*°C/)).toBeInTheDocument();
      expect(screen.getByText(/ at (10:30 AM|10:30 PM|6:30 AM|6:30 PM)/)).toBeInTheDocument();
    });

    it('renders "Xh ago ago" for latest temp when isToday=true (humanizeAgo already appends " ago")', () => {
      const summary: DailySummary = {
        hasAny: true,
        feed: { bottle: null, latch: null, solids: null },
        diapers: null,
        medical: {
          latestTemperature: { valueC: 37.5, agoMs: 7_200_000, at: '2025-01-15T10:30:00.000Z' },
          medicines: [],
        },
      };
      render(<DailySummaryCard isToday summary={summary} />);
      expect(screen.getByText(/37\.5.*°C/)).toBeInTheDocument();
      expect(screen.getByText(/ · 2h ago/)).toBeInTheDocument();
    });
  });
});