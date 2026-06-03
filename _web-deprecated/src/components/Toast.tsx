import { useEffect } from 'react';
import type { ToastMessage } from '../types';
import { Check } from 'lucide-react';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="toast-enter fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 bg-[#18181B] text-white text-sm rounded-xl shadow-lg">
      <Check size={16} />
      {toast.message}
    </div>
  );
}
