// src/types/index.ts

// ── Image object returned by the API 
export interface SongImage {
  quality: string;   
  url?: string;      
  link?: string;     
}

// ── Audio URL object returned by the API 
export interface DownloadUrl {
  quality: string;   
  url?: string;      
  link?: string;     
}

// ── A single artist 
export interface Artist {
  id: string;
  name: string;
}

// ── Album info attached to a song 
export interface Album {
  id: string;
  name: string;
  url?: string;
}

// ── The main Song object — every song in the app uses this shape 
export interface Song {
  id: string;
  name: string;
  duration: number | string; // API sometimes returns number, sometimes string
  language?: string;
  year?: string;
  album?: Album;
  artists?: {
    primary: Artist[];       // used in Songs API
  };
  primaryArtists?: string;   // used in Search API — comma separated string
  image: SongImage[];
  downloadUrl: DownloadUrl[];
  playCount?: string;
  hasLyrics?: string;
  url?: string;
}

// ── Repeat mode — three possible values 
export type RepeatMode = 'none' | 'one' | 'all';

// ── Navigation type definitions 
export type RootStackParamList = {
  MainTabs: undefined;       
  Player: undefined;         
  SearchScreen: undefined;   
};

export type TabParamList = {
  Home: undefined;
  Favorites: undefined;
  Playlists: undefined;
  Settings: undefined;
};