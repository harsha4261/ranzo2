'use client';

// Minimal, dependency-free loading / error banner shared across admin pages.

export function LoadingBanner({ label = 'Loading…' }: { label?: string }) {
  return <p style={{ color: '#7A7E96', fontSize: 14 }}>{label}</p>;
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        background: '#FDEDED',
        border: '1px solid #F3B7B7',
        color: '#D63B3B',
        padding: '10px 14px',
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #D63B3B',
            background: '#fff',
            color: '#D63B3B',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
