import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&\s]+)/;
  const match = url.match(regex);
  return match ?match[1] : null;
}

export function isYouTubeShort(url: string): boolean {
  return url.includes('/shorts/');
}

export function getYouTubeEmbedUrl(videoId: string, isShort: boolean = false): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}
