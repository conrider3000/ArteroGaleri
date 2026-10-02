'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const errorMessages: Record<string, string> = {
  Configuration: 'Erro de configuração do servidor. Tente novamente em instantes.',
  AccessDenied: 'Acesso negado. Você não tem permissão para entrar.',
  Verification: 'O link de verificação expirou ou já foi usado.',
  OAuthSignin: 'Erro ao iniciar o login com Google.',
  OAuthCallback: 'Erro ao receber a resposta do Google.',
  OAuthAccountNotLinked: 'Esta conta Google já está vinculada a outro usuário.',
  Callback: 'Erro no processo de autenticação.',
  Default: 'Ocorreu um erro inesperado ao entrar.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Erro ao entrar</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error !== 'Default' && (
            <div className="rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground">
              Código: {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Link href="/auth/signin">
              <Button className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Tentar novamente
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Voltar ao início
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
