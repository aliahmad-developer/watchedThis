import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faHeart,
  faShuffle,
  faRocket,
  faCoffee,
  faFilm,
} from "@fortawesome/free-solid-svg-icons";

export const metadata = {
  title: "Creators ,  RandoMovie",
  description: "Hi! We're Missy and Tiba, creators of RandoMovie. Ending movie choice paralysis one random spin at a time.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg px-4 py-16">
      <div className="max-w-2xl mx-auto bg-light-card dark:bg-dark-card rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="mb-6 font-mono">
          <p className="text-xs font-semibold tracking-widest uppercase text-light-accent dark:text-dark-accent">
            Creators
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight inline">
            RandoMovie
          </h1>
        </div>

        {/* Intro */}
        <p className="text-light-body-text dark:text-dark-body-text leading-relaxed mb-12 text-base">
          Hi! We're <span className="inline text-light-accent dark:text-dark-accent font-semibold">Missy</span> and <span className="inline text-light-accent dark:text-dark-accent font-semibold">Tiba</span>, the creators. Tired of endless Netflix scrolling, we built RandoMovie. This page shares our story, motivation, and vision.
        </p>

        <div className="space-y-5">
          <Section icon={faUsers} title="1. Who we are">
            <span className="inline text-light-accent dark:text-dark-accent font-semibold">Missy</span> (frontend) and <span className="inline text-light-accent dark:text-dark-accent font-semibold">Tiba</span> (backend). Two developers passionate about movies and coding. We're not a company, just friends building fun tools.
          </Section>

          <Section icon={faFilm} title="2. Our story">
            Movie nights always stuck on choosing. We created RandoMovie for random discovery. No ads, no tracking, just fun. Built with coffee and passion.
          </Section>

          <Section icon={faHeart} title="3. Our philosophy">
            No ads, no data selling, no endless scrolls. We made RandoMovie clean and simple. You're a guest, not a customer. Missy designs intuitive UIs; Tiba keeps data secure. Focus on movie fun.
          </Section>

          <Section icon={faShuffle} title="4. How to support">
            Like the spins? Support covers Missy's design tools, Tiba's servers, and coffee. Helps us stay independent, no VCs, just indie creators.
          </Section>

          <Section icon={faRocket} title="5. The future">
            We aim for better recommendations, mobile apps, and yes...#peace. Have ideas? Use the feedback form in the footer. Your input shapes what comes next and yes we do read them.
          </Section>
        </div>

        {/* Footer note */}
        <p className="text-center text-light-secondary-text dark:text-dark-secondary-text text-xs mt-8 pb-4">
          Thanks for using RandoMovie. Made by <span className="inline text-light-accent dark:text-dark-accent font-semibold">Missy & Tiba</span>.
        </p>
      </div>
    </div>
  );
}

// Helpers
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
      <div className="text-light-body-text dark:text-dark-body-text text-sm leading-relaxed pl-7">
        {children}
      </div>
    </div>
  );
}
