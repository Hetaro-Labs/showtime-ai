import * as ToastPrimitives from '@radix-ui/react-toast';
import { twc } from 'react-twc';
import { VariantProps, cva } from 'class-variance-authority';

const toast = cva(
  [
    'border',
    'border-violet-950',
    'bg-background',
    'rounded-md',
    'shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]',
    'p-[15px]',
    'grid',
    "[grid-template-areas:_'title_action'_'description_action']",
    'grid-cols-[auto_max-content]',
    'gap-x-[15px]',
    'items-center',
    'data-[state=open]:animate-slideIn',
    'data-[state=closed]:animate-hide',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=cancel]:transition-[transform_200ms_ease-out]',
    'data-[swipe=end]:animate-swipeOut',
  ],
  {
    variants: {
      $intent: {
        success: ['border-green-600'],
        warning: ['border-yellow-600'],
        error: ['border-red-600'],
      },
    },
    defaultVariants: {
      $intent: 'success',
    },
  }
);

export interface ToastProps extends ToastPrimitives.ToastProps, VariantProps<typeof toast> {
  title: string;
  description: string;
  actions?: {
    node: React.ReactNode;
    altText: string;
  }[];
}

export const ToastContainer = twc(ToastPrimitives.Root as React.FC<ToastProps>)(({ $intent }) =>
  toast({ $intent })
);

export const ToastTitle = twc(
  ToastPrimitives.Title
)`[grid-area:_title] mb-[5px] font-medium text-slate12 text-[15px]`;

export const Toast: React.FC<ToastProps> = ({ description, title, actions, ...props }) => (
  <ToastContainer title={title} description={description} {...props}>
    {title ? (
      <ToastTitle className="[grid-area:_title] mb-[5px] font-medium text-slate12 text-[15px]">
        {title}
      </ToastTitle>
    ) : null}
    <ToastPrimitives.Description asChild>
      <p className="[grid-area:_description] m-0 text-[13px] leading-[1.3] text-slate-400">
        {description}
      </p>
    </ToastPrimitives.Description>
    {actions
      ? actions.map(({ node, altText }, index) => (
          <ToastPrimitives.Action
            key={index}
            className="[grid-area:_action]"
            asChild
            altText={altText}
          >
            {node}
          </ToastPrimitives.Action>
        ))
      : null}
  </ToastContainer>
);
