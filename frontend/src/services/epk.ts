import { apiService } from './api';
import type { AudioContent, VideoContent } from '../types';

export interface EpkImage {
  id: string;
  url: string;
  alt: string;
  isMain: boolean;
}

export interface EpkContact {
  email: string;
  phone: string;
  location: string;
  note: string;
}

export interface EpkSong {
  id: string;
  title: string;
  artist?: string;
}

export interface EpkSongInput {
  title: string;
  artist: string;
}

export interface EpkKit {
  bio: string;
  contact: EpkContact;
  images: EpkImage[];
  songs: EpkSong[];
  videos: VideoContent[];
  audio: AudioContent[];
}

export interface EpkProfileInput {
  bio: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  contactNote: string;
}

interface EpkResponse {
  data: EpkKit;
}

export const emptyEpk = (): EpkKit => ({
  bio: '',
  contact: { email: '', phone: '', location: '', note: '' },
  images: [],
  songs: [],
  videos: [],
  audio: [],
});

export const epkService = {
  async get(): Promise<EpkKit> {
    const response = await apiService.get<EpkResponse>('/epk');
    return response.data;
  },

  songListUrl(): string {
    return apiService.endpoint('/epk/song-list');
  },

  async saveProfile(profile: EpkProfileInput): Promise<EpkKit> {
    const response = await apiService.put<EpkResponse>('/epk', profile);
    return response.data;
  },

  async saveSongs(songs: EpkSongInput[]): Promise<EpkKit> {
    const response = await apiService.put<EpkResponse>('/epk/songs', { songs });
    return response.data;
  },

  async uploadImages(files: File[]): Promise<EpkKit> {
    const body = new FormData();
    files.forEach((file) => body.append('images[]', file));
    const response = await apiService.upload<EpkResponse>('/epk/images', body);
    return response.data;
  },

  async makeMain(id: string): Promise<EpkKit> {
    const response = await apiService.post<EpkResponse>(`/epk/images/${id}/main`, {});
    return response.data;
  },

  async deleteImage(id: string): Promise<EpkKit> {
    const response = await apiService.delete<EpkResponse>(`/epk/images/${id}`);
    return response.data;
  },
};
