/**
 * Usecase: Request to join a family.
 * Delegates to the repository.
 */
import type { IFamilyRepository } from '../../repositories/IFamilyRepository';

export async function requestJoin(
  repo: IFamilyRepository,
  familyId: string,
  deviceId: string
): Promise<{ isError: boolean; message: string }> {
  return repo.requestJoin(familyId, deviceId);
}
