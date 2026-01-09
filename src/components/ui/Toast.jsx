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
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            },
          },
          loading: {
            style: {
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            },
          },
        }}
      />
    </>
  );
}
