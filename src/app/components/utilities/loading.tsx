'use client';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingProps {
  text?: string;
  size?: SpinnerSize;
  fullScreen?: boolean;
}

export default function Loading({
  text = 'Loading...',
  size = 'md',
  fullScreen = false,
}: LoadingProps) {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-6',
  };

  return (
    <div
      className={`${
        fullScreen
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80'
          : 'flex flex-col items-center justify-center w-full py-12'
      }`}
    >
      <div
        className={`rounded-full animate-spin ${sizeClasses[size]} border-t-transparent`}
        style={{
          borderColor: 'var(--color-btn-bg)',
          borderTopColor: 'transparent',
          borderRightColor: 'var(--color-btn-hover-bg)',
          borderBottomColor: 'var(--color-btn-bg)',
          borderLeftColor: 'var(--color-btn-bg)',
        }}
      ></div>

      <p
        className="mt-4 text-base md:text-lg text-center"
        style={{ color: 'var(--color-body-text)' }}
      >
        {text}
      </p>
    </div>
  );
}
