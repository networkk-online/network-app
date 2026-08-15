/**
 * Follower count display helper.
 *
 * The real follower count (`followers_count`) is never modified — admins can
 * only set an optional displayed value (`follower_count_override`).
 * Ranking, rewards and analytics must keep using the real count.
 */
export function displayedFollowers(
  profile: { followers_count?: number | null; follower_count_override?: number | string | null } | null | undefined
): number {
  if (!profile) return 0;
  const ov = profile.follower_count_override;
  if (ov !== null && ov !== undefined && ov !== '') {
    const n = Number(ov);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  return Number(profile.followers_count || 0);
}
