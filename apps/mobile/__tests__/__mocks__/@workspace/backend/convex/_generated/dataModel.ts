export type Id<T extends string = string> = string & { __brand: T };
export type Doc<T extends string = string> = any;
