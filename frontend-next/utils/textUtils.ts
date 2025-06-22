/**
 * A collection of utility functions for text manipulation.
 */

/**
 * Removes timestamp markers (e.g., "0:00", "0:00:00.000") from the beginning of lines in a string.
 * This is useful for cleaning up transcripts copied from sources like YouTube.
 * @param text The input string that may contain timestamps.
 * @returns The cleaned string with timestamps removed.
 */
export function stripTimestamps(text: string): string {
  if (!text) {
    return "";
  }
  // This regex matches timestamps at the beginning of lines (^)
  // It handles formats like M:SS, H:MM:SS, and optional milliseconds.
  return text.replace(/^\s*(\d{1,2}:)?\d{1,2}:\d{2}\.?\d*\s*/gm, '')
    // Also remove any resulting empty lines
    .replace(/^\s*[\r\n]/gm, '');
}

/**
 * Removes <joke>...</joke> tags from a string.
 * @param text The text to process.
 * @returns The text with <joke> tags removed.
 */
export function stripJokeTags(text: string): string {
  if (!text) {
    return '';
  }
  return text.replace(/<joke>([\s\S]*?)<\/joke>/gi, '');
} 