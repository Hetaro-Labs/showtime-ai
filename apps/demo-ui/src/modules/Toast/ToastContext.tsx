import * as React from 'react';

export interface ToastItem {
  title: string;
  description: string;
  intent: 'success' | 'warning' | 'error';
}

export interface ToastContextProps {
  activeToast: ToastItem | null;
  addToast: (toast: ToastItem) => void;
}

export const ToastContext = React.createContext<ToastContextProps>({
  activeToast: null,
  addToast: () => {},
});
