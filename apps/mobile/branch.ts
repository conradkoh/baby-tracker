import { useMemo } from 'react';

export enum Branch {
  Dev = 'dev',
  Prod = 'prod',
}
export function useActiveBranch() {
  const env = process.env.NODE_ENV;
  return useMemo(() => {
    return { branch: getBranch(env) };
  }, [env]);
}
export function getBranch(emv: string | undefined): Branch {
  if (emv === 'development') {
    return Branch.Dev;
  }
  return Branch.Prod;
}
