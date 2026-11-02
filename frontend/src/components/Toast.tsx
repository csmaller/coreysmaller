import React, { useEffect } from 'react';

const SUCCESS_DURATION_MS = 5000;

interface ToastProps {
  kind: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ kind, message, onDismiss }) => {
  // Errors stay up until dismissed, so there is time to read and act on them.
  useEffect(() => {
    if (kind !== 'success') return;
    const timer = setTimeout(onDismiss, SUCCESS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [kind, onDismiss]);

  return (
    <div className={`toast is-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <p>{message}</p>
      <button type="button" aria-label="Dismiss notification" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
};
