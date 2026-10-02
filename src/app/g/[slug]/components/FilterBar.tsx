'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Camera, FolderOpen, MapPin, Star, Search, FilterX, ChevronDown } from 'lucide-react';

interface Props {
  gallery: any;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (sort: { by: string; dir: 'asc' | 'desc' }) => void;
}

const SORT_OPTIONS = [
  { value: 'dateTaken', label: 'Data da foto' },
  { value: 'name', label: 'Nome' },
  { value: 'size', label: 'Tamanho' },
  { value: 'camera', label: 'Câmera' },
  { value: 'random', label: 'Aleatório' },
] as const;

export function FilterBar({
  gallery,
  filters,
  onFiltersChange,
  sortBy,
  sortDir,
  onSortChange,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || '');
  const [dateTo, setDateTo] = useState(filters.dateTo || '');
  const [folderPath, setFolderPath] = useState(filters.folderPath || '');
  const [camera, setCamera] = useState(filters.camera || '');
  const [kind, setKind] = useState(filters.kind || '');
  const [orientation, setOrientation] = useState(filters.orientation || '');
  const [hasGps, setHasGps] = useState(filters.hasGps);
  const [isStarred, setIsStarred] = useState(filters.isStarred);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const newFilters = { ...filters };
    if (value) newFilters.search = value;
    else delete newFilters.search;
    onFiltersChange(newFilters);
  };

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters };
    if (value) newFilters[key] = value;
    else delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar nome, câmera, tag..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="w-[160px]">
        <Select value={sortBy} onValueChange={(v) => onSortChange({ by: v, dir: sortDir })}>
          <SelectTrigger>
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onSortChange({ by: sortBy, dir: sortDir === 'asc' ? 'desc' : 'asc' })}
        className="h-9"
      >
        {sortDir === 'asc' ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-180" />}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={cn('h-9 gap-1', showAdvanced && 'bg-accent')}
      >
        <FilterX className="h-4 w-4" />
        <span>Filtros</span>
        {hasActiveFilters && (
          <span className="rounded-full bg-primary/20 px-1.5 text-xs text-primary">
            {Object.keys(filters).length}
          </span>
        )}
      </Button>

      {showAdvanced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-0">
          <div className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filtros avançados</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAdvanced(false)}>
                <ChevronDown className="h-4 w-4 rotate-180" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Data inicial</label>
                <Input type="date" value={dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data final</label>
                <Input type="date" value={dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pasta</label>
                <Select value={folderPath} onValueChange={(v) => updateFilter('folderPath', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as pastas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {gallery.folders?.map((f: string) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Câmera</label>
                <Select value={camera} onValueChange={(v) => updateFilter('camera', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {gallery.cameras?.map((c: { make: string; model: string }) => (
                      <SelectItem key={`${c.make}-${c.model}`} value={`${c.make} ${c.model}`}>
                        {c.make} {c.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <Select value={kind} onValueChange={(v) => updateFilter('kind', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="image">Fotos</SelectItem>
                    <SelectItem value="video">Vídeos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Orientação</label>
                <Select value={orientation} onValueChange={(v) => updateFilter('orientation', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="landscape">Paisagem</SelectItem>
                    <SelectItem value="portrait">Retrato</SelectItem>
                    <SelectItem value="square">Quadrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!hasGps}
                    onChange={(e) => updateFilter('hasGps', e.target.checked)}
                  />
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Com GPS
                  </span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!isStarred}
                    onChange={(e) => updateFilter('isStarred', e.target.checked)}
                  />
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Favoritas
                  </span>
                </label>
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="outline" className="w-full mt-4" onClick={() => onFiltersChange({})}>
                Limpar todos os filtros
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}