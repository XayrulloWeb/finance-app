import { Toaster } from 'react-hot-toast';

export { toast } from 'react-hot-toast';

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#18181b', // Zinc 900
            borderRadius: '16px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '600',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #10b981',
              background: '#f0fdf4', // emerald-50
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #ef4444',
              background: '#fef2f2', // rose-50
            },
          },
          loading: {
            style: {
              border: '1px solid #3b82f6',
              background: '#eff6ff', // blue-50
            },
          },
        }}
      />
    </>
  );
}
