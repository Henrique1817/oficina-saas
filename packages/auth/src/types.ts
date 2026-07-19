import type { Membership, Organization, Profile, UserRole } from "@oficina/database";

export type AuthContext = {
  userId: string;
  email: string;
  profile: Profile;
  /** Papel na organização atual (Membership.role) */
  role: UserRole;
  organizationId: string;
  organizationSlug: string;
  organization: Organization;
  membership: Membership;
};
