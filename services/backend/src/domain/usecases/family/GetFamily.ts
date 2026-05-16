/**
 * Usecase: Get a family by ID, including join requests.
 * Delegates to the repository.
 *
 * Note: When used from Convex query endpoints, the repository cannot be
 * instantiated (ConvexFamilyRepository is mutation-only). In those cases,
 * use direct DB access instead — see convex/family.ts `get` query.
 */
import type { IFamilyRepository } from '../../repositories/IFamilyRepository';
import type { Family, FamilyJoinRequest } from '../../family/Family';

export async function getFamily(
  repo: IFamilyRepository,
  familyId?: string
): Promise<(Family & { joinRequests: FamilyJoinRequest[] }) | null> {
  if (!familyId) return null;
  return repo.getById(familyId);
}
