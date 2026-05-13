/**
 * Strip dangerous markup from user-typed text. Used in live chat/profile bios
 * before rendering or sending to the server.
 */
export function sanitizeText(input: string, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLen)
    .replace(/<\/?[^>]+(>|$)/g, '')          // strip HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}
