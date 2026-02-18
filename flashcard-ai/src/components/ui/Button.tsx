import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const variantClass =
    variant === 'secondary' ? 'saas-btn-secondary' : variant === 'danger' ? 'saas-btn-danger' : 'saas-btn-primary';

  return <button {...props} className={`${variantClass} px-4 py-2 text-sm ${className}`.trim()} />;
}
