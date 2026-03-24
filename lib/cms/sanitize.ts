// eslint-disable-next-line @typescript-eslint/no-require-imports
const DOMPurify = require('isomorphic-dompurify') as { sanitize: (html: string) => string };

/**
 * Sanitizes CMS-provided HTML before rendering via dangerouslySetInnerHTML.
 * Defense-in-depth: strips XSS vectors even from the trusted admin-only CMS.
 */
export function sanitizeCmsHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
