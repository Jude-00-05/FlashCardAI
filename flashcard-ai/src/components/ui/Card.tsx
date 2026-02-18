import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`saas-card ${className}`.trim()} />;
}
