'use client';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingProps {
  text?: string;
  size?: SpinnerSize;
  fullScreen?: boolean;
  hideText?: boolean;
  centerInParent?: boolean; // optional for grid/inline contexts
}

export default function Loading({
  text = 'Loading...',
  size = 'md',
  fullScreen = false,
  hideText = false,
  centerInParent = false,
}: LoadingProps) {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-6',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-bg)]/80'
    : centerInParent
    ? 'flex flex-col items-center justify-center w-full h-full'
    : 'flex flex-col items-center justify-center w-full py-8';

  return (
    <div className={containerClasses}>
      <div
        className={`rounded-full animate-spin ${sizeClasses[size]} border-t-transparent`}
        style={{
          borderColor: 'var(--color-btn-bg)',
          borderTopColor: 'transparent',
          borderRightColor: 'var(--color-btn-hover-bg)',
          borderBottomColor: 'var(--color-btn-bg)',
          borderLeftColor: 'var(--color-btn-bg)',
        }}
      />
      {!hideText && (
        <p
          className="mt-3 text-sm sm:text-base text-center"
          style={{ color: 'var(--color-body-text)' }}
        >
          {text}
        </p>
      )}
    </div>
  );
}
