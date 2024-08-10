export enum DiaperChangeType {
  Wet = 'wet',
  Dirty = 'dirty',
  Mixed = 'mixed',
}
export type DiaperChangeTypeLiteral = `${DiaperChangeType}`;

export function diaperChangeFromLiteral(
  v: DiaperChangeTypeLiteral
): DiaperChangeType {
  return v as DiaperChangeType;
}
