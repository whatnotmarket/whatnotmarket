export type AdminProfileShape = {
  is_admin?: boolean | null;
};

export function hasCanonicalAdminAccess(profile: AdminProfileShape | null | undefined) {
  return profile?.is_admin === true;
}
