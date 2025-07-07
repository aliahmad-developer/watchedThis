import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

export default function ActionButtons() {
  return (
    <div className="flex flex-wrap gap-4">
      <button className="px-4 py-2 text-sm lg:text-base rounded-full font-medium flex items-center gap-2 transition bg-light-btn-bg hover:bg-light-btn-hover-bg text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-hover-bg dark:text-dark-btn-text">
        <FontAwesomeIcon icon={faPlay} />
        Watch Now
      </button>
      <button className="text-light-accent flex items-center gap-2 bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border px-6 py-3 rounded-lg font-semibold transition">
        Add to List
      </button>
    </div>
  );
}