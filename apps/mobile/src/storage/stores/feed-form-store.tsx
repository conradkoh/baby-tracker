import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FeedType } from '@workspace/domain/entities/Feed';
const DEFAULT_VOL = 50;
interface FeedFormStoreState {
  volume: number;
  feedType: FeedType;
  setVolume: (v: number) => void;
  setFeedType: (v: FeedType) => void;
}
export const useFeedFormStore = create<FeedFormStoreState>()(
  persist(
    (set, get) => ({
      feedType: FeedType.Expressed as FeedType,
      volume: DEFAULT_VOL,
      setVolume: (volume: number) => set(() => ({ volume })),
      setFeedType: (feedType: FeedType) => set(() => ({ feedType })),
    }),
    { name: 'feed-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
