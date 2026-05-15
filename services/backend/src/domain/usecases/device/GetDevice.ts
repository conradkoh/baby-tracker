/**
 * Usecase: Get a device by its deviceId.
 * Delegates to the repository.
 */
import type { IDeviceRepository } from '../../repositories/IDeviceRepository';
import type { Device } from '../../device/Device';

export async function getDevice(
  repo: IDeviceRepository,
  deviceId: string
): Promise<Device | null> {
  return repo.getByDeviceId(deviceId);
}
