import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
const DEFAULT_VOL = 50;
interface FeedFormStoreState {
  volume: number;
  feedType: string;
  setVolume: (v: number) => void;
  setFeedType: (v: string) => void;
}
export const useFeedFormStore = create<FeedFormStoreState>()(
  persist(
    (set, get) => ({
      feedType: 'expressed',
      volume: DEFAULT_VOL,
      setVolume: (volume: number) => set(() => ({ volume })),
      setFeedType: (feedType: string) => set(() => ({ feedType })),
    }),
    { name: 'feed-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
