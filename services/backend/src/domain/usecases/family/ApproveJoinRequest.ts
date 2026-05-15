/**
 * Usecase: Approve a pending join request for a family.
 * Delegates to the repository.
 */
import type { IFamilyRepository } from '../../repositories/IFamilyRepository';

export async function approveJoinRequest(
  repo: IFamilyRepository,
  familyId: string,
  deviceId: string,
  authorizingDeviceId: string
): Promise<void> {
  return repo.approveJoinRequest(familyId, deviceId, authorizingDeviceId);
}
