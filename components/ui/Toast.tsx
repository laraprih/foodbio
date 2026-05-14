'use client';

import { toast, Toaster as HotToaster } from 'react-hot-toast';

export const Toaster = () => {
  return (
    <HotToaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '20px',
          background: '#1a1a1a',
          color: '#fff',
          fontSize: '14px',
          padding: '12px 24px',
        },
        success: {
          iconTheme: {
            primary: '#D4FF00',
            secondary: '#1a1a1a',
          },
        },
      }}
    />
  );
};

export { toast };
