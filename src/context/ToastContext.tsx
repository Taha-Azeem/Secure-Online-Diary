import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          
          let icon = <Info size={20} className="text-cyan-400 shrink-0" />;
          let borderAccent = 'border-l-4 border-l-cyan-400 border-white/10';
          let glowStyle = 'shadow-[0_0_20px_rgba(6,182,212,0.15)]';
          
          if (isSuccess) {
            icon = <CheckCircle size={20} className="text-green-400 shrink-0" />;
            borderAccent = 'border-l-4 border-l-green-400 border-white/10';
            glowStyle = 'shadow-[0_0_20px_rgba(16,185,129,0.15)]';
          } else if (isError) {
            icon = <AlertTriangle size={20} className="text-red-400 shrink-0" />;
            borderAccent = 'border-l-4 border-l-red-400 border-white/10';
            glowStyle = 'shadow-[0_0_20px_rgba(239,68,68,0.15)]';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-4 rounded-xl bg-surface-container-high/90 backdrop-blur-xl border p-4 ${borderAccent} ${glowStyle} text-on-surface transition-all duration-300 transform translate-y-0 animate-fade-in`}
              role="alert"
            >
              <div className="flex items-center gap-3">
                {icon}
                <p className="text-sm font-bold tracking-wide select-none leading-relaxed text-white">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-on-surface-variant hover:text-white hover:scale-105 active:scale-95 transition-all p-1"
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
