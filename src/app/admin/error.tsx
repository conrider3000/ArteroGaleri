'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Erro ao carregar esta página</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Tente novamente ou volte para as galerias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          )}
          <Button className="w-full gap-2" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { window.location.href = '/admin/galleries'; }}
          >
            Voltar para Minhas Galerias
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}