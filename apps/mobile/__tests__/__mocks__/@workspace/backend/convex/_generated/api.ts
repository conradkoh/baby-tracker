export const api = {
  activities: {
    create: jest.fn(),
    update: jest.fn(),
    deleteActivity: jest.fn(),
    getById: jest.fn(),
    get: jest.fn(),
    getByTimestampDescPaginated: jest.fn(),
    expGetByTimestampDescPaginated: jest.fn(),
  },
  device: {
    get: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  family: {
    create: jest.fn(),
    join: jest.fn(),
    get: jest.fn(),
    removeDevice: jest.fn(),
  },
  activityStream: {
    getForDevice: jest.fn(),
  },
};
