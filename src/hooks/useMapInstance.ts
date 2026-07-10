import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { config } from '../config/env';

export function useMapInstance() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = config.mapboxToken;
    const instance = new mapboxgl.Map({
      container: containerRef.current,
      style: config.mapboxStyleUrl,
      center: [config.defaultCenter.lng, config.defaultCenter.lat],
      zoom: config.defaultZoom,
      pitch: 0,
      bearing: 0,
      dragRotate: false,
      touchPitch: false,
    });

    const onMoveStart = () => setIsInteracting(true);
    const onMoveEnd = () => setIsInteracting(false);
    instance.on('movestart', onMoveStart);
    instance.on('moveend', onMoveEnd);

    instance.on('load', () => {
      mapRef.current = instance;
      setMap(instance);
    });

    return () => {
      instance.off('movestart', onMoveStart);
      instance.off('moveend', onMoveEnd);
      instance.remove();
      mapRef.current = null;
    };
  }, []);

  return { containerRef, map, isInteracting };
}
