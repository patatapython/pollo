'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fef9f0',
            color: '#3e3229',
            borderRadius: '20px',
            border: '3px solid',
            borderColor: '#d27d2d',
            fontFamily: "'Courier New', monospace",
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '14px',
            boxShadow: '6px 6px 0px rgba(210, 125, 45, 0.25)',
            padding: '16px 20px',
          },
          success: {
            style: {
              background: '#dcfce7',
              color: '#166534',
              borderColor: '#16a34a',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#dcfce7',
            },
          },
          error: {
            style: {
              background: '#fee2e2',
              color: '#7f1d1d',
              borderColor: '#b91c1c',
            },
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fee2e2',
            },
          },
        }}
      />
      {children}
    </>
  );
}
