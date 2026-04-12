"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faHeart,
  faShuffle,
  faRocket,
  faFilm,
} from "@fortawesome/free-solid-svg-icons";


function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg px-4 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Card */}
        <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-md p-6 sm:p-10 relative overflow-hidden">

          {/* Top section: header + avatars side by side */}
          <div className="flex items-start justify-between gap-4 mb-8">
            {/* Left: header text */}
            <div className="font-mono flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-widest uppercase text-light-accent dark:text-dark-accent mb-1">
                Creators
              </p>
<div className="text-2xl xs:text-3xl sm:text-5xl font-bold leading-tight">
                WatchedThis
              </div>
            </div>

            {/* Right: stacked avatars */}
            <div className="flex-shrink-0 flex flex-row-reverse items-center mt-1">
              {/* Tiba — behind */}
              <div className="relative -mr-2 sm:-mr-4 z-0 group/tiba">
                <div className="w-11 h-11 sm:w-20 sm:h-20 rounded-full bg-accent shadow-md ring-2 ring-light-card dark:ring-dark-card overflow-hidden transition-transform duration-300 group-hover/tiba:scale-105">
                  <img src="/tiba.png" alt="Tiba" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover/tiba:opacity-100 group-hover/tiba:visible transition-all duration-200 whitespace-nowrap z-20 pointer-events-none">
                  Tiba
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>

              {/* Missy — front */}
              <div className="relative z-10 group/missy">
                <div className="w-11 h-11 sm:w-20 sm:h-20 rounded-full bg-accent shadow-md ring-2 ring-light-card dark:ring-dark-card overflow-hidden transition-transform duration-300 group-hover/missy:scale-105">
                  <img src="/profile.png" alt="Missy" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover/missy:opacity-100 group-hover/missy:visible transition-all duration-200 whitespace-nowrap z-20 pointer-events-none">
                  Missy
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Intro */}
          <p className="text-light-body-text dark:text-dark-body-text leading-relaxed mb-10 text-sm sm:text-base">
            Hi! We're{" "}
            <span className="inline text-light-accent dark:text-dark-accent font-semibold">Missy</span>{" "}
            and{" "}
            <span className="inline text-light-accent dark:text-dark-accent font-semibold">Tiba</span>
            , the creators. Tired of endless Netflix scrolling, we built WatchedThis. This page
            shares our story, motivation, and vision.
          </p>

          {/* Sections */}
          <div className="space-y-6">
            <Section icon={faUsers} title="1. Who we are">
              <span className="inline text-light-accent dark:text-dark-accent font-semibold">Missy</span>{" "}
              (Jack of all Trades) and{" "}
              <span className="inline text-light-accent dark:text-dark-accent font-semibold">Tiba</span>{" "}
              (Slacker). Two developers passionate about movies and coding. We're not a company,
              just friends building fun tools.
            </Section>

            <Section icon={faFilm} title="2. Our story">
              Movie nights always stuck on choosing. We created WatchedThis for random discovery.
              No ads, no tracking, just fun. Built with coffee and passion.
            </Section>

            <Section icon={faHeart} title="3. Our philosophy">
              No ads, no data selling, no endless scrolls. We made WatchedThis clean and simple.
              You're a guest, not a customer. Missy designs intuitive UIs; Tiba keeps data secure.
              Focus on movie fun.
            </Section>

            <Section icon={faShuffle} title="4. How to support">
              Like the spins?{" "}
              <button
                onClick={() => scrollToSection("membership")}
                className="p-0 m-0 bg-transparent text-light-accent dark:text-dark-accent font-semibold underline underline-offset-2 cursor-pointer hover:opacity-75 transition-opacity"
              >
                Support
              </button>{" "}
              covers Missy's design tools, Tiba's servers, and coffee.
              Helps us stay independent — no VCs, just indie creators.
            </Section>

            <Section icon={faRocket} title="5. The future">
              We aim for better recommendations, mobile apps, and yes… #peace. Have ideas? Use the{" "}
              <button
                onClick={() => scrollToSection("feedback-form")}
                className="bg-transparent text-light-accent p-0 m-0 dark:text-dark-accent font-semibold underline underline-offset-2 cursor-pointer hover:opacity-75 transition-opacity"
              >
                feedback form
              </button>
              . Your input shapes what comes next — and yes, we do read them.
            </Section>
          </div>

          {/* Divider */}
          <div className="border-t border-light-border dark:border-dark-border mt-10 pt-6">
            <p className="text-center text-light-secondary-text dark:text-dark-secondary-text text-xs">
              Thanks for using WatchedThis. Made with <FontAwesomeIcon color="#D4AF37" icon={faHeart}/> by{" "}
              <span className="inline text-light-accent dark:text-dark-accent font-semibold">
                Missy & Tiba
              </span>
              .
            </p>
          </div>

        </div>
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
      <div className="flex items-center gap-3 mb-2">
        <FontAwesomeIcon
          icon={icon}
          className="w-4 h-4 flex-shrink-0 text-light-accent dark:text-dark-accent transition-transform duration-300 group-hover:scale-110"
        />
        <h2 className="text-sm sm:text-base font-bold text-light-header dark:text-white">
          {title}
        </h2>
      </div>
      <div className="text-light-body-text dark:text-dark-body-text text-sm leading-relaxed pl-7">
        {children}
      </div>
    </div>
  );
}