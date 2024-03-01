// import { useContext, createContext, useEffect } from 'react';
// import { feedStore } from './stores/feed'; // Assuming the store is defined in DeviceStorageStore.js

// const DeviceStorageContext = createContext<DeviceStorageState | null>(null);
// interface DeviceStorageState {
//   feed: typeof feedStore;
// }
// export const DeviceStorageProvider = ({
//   children,
// }: {
//   children: React.ReactNode;
// }) => (
//   <DeviceStorageContext.Provider
//     value={{
//       feed: feedStore,
//     }}
//   >
//     {children}
//   </DeviceStorageContext.Provider>
// );

// export

// export const useDeviceStorage = () => {
//   const storage = useContext(DeviceStorageContext);
//   if (storage == null) {
//     throw new Error('failed to get device storage');
//   }
//   return storage;
// };
