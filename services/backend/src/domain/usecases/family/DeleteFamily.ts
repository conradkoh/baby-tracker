/**
 * Usecase: Delete a family. Only a device belonging to the family can delete it.
 * Delegates to the repository.
 */
import type { IFamilyRepository } from '../../repositories/IFamilyRepository';

export async function deleteFamily(
  repo: IFamilyRepository,
  authorizingDeviceId: string,
  familyId: string
): Promise<void> {
  return repo.delete(authorizingDeviceId, familyId);
}
