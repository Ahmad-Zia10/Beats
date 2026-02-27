// src/services/api.ts
import axios from 'axios';
import { Song } from '../types';

const BASE_URL = 'https://saavn.sumit.co';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, 
});


export const searchSongs = async (
  query: string,
  page: number = 1,
  limit: number = 20
) => {
  const response = await api.get('/api/search/songs', {
    params: { query, page, limit },
  });
  return response.data.data;
  // returns: { results: Song[], total: number, start: number }
};


// GET SONG SUGGESTIONS
// GET /api/songs/{id}/suggestions
// Used to auto-fill the queue when a song starts playing
export const getSongSuggestions = async (id: string): Promise<Song[]> => {
  const response = await api.get(`/api/songs/${id}/suggestions`);
  return response.data.data;
};

// HELPER — Get the best available audio URL from a song
// Priority: 320kbps → 160kbps → 96kbps → 48kbps → 12kbps

export const getBestAudioUrl = (song: Song): string => {
  const urls = song.downloadUrl;
  if (!urls || urls.length === 0) return '';

  const priority = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];

  for (const quality of priority) {
    const found = urls.find((u) => u.quality === quality);
    if (found) {
      // handle both 'url' and 'link' field names
      return found.url || found.link || '';
    }
  }

  // fallback — return whatever is last in the array
  const last = urls[urls.length - 1];
  return last.url || last.link || '';
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Get the best available image URL from a song
// ─────────────────────────────────────────────────────────────────────────────
export const getBestImageUrl = (
  song: Song,
  preferredQuality: string = '500x500'
): string => {
  const images = song.image;
  if (!images || images.length === 0) return '';

  const found = images.find(
    (img) => img.quality === preferredQuality
  );
  if (found) return found.url || found.link || '';

  // fallback — return largest available
  const last = images[images.length - 1];
  return last.url || last.link || '';
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Get duration as a number (seconds)
// API returns duration as number OR string depending on endpoint
// ─────────────────────────────────────────────────────────────────────────────
export const getSongDuration = (song: Song): number => {
  const dur = song.duration;
  if (typeof dur === 'number') return dur;
  return parseInt(dur as string, 10) || 0;
};

// HELPER — Get artist names as a single string
// Handles both API response formats

export const getSongArtists = (song: Song): string => {
  // Songs API format: artists.primary array
  if (song.artists?.primary?.length) {
    return song.artists.primary.map((a) => a.name).join(', ');
  }
  // Search API format: primaryArtists string
  return song.primaryArtists || 'Unknown Artist';
};