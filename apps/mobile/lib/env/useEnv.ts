export function useEnv() {
  return {
    value: process.env.NODE_ENV,
    isDev: () => process.env.NODE_ENV === 'development',
  };
}
