import { useQuery } from 'convex/react';
import { createContext, useContext } from 'react';
import { api } from '../services/api';

const appDataContext = createContext<{ activities: Activities }>({
  activities: undefined,
});
export default function AppDataProvider({ children }) {
  const activities = useServerActivities();
  return (
    <appDataContext.Provider value={{ activities }}>
      {children}
    </appDataContext.Provider>
  );
}
/**
 * Client centric state hook
 * @returns
 */
export function useActivities() {
  const ctx = useContext(appDataContext);
  return ctx.activities;
}
/**
 * Server centric state hook
 * @returns
 */
function useServerActivities() {
  return useQuery(api.activities.get);
}

type Activities = ReturnType<typeof useServerActivities>;
