export enum FeedType {
  Expressed = 'expressed',
  Formula = 'formula',
  Water = 'water',
  Latch = 'latch',
  Solids = 'solids',
}
export type FeedTypeLiteral = `${FeedType}`;

export interface SolidsData {
  description: string;
}
