'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export function SyncButton({ galleryId, label = 'Sincronizar agora' }: { galleryId: string; label?: string }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [stats, setStats] = useState<{ processed: number; total: number; errors: number } | null>(null);
  const [message, setMessage] = useState('');

  const run = async () => {
    setState('running');
    setMessage('');
    let cursor: string | undefined;
    let processed = 0;
    let total = 0;
    let errors = 0;

    try {
      // Sincroniza em blocos até não haver mais cursor (max 20 iterações)
      for (let i = 0; i < 20; i++) {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ galleryId, cursor }),
        });

        const data = await res.json();

        if (!res.ok) {
          setState('error');
          setMessage(data.error || 'Falha na sincronização');
          return;
        }

        processed += data.processed || 0;
        total = data.totalEstimated || total;
        errors += (data.errors?.length || 0);

        if (data.errors?.length) {
          const first = data.errors[0];
          setMessage(`Aviso: ${data.errors.length} arquivo(s) com erro (ex.: ${first.error?.slice(0, 80)})`);
        }

        if (!data.nextCursor) {
          setStats({ processed, total, errors });
          setState('done');
          router.refresh();
          return;
        }

        cursor = JSON.stringify(data.nextCursor);
      }

      setStats({ processed, total, errors });
      setState('done');
      setMessage('Sincronização parcial (limite de tempo). Clique novamente para continuar.');
      router.refresh();
    } catch (e) {
      setState('error');
      setMessage(e instanceof Error ? e.message : 'Erro de rede');
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={run} disabled={state === 'running'} variant={state === 'error' ? 'destructive' : 'default'}>
        {state === 'running' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : state === 'done' ? (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        ) : state === 'error' ? (
          <AlertTriangle className="mr-2 h-4 w-4" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {state === 'running' ? 'Sincronizando...' : state === 'done' ? 'Sincronizado' : label}
      </Button>

      {stats && state === 'done' && (
        <p className="text-sm text-muted-foreground">
          {stats.processed} arquivo(s) processado(s), {stats.total} no total
          {stats.errors > 0 && `, ${stats.errors} com erro`}
        </p>
      )}

      {message && (
        <p className={`text-xs ${state === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {message}
        </p>
      )}
    </div>
  );
}