// app/privacy/page.tsx  (or pages/privacy.tsx depending on your router)

export const metadata = {
  title: "Privacy Policy — RandoMovie",
  description: "How RandoMovie collects, uses, and protects your data.",
};

const LAST_UPDATED = "March 15, 2026";
const CONTACT_EMAIL = "privacy@randomovie.app"; // ← update this

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-widest text-light-accent dark:text-dark-accent mb-3">
          Legal
        </p>
        <h1 className="text-3xl font-semibold mb-3">Privacy Policy</h1>
        <p className="text-sm text-light-muted dark:text-dark-muted">
          Last updated: {LAST_UPDATED}
        </p>
      </header>

      <div className="space-y-10 text-sm leading-7 text-light-text dark:text-dark-text">
        <Section title="1. Who we are">
          <p>
            RandoMovie ("we", "us", "our") is a media discovery app that helps
            you find movies and TV shows. We are not affiliated with any
            streaming service or studio. This policy explains what data we
            collect when you use RandoMovie, why we collect it, and what rights
            you have over it.
          </p>
          <p>
            If you have questions, email us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-light-accent dark:text-dark-accent underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="2. Data we collect">
          <Subsection title="Account data">
            <p>
              When you create an account we collect your email address. If you
              sign in via Google or Apple OAuth we receive your name, email
              address, and profile picture from that provider. We do not receive
              or store your Google or Apple passwords.
            </p>
          </Subsection>
          <Subsection title="Usage data">
            <p>
              We log the searches you run, the titles you click, and any items
              you add to your watchlist. This data is tied to your account and
              is used solely to personalise your recommendations within
              RandoMovie.
            </p>
          </Subsection>
          <Subsection title="Technical data">
            <p>
              Our hosting provider (Vercel) may collect standard server logs
              including your IP address, browser type, and page requests. These
              logs are retained for up to 30 days and are used for security and
              performance monitoring. We may also use Vercel Analytics, which
              collects anonymised, aggregated usage metrics and does not track
              individual users or set cross-site cookies.
            </p>
          </Subsection>
          <Subsection title="What we do not collect">
            <p>
              We do not collect payment information, precise location data,
              contacts, or any data from your device beyond what is described
              above. We do not run advertising and we do not sell your data to
              any third party, ever.
            </p>
          </Subsection>
        </Section>

        <Section title="3. How we use your data">
          <ul className="list-disc pl-5 space-y-2">
            <li>To create and maintain your account.</li>
            <li>
              To personalise your experience — surfacing recommendations based
              on your watch history and search activity.
            </li>
            <li>
              To operate and improve the service — understanding which features
              are used helps us prioritise what to build next.
            </li>
            <li>
              To communicate with you — occasional product updates or security
              notices sent to your email. You can opt out of non-essential
              emails at any time.
            </li>
            <li>
              To comply with legal obligations where required.
            </li>
          </ul>
        </Section>

        <Section title="4. Cookies and local storage">
          <p>
            RandoMovie uses the following browser storage mechanisms:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>
              <span className="font-medium">Firebase session cookie</span> — a
              first-party, HTTP-only cookie set by Firebase Authentication to
              keep you signed in. It contains no personally identifiable
              information beyond a session token and expires when you sign out
              or after 30 days of inactivity.
            </li>
            <li>
              <span className="font-medium">localStorage cache</span> — we
              cache the daily media selection locally so the page loads faster
              on repeat visits. This data never leaves your device and is
              cleared automatically each day.
            </li>
          </ul>
          <p className="mt-3">
            We do not use advertising cookies, third-party tracking pixels, or
            any cross-site tracking technology. Because we only use strictly
            necessary first-party storage, we do not display a cookie consent
            banner — but we do ask you to agree to this policy before creating
            an account.
          </p>
        </Section>

        <Section title="5. Third-party services">
          <p>
            RandoMovie uses the following third-party services. Each has its
            own privacy policy:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>
              <span className="font-medium">Firebase (Google)</span> —
              authentication and database. Data is stored on Google's
              infrastructure.{" "}
              <ExternalLink href="https://firebase.google.com/support/privacy">
                Firebase Privacy Policy
              </ExternalLink>
            </li>
            <li>
              <span className="font-medium">TMDB (The Movie Database)</span> —
              all movie and TV metadata, images, and ratings are fetched from
              TMDB's API. We do not share your personal data with TMDB.{" "}
              <ExternalLink href="https://www.themoviedb.org/privacy-policy">
                TMDB Privacy Policy
              </ExternalLink>
            </li>
            <li>
              <span className="font-medium">Vercel</span> — hosting and edge
              infrastructure.{" "}
              <ExternalLink href="https://vercel.com/legal/privacy-policy">
                Vercel Privacy Policy
              </ExternalLink>
            </li>
          </ul>
        </Section>

        <Section title="6. Data retention">
          <p>
            We keep your account data for as long as your account is active. If
            you delete your account, we delete your personal data within 30
            days. Anonymised usage aggregates (e.g. "X searches were run this
            week") may be retained indefinitely as they cannot be linked back to
            you.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>
            Depending on where you live you may have the right to access,
            correct, export, or delete your personal data. EU/EEA residents
            have these rights under GDPR. California residents have rights under
            CCPA. Regardless of where you are, we will honour reasonable
            requests to:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>See what data we hold about you.</li>
            <li>Correct inaccurate data.</li>
            <li>Delete your account and associated data.</li>
            <li>Export your watchlist and search history.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-light-accent dark:text-dark-accent underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="8. Children">
          <p>
            RandoMovie is not directed at children under 13. We do not
            knowingly collect data from anyone under 13. If you believe a child
            has created an account, please contact us and we will delete it
            promptly.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            We may update this policy as the product evolves. If we make
            material changes we will notify you by email and update the "last
            updated" date above. Continued use of RandoMovie after a change
            constitutes acceptance of the revised policy.
          </p>
        </Section>
      </div>
    </main>
  );
}

// ── Local helpers ─────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-4 text-light-text dark:text-dark-text">
        {title}
      </h2>
      <div className="space-y-3 text-light-muted dark:text-dark-muted">
        {children}
      </div>
    </section>
  );
}

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2 text-light-text dark:text-dark-text">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-light-accent dark:text-dark-accent underline underline-offset-2"
    >
      {children}
    </a>
  );
}