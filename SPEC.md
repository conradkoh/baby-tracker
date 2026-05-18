# Family Invite Feature — SPEC

## Overview

A shareable invite link allows family members to invite others to join their family without manually sharing Family IDs. The invite link encodes a signed token. Recipients see an invite confirmation page. Unauthenticated users are redirected to login first, then returned to the invite.

---

## Data Model

### New Convex Table: `familyInvites`

```typescript
familyInvites: defineTable({
  familyId: v.id('family'),           // which family this invite is for
  createdBy: v.id('users'),           // who created it
  token: v.string(),                  // random 32-char token (base64url)
  expiresAt: v.number(),               // unix ms timestamp, nullable (no expiry = permanent)
  usedBy: v.optional(v.id('users')),  // set when used, prevents reuse
  createdAt: v.number(),
})
  .index('by_token', ['token'])
  .index('by_familyId', ['familyId'])
```

**Token generation**: `crypto.randomBytes(24).toString('base64url')` — 32 chars, URL-safe, unguessable.

**Expiry default**: 7 days from creation. `null` = never expires (family admin can choose).

---

## API Design (Backend)

### New Queries

**`web.babyTracker.family.getInvite(token: string) → InviteDetails | null`**
- Public (no auth required)
- Looks up invite by token
- Returns: `{ valid: true, familyId, expiresAt, createdByName }` or `{ valid: false, reason: 'expired' | 'used' | 'not_found' }`
- Does NOT reveal family name to unauthenticated users (privacy)

### New Mutations

**`web.babyTracker.family.createInvite() → { token: string }`**
- Auth required (must be in a family)
- Creates a familyInvites record
- Returns the token
- Family admin only (first family member)? Or any member? → **Any family member can create invites**

**`web.babyTracker.family.acceptInvite(token: string) → { success: true }`**
- Auth required
- Validates token (exists, not expired, not used)
- Checks user is not already in a family
- Adds user to `userFamily` table
- Marks invite as `usedBy`

**Error codes**: `INVITE_EXPIRED`, `INVITE_ALREADY_USED`, `INVITE_NOT_FOUND`, `ALREADY_IN_FAMILY`, `CANNOT_INVITE_SELF`

---

## Frontend

### 1. Settings Page — "Copy Invite Link" Button

In `FamilyInFamily.tsx`, add below the Family ID copy section:

```tsx
{/* Invite Link */}
<div className="border-t pt-4">
  <Label className="text-sm text-muted-foreground mb-2 block">
    Invite someone to your family
  </Label>
  <Button
    variant="outline"
    size="sm"
    onClick={onCreateInvite}
    disabled={submitting || creatingInvite}
  >
    {creatingInvite ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
    Copy Invite Link
  </Button>
</div>
```

When clicked: call `createInvite()` mutation → copy `https://[domain]/invite/[token]` to clipboard → show brief "Copied!" confirmation.

### 2. `/invite/[token]` Page

Path: `apps/webapp/src/app/invite/[token]/page.tsx`

**If user is NOT authenticated:**
- Show invite card: "You've been invited to join a family"
- Show "Login to Join" button → navigates to `/login?returnTo=/invite/[token]`
- After login, redirected back to this page

**If user IS authenticated:**

Query `web.babyTracker.family.getInvite(token)`:

- `valid: false, reason: 'expired'` → "This invite has expired"
- `valid: false, reason: 'used'` → "This invite has already been used"
- `valid: false, reason: 'not_found'` → "Invalid invite link"
- `valid: true` but already in a family (different from this one) → "You're already in another family. Leave your current family first."
- `valid: true` and already in this family → "You're already a member of this family"
- `valid: true` and not in any family → Show "Confirm Join" button
  - On click: call `acceptInvite(token)`
  - On success: redirect to `/app`

### 3. Login Redirect Preservation

In `apps/webapp/src/app/login/page.tsx`, check for `?returnTo=` query param.
After successful login, redirect to the `returnTo` URL instead of `/app`.

**How to detect success**: The auth flow completes when `authState.state === 'authenticated'`. Use `useRouter().replace()` to redirect.

For the anonymous login flow (code-based), the URL param must be preserved through the multi-step flow:
- Store `returnTo` in `sessionStorage` before starting the flow
- On auth success, read from `sessionStorage` and redirect

---

## Invite Link URL Format

```
https://[domain]/invite/[32-char-token]
```

Example: `https://baby-tracker.vercel.app/invite/X9k2mP3nL5qR8sT1vW4yZ7aB0cD3eF6gH`

---

## Invite Link Button in FamilyInFamily

Props to add to `FamilyInFamilyProps`:
- `creatingInvite: boolean`
- `onCreateInvite: () => void`
- `inviteCopied: boolean`
- `onInviteCopied: () => void` (just clears the copied state after 3s)

View model updates:
- `useState<boolean>` for `creatingInvite`
- `useState<boolean>` for `inviteCopied` (separate from `copied` which is for Family ID)
- New handler `handleCreateInvite`

---

## Testing Scenarios

1. Logged-in family member generates invite → copies link
2. Unauthenticated user clicks link → sees login prompt → logs in → sees invite page → joins
3. Expired invite → sees "expired" message
4. Already-used invite → sees "already used" message
5. User already in another family → sees "already in family" message (can't join a second family)
6. Same-family member clicks their own invite → sees "already a member"
