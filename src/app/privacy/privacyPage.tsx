"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faDatabase,
  faGear,
  faCookie,
  faHandshake,
  faCalendar,
  faShield,
  faChild,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";

const LAST_UPDATED = "March, 2026";
const CONTACT_EMAIL = "privacy@WatchedThis.app";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg px-4 py-16">
      <div className="max-w-2xl mx-auto bg-light-card dark:bg-dark-card rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="mb-6 font-mono">
          <p className="text-xs font-semibold tracking-widest uppercase text-light-accent dark:text-dark-accent">
            Legal
          </p>
<div className="text-4xl sm:text-5xl font-bold text-light-header dark:text-white mb-4 leading-tight">
            Privacy Policy
          </div>
          <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
            Last updated {LAST_UPDATED}; written by an actual human, not a
            lawyer bot.
          </p>
        </div>

        {/* Intro prose */}
        <p className="text-light-body-text dark:text-dark-body-text leading-relaxed mb-12 text-base">
          This explains what data WatchedThis collects, why it collects it, and
          what rights you have over it. Short version: we collect the minimum
          needed to make the app work and nothing else.
        </p>

        <div className="space-y-5">
          <Section icon={faUser} title="1. Who we are">
            <p>
              WatchedThis is a media discovery app that helps you find movies and
              TV shows. We are not affiliated with any streaming service or
              studio. If you have questions, email us at{" "}
              <ExternalLink href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </ExternalLink>
              .
            </p>
          </Section>

          <Section icon={faDatabase} title="2. Data we collect">
            <Subsection title="Account data">
              When you create an account we collect your email address. If you
              sign in via Google or Apple OAuth we receive your name, email
              address, and profile picture from that provider. We do not receive
              or store your passwords.
            </Subsection>
            <Subsection title="Usage data">
              We log the searches you run, the titles you click, and any items
              you add to your watchlist. This is tied to your account and is
              used solely to personalise your recommendations within WatchedThis.
            </Subsection>
            <Subsection title="Technical data">
              Our hosting provider (Firebase) may collect standard server logs
              including your IP address, browser type, and page requests,
              retained for up to 30 days for security and performance
              monitoring. Firebase Analytics may collect anonymised, aggregated
              usage metrics — no individual tracking, no cross-site cookies.
            </Subsection>
            <Subsection title="What we do not collect">
              No payment information, precise location data, contacts, or device
              data beyond what's described above. We do not run advertising and
              we do not sell your data to any third party, ever.
            </Subsection>
          </Section>

          <Section icon={faGear} title="3. How we use your data">
            We use your data to create and maintain your account, personalise
            recommendations based on your watch history and searches, operate
            and improve the service, and send occasional product updates or
            security notices by email (opt-out anytime). We also use it to
            comply with legal obligations where required.
          </Section>

          <Section icon={faCookie} title="4. Cookies and local storage">
            <p>
              WatchedThis uses a Firebase session cookie, a first-party,
              HTTP-only cookie to keep you signed in, containing no PII beyond a
              session token, expiring on sign-out or after 30 days of
              inactivity. We also cache the daily media selection in
              localStorage so the page loads faster; this data never leaves your
              device and clears automatically each day.
            </p>
            <p className="mt-3">
              No advertising cookies, third-party tracking pixels, or cross-site
              tracking. Because we only use strictly necessary first-party
              storage, there is no cookie consent banner.
            </p>
          </Section>

          <Section icon={faHandshake} title="5. Third-party services">
            <Subsection title="Firebase (Google)">
              Authentication and database. Data is stored on Google's
              infrastructure.{" "}
              <ExternalLink href="https://firebase.google.com/support/privacy">
                Firebase Privacy Policy
              </ExternalLink>
            </Subsection>
            <Subsection title="TMDB">
              All movie and TV metadata, images, and ratings come from TMDB's
              API. We do not share your personal data with TMDB.{" "}
              <ExternalLink href="https://www.themoviedb.org/privacy-policy">
                TMDB Privacy Policy
              </ExternalLink>
            </Subsection>
            <Subsection title="Hosting">
              Hosting and edge infrastructure.{" "}
              <ExternalLink href="https://developers.google.com/terms/">
                Firebase Privacy Policy
              </ExternalLink>
            </Subsection>
          </Section>

          <Section icon={faCalendar} title="6. Data retention">
            We keep your account data for as long as your account is active. If
            you delete your account, your personal data is deleted within 30
            days. Anonymised usage aggregates may be retained indefinitely as
            they cannot be linked back to you.
          </Section>

          <Section icon={faShield} title="7. Your rights">
            Depending on where you live you may have the right to access,
            correct, export, or delete your personal data (GDPR for EU/EEA, CCPA
            for California). Regardless of where you are, we will honour
            reasonable requests to see, correct, delete, or export your data.
            Email{" "}
            <ExternalLink href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </ExternalLink>{" "}
            and we will respond within 30 days. You can also use our{" "}
            <ScrollLink onClick={() => scrollToSection("feedback-form")}>
              feedback form
            </ScrollLink>{" "}
            for any privacy-related requests.
          </Section>

          <Section icon={faChild} title="8. Age Restrictions">
            WatchedThis is not directed at children under 13. We do not knowingly
            collect data from anyone under 13. If you believe a child has
            created an account, contact us and we will delete it promptly.
          </Section>

          <Section icon={faRotate} title="9. Changes to this policy">
            We may update this policy as the product evolves. If we make
            material changes we will notify you by email and update the date
            above. Continued use of WatchedThis after a change constitutes
            acceptance of the revised policy. If you'd like to{" "}
            <ScrollLink onClick={() => scrollToSection("membership")}>
              support the project
            </ScrollLink>
            , we'd really appreciate it.
          </Section>
        </div>

        {/* Footer note */}
        <p className="text-center text-light-secondary-text dark:text-dark-secondary-text text-xs mt-8 pb-4">
          Your data is yours. We're just borrowing it to make the app useful to you.
          <br /> Now stop reading legal pages and go watch something.
        </p>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group">
      <div className="flex items-center gap-3 mb-3">
        <FontAwesomeIcon
          icon={icon}
          className="w-4 h-4 text-light-accent dark:text-dark-accent transition-transform duration-300 group-hover:scale-110"
        />
        <div className="text-base font-bold text-light-header dark:text-white">
          {title}
        </div>
      </div>
      <div className="text-light-body-text dark:text-dark-body-text text-sm leading-relaxed pl-7 space-y-3">
        {children}
      </div>
    </div>
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
    <div>
      <p className="font-medium text-light-accent dark:text-dark-accent mb-1">
        {title}
      </p>
      <p>{children}</p>
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
      className="text-light-accent dark:text-dark-accent hover:underline font-medium transition-colors"
    >
      {children}
    </a>
  );
}

function ScrollLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-transparent p-0 m-0 text-light-accent dark:text-dark-accent font-semibold underline underline-offset-2 hover:opacity-75 transition-opacity cursor-pointer"
    >
      {children}
    </button>
  );
}