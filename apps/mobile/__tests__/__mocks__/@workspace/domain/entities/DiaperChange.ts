export const diaperChangeFromLiteral = jest.fn(() => ({
  type: 'wet',
}));

export enum DiaperChangeType {
  Wet = 'wet',
  Dirty = 'dirty',
  Mixed = 'mixed',
}
