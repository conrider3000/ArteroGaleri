export const GALLERY_VIEWS = [
  { id: 'justified', label: 'Justificado', icon: 'LayoutGrid' },
  { id: 'masonry', label: 'Masonry', icon: 'Grid2x2' },
  { id: 'timeline', label: 'Timeline', icon: 'Calendar' },
  { id: 'slideshow', label: 'Apresentação', icon: 'Play' },
  { id: 'folders', label: 'Pastas', icon: 'FolderTree' },
  { id: 'map', label: 'Mapa', icon: 'MapPin' },
] as const;

export type GalleryViewId = typeof GALLERY_VIEWS[number]['id'];

export const SORT_OPTIONS = [
  { value: 'dateTaken', label: 'Data da foto' },
  { value: 'name', label: 'Nome' },
  { value: 'size', label: 'Tamanho' },
  { value: 'camera', label: 'Câmera' },
  { value: 'random', label: 'Aleatório' },
] as const;

export type SortBy = typeof SORT_OPTIONS[number]['value'];

export const ACCESS_MODES = [
  { value: 'public', label: 'Público', description: 'Indexável por buscadores, qualquer um com o link acessa' },
  { value: 'unlisted', label: 'Não listado', description: 'Link secreto, não indexado, sem senha' },
  { value: 'password', label: 'Com senha', description: 'Requer senha para acessar' },
] as const;

export type AccessMode = typeof ACCESS_MODES[number]['value'];

export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
export const CHUNK_SIZE = 200;
export const TIME_BUDGET_MS = 14000;
export const PAGE_SIZE = 60;
export const MAX_GALLERIES_PER_USER = 50;
export const MAX_MEDIA_PER_GALLERY = 50000;
export const SESSION_COOKIE_NAME = 'gallery_session';
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days