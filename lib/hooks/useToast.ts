import { useMemo } from 'react';
import toast from 'react-hot-toast';

export function useToast() {
  return useMemo(
    () => ({
      success: (message: string) => toast.success(message),
      error: (message: string) => toast.error(message),
      loading: (message: string) => toast.loading(message),
      dismiss: (toastId?: string) => toast.dismiss(toastId),
    }),
    []
  );
}
