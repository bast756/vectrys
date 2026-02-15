import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        style: {
          background: 'rgba(13, 18, 32, 0.95)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255,255,255,0.055)',
          color: '#f1f5f9',
          fontSize: '13px',
          borderRadius: '14px',
          fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
        },
        classNames: {
          success: 'border-emerald-500/30',
          error: 'border-red-500/30',
          warning: 'border-gold/30',
          info: 'border-blue-500/30',
        },
      }}
    />
  );
}
