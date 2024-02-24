export function useEnv() {
  const env = process.env.NODE_ENV || 'production';
  return {
    value: env,
    isDev: () => env === 'development',
  };
}
