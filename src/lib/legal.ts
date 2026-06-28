/**
 * Content + renderer for the public Terms of Use and Privacy Policy pages,
 * served as HTML by `app/terms+api.ts` and `app/privacy+api.ts` on the EAS
 * Hosting deployment. Both stores hard-require these for a paid app, and the
 * paywall links to them.
 *
 * These are a practical starting point, not legal advice — have them reviewed.
 * The fields below are the only spots that need customizing for your business.
 */

// --- Customize these ------------------------------------------------------
/** Your legal name or registered company. */
const DEVELOPER_NAME = 'Repaso';
/** A support/contact email you monitor. */
const SUPPORT_EMAIL = 'support@repaso.app';
/** Jurisdiction whose laws govern the Terms. */
const GOVERNING_LAW = 'Slovakia';
/** Shown as the "Last updated" date. */
const LAST_UPDATED = 'June 28, 2026';
// --------------------------------------------------------------------------

const APP_NAME = 'Repaso';

/** Wraps page content in a minimal, readable, self-contained HTML document. */
function renderPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — ${APP_NAME}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 32px 20px 64px;
    color: #11181C; background: #fff;
  }
  @media (prefers-color-scheme: dark) { body { color: #ECEDEE; background: #000; } }
  h1 { font-size: 28px; margin-bottom: 4px; }
  h2 { font-size: 20px; margin-top: 32px; }
  .updated { color: #60646C; font-size: 14px; margin-top: 0; }
  a { color: #208AEF; }
  ul { padding-left: 20px; }
</style>
</head>
<body>
${bodyHtml}
<p class="updated">Last updated: ${LAST_UPDATED}</p>
</body>
</html>`;
}

const TERMS_BODY = `
<h1>Terms of Use</h1>
<p class="updated">${APP_NAME}, operated by ${DEVELOPER_NAME} ("we", "us").</p>

<p>By downloading or using ${APP_NAME} (the "App") you agree to these Terms of
Use. If you do not agree, do not use the App.</p>

<h2>1. The service</h2>
<p>${APP_NAME} helps you create and study language-learning flashcards, including
an AI feature that generates cards from text, voice, or images you provide. To
generate cards, the content you submit is sent to our servers and to our AI
provider for processing. The App stores your decks locally on your device.</p>

<h2>2. Eligibility</h2>
<p>You must be at least 13 years old (or the minimum age of digital consent in
your country) to use the App.</p>

<h2>3. Free tier and Repaso Pro</h2>
<ul>
  <li><strong>Free tier:</strong> up to 5 AI card generations per rolling 30-day
  period. Voice and image input are not included in the free tier.</li>
  <li><strong>Repaso Pro</strong> is an auto-renewing subscription that unlocks
  unlimited generations plus voice and image input. It is offered monthly (€2)
  and annually (€20); prices may vary by region and are shown in the App before
  purchase.</li>
  <li><strong>Billing &amp; renewal:</strong> payment is charged to your Apple
  App Store or Google Play account at confirmation of purchase. The subscription
  renews automatically unless cancelled at least 24 hours before the end of the
  current period; your account is charged for renewal within 24 hours before the
  period ends.</li>
  <li><strong>Managing &amp; cancelling:</strong> manage or cancel your
  subscription in your App Store or Google Play account settings. Deleting the
  App does not cancel a subscription.</li>
  <li><strong>Refunds</strong> are handled by Apple or Google under their
  policies, except where a refund is required by applicable law.</li>
</ul>

<h2>4. Your content</h2>
<p>You retain ownership of the text, audio, images, and decks you create or
submit ("Your Content"). You grant us a limited licence to process Your Content
solely to provide the App's features (such as generating cards). You are
responsible for Your Content and must have the rights to submit it.</p>

<h2>5. AI-generated content</h2>
<p>Cards are produced by an automated model and may be inaccurate, incomplete, or
unsuitable. Always verify translations and facts before relying on them. The App
is a study aid, not a substitute for professional language instruction.</p>

<h2>6. Acceptable use</h2>
<p>You agree not to misuse the App, including: submitting unlawful content;
attempting to bypass usage limits or security; reverse-engineering the service;
or using it to generate harmful, infringing, or abusive material.</p>

<h2>7. Local storage and data loss</h2>
<p>Your decks are stored only on your device. We do not back them up or sync them
across devices. Reinstalling the App or switching devices will lose your decks
unless you have exported them using the App's export feature. You are responsible
for keeping your own backups.</p>

<h2>8. Disclaimer of warranties</h2>
<p>The App is provided "as is" and "as available" without warranties of any kind,
to the maximum extent permitted by law. We do not warrant that the App will be
uninterrupted, error-free, or that generated content will be accurate.</p>

<h2>9. Limitation of liability</h2>
<p>To the maximum extent permitted by law, we will not be liable for any
indirect, incidental, or consequential damages, or for loss of data, arising
from your use of the App. Nothing in these Terms limits liability that cannot be
limited under applicable law.</p>

<h2>10. Changes</h2>
<p>We may update these Terms from time to time. Continued use of the App after
changes take effect constitutes acceptance of the updated Terms.</p>

<h2>11. Termination</h2>
<p>We may suspend or terminate access to the App if you breach these Terms.</p>

<h2>12. Governing law</h2>
<p>These Terms are governed by the laws of ${GOVERNING_LAW}, without regard to
its conflict-of-laws rules.</p>

<h2>13. Contact</h2>
<p>Questions about these Terms: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
`;

const PRIVACY_BODY = `
<h1>Privacy Policy</h1>
<p class="updated">${APP_NAME}, operated by ${DEVELOPER_NAME} ("we", "us").</p>

<p>This policy explains what data ${APP_NAME} processes and why. ${APP_NAME} has
no user accounts — we do not ask for your name, email, or password.</p>

<h2>Data we process</h2>
<ul>
  <li><strong>Content you submit for generation:</strong> the text, voice
  recordings, or images you provide to create cards. This is sent to our servers
  and our AI provider to produce cards and returned to your device. It is
  processed transiently to fulfil your request and is not used to build a profile
  of you.</li>
  <li><strong>Your decks and cards:</strong> stored locally on your device only.
  We do not receive or store them on our servers.</li>
  <li><strong>A device identifier:</strong> a random identifier stored on your
  device (and the platform device ID) used solely to enforce the free-generation
  limit and prevent abuse. It is not linked to your identity and is not used for
  advertising or cross-app tracking.</li>
  <li><strong>Subscription status:</strong> whether you have an active Repaso Pro
  subscription, managed through the app stores and our subscription provider.</li>
</ul>

<h2>How we use data</h2>
<p>We use the above only to: provide card generation; enforce free-tier limits
and detect abuse; and provide and validate the Repaso Pro subscription. We do not
sell your data or use it for advertising.</p>

<h2>Service providers</h2>
<p>We share the minimum necessary data with providers that operate the service on
our behalf:</p>
<ul>
  <li><strong>OpenAI</strong> — processes the content you submit to generate
  cards.</li>
  <li><strong>RevenueCat</strong> — manages and validates subscriptions.</li>
  <li><strong>Upstash</strong> — stores the per-device free-generation counter.</li>
  <li><strong>Apple App Store / Google Play</strong> — process subscription
  payments.</li>
  <li><strong>Expo Application Services (EAS Hosting)</strong> — hosts our
  backend.</li>
</ul>

<h2>Retention</h2>
<p>Content submitted for generation is processed transiently and not retained on
our servers after your request is fulfilled. The free-generation counter expires
automatically after 30 days. Decks remain on your device until you delete them or
remove the App.</p>

<h2>Children</h2>
<p>The App is not directed to children under 13 (or the minimum age of digital
consent in your country) and we do not knowingly collect their data.</p>

<h2>Your rights</h2>
<p>Because we hold no account and store your decks only on your device, most of
your data is under your direct control on the device. For questions or requests
regarding data we process, contact us and we will respond as required by
applicable law (including the GDPR where it applies).</p>

<h2>Changes</h2>
<p>We may update this policy from time to time; the "Last updated" date below
reflects the latest version.</p>

<h2>Contact</h2>
<p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
`;

/** Full HTML for the Terms of Use page. */
export function renderTermsPage(): string {
  return renderPage('Terms of Use', TERMS_BODY);
}

/** Full HTML for the Privacy Policy page. */
export function renderPrivacyPage(): string {
  return renderPage('Privacy Policy', PRIVACY_BODY);
}
