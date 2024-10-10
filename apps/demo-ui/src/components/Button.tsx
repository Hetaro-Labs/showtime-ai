import { TwcComponentProps, twc } from 'react-twc';
import { VariantProps, cva } from 'class-variance-authority';

const button = cva(
  [
    'border',
    'rounded',
    'uppercase',
    'transition-colors',
    'ease-in-out',
    'duration-300',
    'outline-none',
  ],
  {
    variants: {
      disabled: {
        true: ['opacity-70', 'cursor-not-allowed'],
        false: [],
      },
      $intent: {
        primary: ['bg-violet-700', 'text-white', 'border-transparent', 'hover:bg-violet-900'],
        secondary: ['bg-white', 'text-gray-800', 'border-gray-400', 'hover:bg-gray-100'],
      },
      $size: {
        sm: ['text-sm', 'py-1', 'px-2', 'rounded-sm'],
        md: ['text-base', 'py-2', 'px-4', 'rounded-md'],
        lg: ['text-lg', 'py-3', 'px-6', 'rounded-lg'],
      },
    },
    defaultVariants: {
      $intent: 'primary',
      $size: 'md',
      disabled: false,
    },
  }
);

type ButtonProps = TwcComponentProps<'button'> & VariantProps<typeof button>;

export const Button = twc.button<ButtonProps>(({ $intent, $size, disabled }) =>
  button({ $intent, $size, disabled })
);
