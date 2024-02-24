import { useQuery as _useQuery } from 'convex/react';
import { useEffect } from 'react';
import { create } from 'zustand';
import { usePaginatedQuery as _usePaginatedQuery } from './use_paginated_query_fixed';
export const useQuery = applySwrUseQuery(_useQuery);
export const usePaginatedQuery = applySwrUsePaginatedQuery(_usePaginatedQuery);
type Query = Parameters<typeof _useQuery>[0];
/**
 * This hook applies a local cache for stale while revalidate behavior
 * @param queryHook
 */
function applySwrUseQuery(queryHook: typeof _useQuery): typeof _useQuery {
  const useSwrQuery: typeof _useQuery = (query: Query, ...args: any) => {
    const liveData = queryHook(query, ...args);
    const { set, get } = useQueryCache();
    const key = createCacheKey(query, args);
    useEffect(() => {
      set(key, liveData);
    }, [key, liveData, set]);
    return get(key);
  };
  return useSwrQuery;
}
/**
 * This hook applies a local cache for stale while revalidate behavior
 * @param queryHook
 */
function applySwrUsePaginatedQuery(
  queryHook: typeof _usePaginatedQuery
): typeof _usePaginatedQuery {
  const useSwrQuery: typeof _usePaginatedQuery = (...params) => {
    const { results: liveData, ...returnVals } = queryHook(...params);
    const { set, get } = useQueryCache();
    const key = createCacheKey(...params);
    useEffect(() => {
      if (!returnVals.isLoading) {
        set(key, liveData);
      }
    }, [key, liveData, returnVals.isLoading, set]);
    return {
      results: get(key) || [],
      ...returnVals,
    };
  };
  return useSwrQuery;
}

// ===========================
// INTERNAL FUNCTIONS
// ===========================

function createCacheKey(...p: any): number {
  const hash = hashCode(JSON.stringify(sortObjectByKey(p)));
  return hash;
}

interface QueryCacheState {
  cachedData: Record<HashCode, any>;
  set: (key: HashCode, val: any) => any;
  get: (key: HashCode) => any;
  del: (key: HashCode) => void;
}
const useQueryCache = create<QueryCacheState>((set, get) => ({
  cachedData: {},
  get: (key) => {
    return get().cachedData[key];
  },
  set: (key, val) =>
    set((prev) => ({
      ...prev,
      cachedData: { ...prev.cachedData, [key]: val },
    })),
  del: (key) =>
    set((prev) => {
      const newCachedData = { ...prev.cachedData };
      delete newCachedData[key];
      return { ...prev, cachedData: newCachedData };
    }),
}));

type HashCode = number;
function sortObjectByKey(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectByKey);
  }

  const sortedKeys = Object.keys(obj).sort();
  const result: { [key: string]: any } = {};
  sortedKeys.forEach((key) => {
    result[key] = sortObjectByKey(obj[key]);
  });

  return result;
}
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
