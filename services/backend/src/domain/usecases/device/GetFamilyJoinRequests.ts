/**
 * Usecase: Get family join requests for a device.
 * Delegates to the repository.
 */
import type { IDeviceRepository } from '../../repositories/IDeviceRepository';
import type { FamilyJoinRequest } from '../../family/Family';

export async function getFamilyJoinRequests(
  repo: IDeviceRepository,
  deviceId?: string
): Promise<FamilyJoinRequest[]> {
  return repo.getFamilyJoinRequests(deviceId);
}
