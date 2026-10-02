'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function ConnectDriveButton({ label = 'Conectar Google Drive' }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      onClick={async () => {
        setLoading(true);
        await signIn('google', { callbackUrl: '/admin/galleries' });
      }}
      disabled={loading}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {loading ? 'Conectando...' : label}
    </Button>
  );
}