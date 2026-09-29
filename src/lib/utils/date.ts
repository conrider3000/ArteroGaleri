import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(date: Date | string, pattern = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM yyyy', { locale: ptBR });
}

export function getYear(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.getFullYear();
}

export function getMonth(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.getMonth();
}