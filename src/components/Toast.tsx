import { useEffect, useRef } from 'react';
import type { ToastMessage } from '../types';
import { Check } from 'lucide-react';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!toast) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onDismiss, toast.action ? 5000 : 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="toast-enter fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2.5 bg-[#18181B] text-white text-sm rounded-xl shadow-lg">
      <Check size={16} className="text-green-400 shrink-0" />
      <span>{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); onDismiss(); }}
          className="text-accent-light hover:text-white font-medium transition-colors whitespace-nowrap"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
