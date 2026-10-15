'use client';

import { signIn } from 'next-auth/react';
import { Button, type ButtonProps } from '@/components/ui/button';

export function ConnectDriveCta({ children, onClick, ...props }: ButtonProps) {
  return (
    <Button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        void signIn('google', { callbackUrl: '/' }).catch(() => {
          window.location.href = '/auth/signin?callbackUrl=/';
        });
      }}
    >
      {children}
    </Button>
  );
}
