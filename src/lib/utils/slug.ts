import { nanoid } from 'nanoid';

export function generateSlug(title: string, length = 12): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
  const suffix = nanoid(length);
  return `${base}-${suffix}`.substring(0, 64);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{10,64}$/.test(slug);
}