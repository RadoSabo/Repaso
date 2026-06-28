/**
 * Public Privacy Policy page (HTML), served at `/privacy` on EAS Hosting. Linked
 * from the paywall and the store listings. Content lives in `src/lib/legal.ts`.
 */
import { renderPrivacyPage } from '@/lib/legal';

export function GET(): Response {
  return new Response(renderPrivacyPage(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
