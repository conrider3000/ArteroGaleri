'use client';

import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  Grid2x2,
  Calendar,
  Play,
  FolderTree,
  MapPin,
} from 'lucide-react';

const VIEWS = [
  { id: 'justified', label: 'Justificado', icon: LayoutGrid },
  { id: 'masonry', label: 'Masonry', icon: Grid2x2 },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'slideshow', label: 'Apresentação', icon: Play },
  { id: 'folders', label: 'Pastas', icon: FolderTree },
  { id: 'map', label: 'Mapa', icon: MapPin },
] as const;

type ViewType = typeof VIEWS[number]['id'];

interface Props {
  current: ViewType;
  onChange: (view: ViewType) => void;
}

export function ViewSwitcher({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1" role="tablist">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          role="tab"
          aria-selected={current === v.id}
          onClick={() => onChange(v.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            current === v.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <v.icon className="h-4 w-4" aria-hidden />
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  );
}