'use client';

import { useEffect, useRef, useState } from 'react';
import { Media } from '@/lib/db/schema';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  media: Media[];
  gallery: any;
}

export function MapView({ media, gallery }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  const mediaWithGps = media.filter(m => m.latitude && m.longitude);

  useEffect(() => {
    if (!mapRef.current || mapLoaded || mediaWithGps.length === 0) return;

    const initMap = async () => {
      try {
        const maplibregl = await import('maplibre-gl');
        await import('maplibre-gl/dist/maplibre-gl.css');
        
        const map = new maplibregl.Map({
          container: mapRef.current!,
          style: 'https://demotiles.maplibre.org/style.json',
          center: [
            parseFloat(mediaWithGps[0].longitude!),
            parseFloat(mediaWithGps[0].latitude!)
          ],
          zoom: 3,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
          const features = mediaWithGps.map((item, index) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [parseFloat(item.longitude!), parseFloat(item.latitude!)],
            },
            properties: {
              id: item.id,
              index,
              name: item.name,
              date: item.dateTaken,
            },
          }));

          map.addSource('photos', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'photos',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#2196f3', 100, '#3f51b5'],
              'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 100, 40],
            },
          });

          map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'photos',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
          });

          map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'photos',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#e91e63',
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          });

          map.on('click', 'clusters', (e: any) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            if (!features[0]) return;
            const clusterId = features[0].properties.cluster_id;
            const source = map.getSource('photos');
            if (source && 'getClusterExpansionZoom' in source) {
              (source as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                if (err) return;
                const geom = features[0].geometry as any;
                if (geom?.coordinates) {
                  map.easeTo({ center: geom.coordinates, zoom });
                }
              });
            }
          });

          map.on('click', 'unclustered-point', (e: any) => {
            if (!e.features[0]) return;
            const props = e.features[0].properties;
            const media = mediaWithGps.find(m => m.id === props.id);
            if (media) setSelectedMedia(media);
          });

          map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
          map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');
          map.on('mouseenter', 'unclustered-point', () => map.getCanvas().style.cursor = 'pointer');
          map.on('mouseleave', 'unclustered-point', () => map.getCanvas().style.cursor = '');

          mapInstance.current = map;
          setMapLoaded(true);
        });
      } catch (e) {
        console.error('Failed to load map:', e);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapLoaded, mediaWithGps]);

  if (mediaWithGps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center text-muted-foreground">
        <MapPin className="mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">Nenhuma foto com GPS</h3>
        <p>As fotos desta galeria não possuem dados de localização.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      
      {selectedMedia && (
        <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto">
          <div className="bg-background rounded-lg shadow-lg p-4 flex items-center gap-3">
            <img
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}/g/${gallery.id}/thumb/${selectedMedia.id}.webp`}
              alt={selectedMedia.name}
              className="w-16 h-16 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedMedia.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedMedia.dateTaken ? new Date(selectedMedia.dateTaken).toLocaleDateString('pt-BR') : ''}
              </p>
            </div>
            <button
              onClick={() => setSelectedMedia(null)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <Navigation className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}