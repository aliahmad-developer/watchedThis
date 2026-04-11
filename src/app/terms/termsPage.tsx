"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilm,
  faUser,
  faShield,
  faTriangleExclamation,
  faBan,
  faRotate,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg px-4 py-16">
      <div className="max-w-2xl mx-auto bg-light-card dark:bg-dark-card rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="mb-6 font-mono">
          <p className="font text-xs font-semibold tracking-widest uppercase text-light-accent dark:text-dark-accent">
            The fine print
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-light-header dark:text-white mb-4 leading-tight">
            Terms of Use
          </h1>
          <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
            Last updated March 2026; yes, someone actually maintains this.
          </p>
        </div>

        {/* Intro prose */}
        <p className="text-light-body-text dark:text-dark-body-text leading-relaxed mb-12 text-base">
          These are the terms for using WatchedThis. Nothing unexpected, nothing
          buried in legal jargon; just the basics.
        </p>

        <div className="space-y-5">
          <Section icon={faUser} title="Who's behind this?">
            WatchedThis is a personal project, not a company, not a VC-backed
            startup with a ping-pong table, and definitely not a subsidiary of
            some faceless corporation. It's just a developer who got tired of
            the "what should we watch?" conversation taking longer than the
            actual movie. It runs on personal funds, a concerning amount of
            caffeine, and occasionally the kindness of people who{" "}
            <ScrollLink onClick={() => scrollToSection("membership")}>
              choose to support it
            </ScrollLink>
            .
          </Section>

          <Section icon={faFilm} title="Where does the content come from?">
            All movie and TV data, including titles, descriptions, images, and
            ratings, comes from{" "}
            <ExternalLink href="https://www.themoviedb.org">
              TMDB (The Movie Database)
            </ExternalLink>
            . WatchedThis doesn't own any of it, claim any of it, or pretend to.
            Everything belongs to TMDB and the respective copyright holders.
            We're just the middleman helping you finally commit to something.
          </Section>

          <Section icon={faShield} title="Your account and your data">
            If you sign in, authentication is handled by Firebase. Your
            watchlist, search history, and usage patterns are stored only to
            make recommendations useful. That data is never sold, never shared,
            and never used to target you with ads. That's not what this site is
            about, and frankly, it never will be.
          </Section>

          <Section icon={faShield} title="Privacy">
            WatchedThis doesn't collect more than it needs. Firebase and Google
            handle authentication on their end, so their respective privacy
            policies apply there. Beyond that, what you do on WatchedThis stays
            on WatchedThis, unless you tell your friends about it, which would
            honestly be great.
          </Section>

          <Section icon={faBan} title="What you shouldn't do">
            Please don't scrape the site, try to break it, or use it for
            anything commercial or shady. It's a movie discovery app , the bar
            for acceptable behavior is genuinely very low, and yet here we are
            having to spell it out.
          </Section>

          <Section icon={faTriangleExclamation} title="Disclaimer">
            WatchedThis is provided as-is. Things occasionally break. When they
            do, they get fixed. No guarantees are made about uptime, data
            accuracy, or the quality of what the algorithm suggests, though
            genuine effort goes into that last one.
          </Section>

          <Section icon={faRotate} title="Changes to these terms">
            These terms may be updated from time to time. Continuing to use the
            site means you're okay with the current version. No surprises. Got
            questions or concerns? Use our{" "}
            <ScrollLink onClick={() => scrollToSection("feedback-form")}>
              feedback form
            </ScrollLink>
            .
          </Section>
        </div>

        {/* Footer note */}
        <p className="text-center text-light-secondary-text dark:text-dark-secondary-text text-xs mt-8 pb-4">
          WatchedThis is ad-free *cough *cough for now.
          <br /> You're a visitor, not a product. Now go watch something.
        </p>
      </div>
    </div>
  );
}

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
        <h2 className="text-base font-bold text-light-header dark:text-white">
          {title}
        </h2>
      </div>
      <p className="text-light-body-text dark:text-dark-body-text text-sm leading-relaxed pl-7">
        {children}
      </p>
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
      className="bg-transparent m-0 p-0 text-light-accent dark:text-dark-accent font-semibold underline underline-offset-2 hover:opacity-75 transition-opacity cursor-pointer"
    >
      {children}
    </button>
  );
}