
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Add a new function for formatting time from seconds
export function formatTimeFromSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
