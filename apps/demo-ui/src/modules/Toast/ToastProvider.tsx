import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { ToastContext, ToastItem } from './ToastContext';
import { Toast } from './Toast';

interface ToastProviderProps extends ToastPrimitives.ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  duration = 5000,
  swipeDirection = 'right',
}) => {
  const [activeToast, setActiveToast] = React.useState<ToastItem | null>(null);
  const onAddToast = React.useCallback((toast: ToastItem) => {
    setActiveToast(toast);
  }, []);
  const value = React.useMemo(
    () => ({
      activeToast,
      addToast: onAddToast,
    }),
    [onAddToast, activeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitives.Provider duration={duration} swipeDirection={swipeDirection}>
        {children}
        {activeToast ? (
          <Toast
            title={activeToast.title}
            $intent={activeToast.intent}
            description={activeToast.description}
          />
        ) : null}
        <ToastPrimitives.Viewport className="[--viewport-padding:_25px] fixed bottom-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-[10px] w-[390px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
};
