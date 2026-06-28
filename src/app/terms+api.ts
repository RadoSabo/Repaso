/**
 * Public Terms of Use page (HTML), served at `/terms` on EAS Hosting. Linked
 * from the paywall and the store listings. Content lives in `src/lib/legal.ts`.
 */
import { renderTermsPage } from '@/lib/legal';

export function GET(): Response {
  return new Response(renderTermsPage(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
