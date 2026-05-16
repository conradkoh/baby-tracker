/**
 * Usecase: Sync (create or update) a device record.
 * Delegates to the repository — no business logic needed here
 * as all logic resides in ConvexDeviceRepository.sync().
 */
import type { IDeviceRepository } from '../../repositories/IDeviceRepository';

export async function syncDevice(
  repo: IDeviceRepository,
  params: {
    deviceId: string;
    deviceName?: string;
    osName?: string;
    osVersion?: string;
    brand?: string;
  }
): Promise<void> {
  return repo.sync(params);
}
