import { useState, useEffect, useRef } from 'react';
import { getFileUrl } from '../utils/mediaStore';

export function useMediaSrc(mediaUrl: string, fileKey?: string): string {
  const [resolvedUrl, setResolvedUrl] = useState(mediaUrl);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fileKey) {
      setResolvedUrl(mediaUrl);
      return;
    }

    let cancelled = false;
    getFileUrl(fileKey).then(url => {
      if (cancelled) return;
      if (url) {
        // Revoke previous blob URL
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        blobRef.current = url;
        setResolvedUrl(url);
      } else {
        setResolvedUrl(mediaUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mediaUrl, fileKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  return resolvedUrl;
}
