import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

export default function ActionButtons() {
  return (
    <div className="flex flex-wrap gap-4">
      <button className="flex items-center gap-2 bg-light-btn-bg dark:bg-dark-btn-bg hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg text-light-btn-text dark:text-dark-btn-text px-6 py-3 rounded-lg font-semibold transition">
        <FontAwesomeIcon icon={faPlay} />
        Watch Now
      </button>
      <button className="text-light-accent flex items-center gap-2 bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border px-6 py-3 rounded-lg font-semibold transition">
        Add to List
      </button>
    </div>
  );
}