
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Format time from seconds to display as minutes:seconds
export function formatTimeFromSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Format duration in seconds to a human-readable string
export function formatDuration(durationInSeconds: number): string {
  if (!durationInSeconds && durationInSeconds !== 0) return "0:00";
  
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  
  if (minutes < 60) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Add a formatDate function
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

// Add the cn utility function used by UI components
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
