const GradientOverlay = () => (
  <>
    <div className="absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
    <div className="absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
    <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
    <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
  </>
);

export default GradientOverlay;