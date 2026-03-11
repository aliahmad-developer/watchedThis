const GradientOverlay = () => (
  <>
    <div className="absolute inset-y-0 left-0 w-1/5 bg-linear-to-r from-light-bg to-transparent dark:from-dark-bg" />
    <div className="absolute inset-y-0 right-0 w-1/5 bg-linear-to-l from-light-bg to-transparent dark:from-dark-bg" />
    <div className="absolute inset-x-0 top-0 h-1/5 bg-linear-to-b from-light-bg to-transparent dark:from-dark-bg" />
    <div className="absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t from-light-bg to-transparent dark:from-dark-bg" />
  </>
);

export default GradientOverlay;