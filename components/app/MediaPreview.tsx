'use client';

export function MediaPreview({ media, className }: { media: any; className?: string }) {
  return media.mediaType === 'video' || media.mimeType?.startsWith('video/')
    ? <video src={media.fileUrl} controls preload="metadata" className={className} aria-label={media.caption || media.fileName || 'Business video'} />
    : <img src={media.fileUrl} alt={media.caption || media.category || 'Business photo'} loading="lazy" className={className} />;
}
