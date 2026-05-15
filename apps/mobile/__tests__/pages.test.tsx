const React = require('react');
const renderer = require('react-test-renderer');
const { act } = renderer;

// ─── Remaining app-level mocks (not covered by jest.setup.js) ───

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() })),
  useLocalSearchParams: jest.fn(() => ({})),
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  Link: ({ children }: any) => children,
}));

jest.mock('expo-device', () => ({ deviceName: 'Test', osName: 'iOS', osVersion: '17.0' }));
jest.mock('expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-uuid' }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-updates', () => ({}));
jest.mock('expo-linking', () => ({}));

jest.mock('convex/react', () => ({
  useQuery: () => undefined,
  useMutation: () => jest.fn(),
  usePaginatedQuery: () => ({ results: [], loadMore: jest.fn(), status: 'Exhausted' }),
  ConvexProvider: ({ children }: any) => children,
}));

jest.mock('convex/values', () => ({ ConvexError: class extends Error {} }));

jest.mock('../src/hooks/useDeviceId', () => ({ useDeviceId: () => 'mock-device-id' }));

jest.mock('../src/providers/AppDataProvider', () => ({
  useDeviceInfo: () => ({
    device: { deviceId: 'mock-id', familyId: null, name: 'Test' },
    deviceStatus: 'connected', loadDevice: jest.fn(), joinFamily: jest.fn(),
  }),
  AppDataProvider: ({ children }: any) => children,
}));

jest.mock('../src/providers/ConvexClientProvider', () => ({
  ConvexClientProvider: ({ children }: any) => children,
  withReloadOnReconnect: (C: any) => C,
}));

jest.mock('../src/storage/stores/branch', () => ({
  useBranch: () => ({ branch: 'dev', setBranch: jest.fn() }),
}));

jest.mock('../src/storage/stores/device', () => ({
  useDeviceInfoStore: () => ({ deviceId: 'mock-device-id', clearDevice: jest.fn() }),
}));

jest.mock('../src/lib/env/useEnv', () => ({ useEnv: () => 'dev' }));
jest.mock('../src/lib/convex/use_query_swr', () => ({ useQuery: () => undefined }));

jest.mock('../src/services/api', () => ({
  api: {
    activities: { create: jest.fn(), update: jest.fn(), deleteActivity: jest.fn(), getById: jest.fn(), getByTimestampDescPaginated: jest.fn() },
    device: { get: jest.fn(), create: jest.fn() },
    family: { create: jest.fn(), join: jest.fn() },
  },
  useActivitiesPaginated: () => ({ results: [], loadMore: jest.fn(), status: 'Exhausted' }),
}));

jest.mock('../src/lib/time/useCurrentDateTime', () => ({
  useCurrentDateTime: () => require('luxon').DateTime.now(),
}));

jest.mock('../src/lib/time/requestAllowFutureDate', () => ({
  requestAllowFutureDate: () => Promise.resolve(true),
}));

jest.mock('../branch', () => ({ Branch: { Dev: 'dev', Preview: 'preview', Production: 'production' } }));

// ─── Import pages ──────────────────────────────────────────────
const AppIndexPage = require('../app/index').default;
const SettingsPage = require('../app/settings/index').default;
const CreateFeedPage = require('../app/feed/create').default;
const EditFeedPage = require('../app/feed/edit/[activityId]').default;
const CreateMedicalPage = require('../app/medical/create').default;
const EditMedicalPage = require('../app/medical/edit/[activityId]').default;
const DiaperChangeCreatePage = require('../app/diaper-change/create').default;
const EditDiaperChangePage = require('../app/diaper-change/edit/[activityId]').default;

const mockLSP = require('expo-router').useLocalSearchParams as jest.Mock;

describe('Page Mount Tests', () => {
  beforeEach(() => {
    // NOTE: do NOT call jest.resetModules() — it creates a second React
    // instance that disagrees with react-test-renderer, causing useReducer errors.
    jest.clearAllMocks();
    mockLSP.mockReturnValue({});
  });

  const mount = (Element: React.ComponentType) => {
    let tree: any;
    // Wrap in act() to flush all synchronous effects during the test,
    // then unmount cleanly so async effects don't fire after jest teardown.
    act(() => {
      tree = renderer.create(<Element />);
    });
    expect(tree.toJSON()).toBeTruthy();
    act(() => {
      tree.unmount();
    });
  };

  it('index page mounts', () => mount(AppIndexPage));
  it('settings page mounts', () => mount(SettingsPage));
  it('feed/create page mounts', () => mount(CreateFeedPage));
  it('feed/edit page mounts', () => {
    mockLSP.mockReturnValue({ activityId: 'test-id' });
    mount(EditFeedPage);
  });
  it('medical/create page mounts', () => mount(CreateMedicalPage));
  it('medical/edit page mounts', () => {
    mockLSP.mockReturnValue({ activityId: 'test-id' });
    mount(EditMedicalPage);
  });
  it('diaper-change/create page mounts', () => mount(DiaperChangeCreatePage));
  it('diaper-change/edit page mounts', () => {
    mockLSP.mockReturnValue({ activityId: 'test-id' });
    mount(EditDiaperChangePage);
  });
});
