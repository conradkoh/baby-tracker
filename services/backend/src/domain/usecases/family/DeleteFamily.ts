/**
 * Fully deletes a family and ALL of its data atomically:
 *   - userFamily memberships (all members)
 *   - familyJoinRequests (all pending requests)
 *   - familyInvites (all invite tokens, used or pending)
 *   - activityStream (the family's stream)
 *   - activities (every activity on that stream)
 *   - family document itself
 *
 * Authorization: the caller (authorizingUserId) must be a current member
 * of the family. Throws ConvexError {code: 'FORBIDDEN'} otherwise.
 *
 * Use this from any flow that needs to remove a family: explicit delete,
 * switch-family (when sole member), leave-as-sole-member.
 */
import type { IFamilyRepository } from '../../repositories/IFamilyRepository';

export async function deleteFamily(
  repo: IFamilyRepository,
  authorizingUserId: string,
  familyId: string
): Promise<void> {
  return repo.delete(authorizingUserId, familyId);
}