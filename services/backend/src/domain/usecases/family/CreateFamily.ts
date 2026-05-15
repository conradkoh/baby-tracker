/**
 * Usecase: Create a new family for a device.
 * Delegates to the repository.
 */
import type { IFamilyRepository } from '../../repositories/IFamilyRepository';

export async function createFamily(repo: IFamilyRepository, deviceId: string): Promise<string> {
  return repo.create(deviceId);
}
