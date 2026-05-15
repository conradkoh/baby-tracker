/**
 * Usecase: Leave a family. Transfers activities if last member.
 * Delegates to the repository.
 */
import type { IFamilyRepository } from '../../repositories/IFamilyRepository';

export async function leaveFamily(
  repo: IFamilyRepository,
  deviceId: string,
  familyId: string
): Promise<void> {
  return repo.leave(deviceId, familyId);
}
