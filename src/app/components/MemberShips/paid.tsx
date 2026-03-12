"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPatreon } from "@fortawesome/free-brands-svg-icons";

export default function Membership() {
  const [is404, setIs404] = useState(false);

  useEffect(() => {
    const check = () =>
      setIs404(document.documentElement.dataset.page === "404");
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-page"],
    });
    return () => observer.disconnect();
  }, []);

  if (is404) return null;

  return (
    <section className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 p-8 cursor-default bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text border border-light-border dark:border-dark-border rounded-2xl shadow-md transition-colors duration-300">
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-3xl font-bold mb-4 text-light-header dark:text-dark-header">
          #Support RandoMovie
        </h1>
        <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm sm:text-base leading-relaxed max-w-md mx-auto md:mx-0">
          You're a visitor, not a customer. If you'd like to help keep{" "}
          <span className="inline font-semibold text-light-accent dark:text-dark-accent">
            RandoMovie
          </span>{" "}
          running and growing, consider supporting my work.
        </p>
      </div>

      <div className="flex-1 flex justify-center md:justify-end">
        <Link
          href="https://patreon.com/randomovieorg?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
          target="_blank"
          className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-light-accent dark:bg-dark-accent text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
          <FontAwesomeIcon icon={faPatreon} className="w-5 h-5" />
          <span>Support on Patreon</span>
        </Link>
      </div>
    </section>
  );
}