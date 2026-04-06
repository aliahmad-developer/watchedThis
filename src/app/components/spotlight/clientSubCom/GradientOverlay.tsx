const GradientOverlay = () => (
  <>
    {/* Primary fade — moderate width */}
    <div className="absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-light-bg via-light-bg/50 to-transparent dark:from-dark-bg dark:via-dark-bg/50" />
    <div className="absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-light-bg via-light-bg/50 to-transparent dark:from-dark-bg dark:via-dark-bg/50" />
    <div className="absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-light-bg via-light-bg/50 to-transparent dark:from-dark-bg dark:via-dark-bg/50" />
    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-light-bg via-light-bg/50 to-transparent dark:from-dark-bg dark:via-dark-bg/50" />

    {/* Reinforcement layer — tight to the edge only */}
    <div className="absolute inset-y-0 left-0 w-[8%] bg-linear-to-r from-light-bg to-transparent dark:from-dark-bg" />
    <div className="absolute inset-y-0 right-0 w-[8%] bg-linear-to-l from-light-bg to-transparent dark:from-dark-bg" />
    <div className="absolute inset-x-0 top-0 h-[8%] bg-linear-to-b from-light-bg to-transparent dark:from-dark-bg" />
    <div className="absolute inset-x-0 bottom-0 h-[8%] bg-linear-to-t from-light-bg to-transparent dark:from-dark-bg" />
  </>
);

export default GradientOverlay;