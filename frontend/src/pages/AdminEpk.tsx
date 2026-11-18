import React, { useEffect, useState } from 'react';
import { AdminNavigation } from '../components/admin';
import { Toast } from '../components/Toast';
import { emptyEpk, epkService, type EpkKit } from '../services/epk';

type SongDraft = { title: string; artist: string; selected: boolean };

export const AdminEpk: React.FC = () => {
  const [kit, setKit] = useState<EpkKit>(emptyEpk());
  const [bio, setBio] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [location, setLocation] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [songs, setSongs] = useState<SongDraft[]>([{ title: '', artist: '', selected: false }]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSongs, setSavingSongs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    epkService.get()
      .then((next) => {
        if (!active) return;
        applyKit(next);
      })
      .catch(() => {
        if (active) setToast({ kind: 'error', message: 'Could not load the press kit.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const applyKit = (next: EpkKit) => {
    setKit(next);
    setBio(next.bio);
    setContactEmail(next.contact.email);
    setContactPhone(next.contact.phone);
    setLocation(next.contact.location);
    setContactNote(next.contact.note);
    setSongs(next.songs.length > 0
      ? next.songs.map((song) => ({ title: song.title, artist: song.artist ?? '', selected: false }))
      : [{ title: '', artist: '', selected: false }]);
  };

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      setToast(null);
      const next = await epkService.saveProfile({ bio, contactEmail, contactPhone, location, contactNote });
      applyKit(next);
      setToast({ kind: 'success', message: 'Press kit saved.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save the press kit.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSongs = async () => {
    try {
      setSavingSongs(true);
      setToast(null);
      const nextSongs = songs
        .map((song) => ({ title: song.title.trim(), artist: song.artist.trim() }))
        .filter((song) => song.title);
      const next = await epkService.saveSongs(nextSongs);
      applyKit(next);
      setToast({ kind: 'success', message: 'Song list saved.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save the song list.' });
    } finally {
      setSavingSongs(false);
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setToast(null);
      const next = await epkService.uploadImages(Array.from(files));
      applyKit(next);
      setToast({ kind: 'success', message: 'Photos uploaded.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Could not upload the photos.' });
    } finally {
      setUploading(false);
    }
  };

  const makeMain = async (id: string) => {
    try {
      setToast(null);
      applyKit(await epkService.makeMain(id));
      setToast({ kind: 'success', message: 'Main photo updated.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Could not update the main photo.' });
    }
  };

  const removeImage = async (id: string) => {
    try {
      setToast(null);
      applyKit(await epkService.deleteImage(id));
      setToast({ kind: 'success', message: 'Photo removed.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Could not remove the photo.' });
    }
  };

  const deleteSelected = async () => {
    const remaining = songs.filter((song) => !song.selected);
    if (remaining.length === songs.length) return;
    try {
      setSavingSongs(true);
      setToast(null);
      const next = await epkService.saveSongs(
        remaining
          .map((song) => ({ title: song.title.trim(), artist: song.artist.trim() }))
          .filter((song) => song.title)
      );
      applyKit(next);
      setToast({ kind: 'success', message: 'Selected songs deleted.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Could not delete the selected songs.' });
    } finally {
      setSavingSongs(false);
    }
  };

  const moveSong = (index: number, direction: -1 | 1) => {
    setSongs((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Electronic Press Kit</h1>
          <p className="text-gray-600 mt-2">Photo, bio, song list, and contact details for the home page.</p>
        </div>

        <section className="bg-white shadow-sm border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Bio and contact</h2>
          <label className="block text-sm font-medium text-gray-700" htmlFor="epk-bio">Bio</label>
          <textarea
            id="epk-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={8}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <label className="block text-sm font-medium text-gray-700" htmlFor="epk-email">Email</label>
          <input id="epk-email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          <label className="block text-sm font-medium text-gray-700" htmlFor="epk-phone">Phone</label>
          <input id="epk-phone" type="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          <label className="block text-sm font-medium text-gray-700" htmlFor="epk-location">Location</label>
          <input id="epk-location" value={location} onChange={(event) => setLocation(event.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          <label className="block text-sm font-medium text-gray-700" htmlFor="epk-note">Note</label>
          <textarea id="epk-note" value={contactNote} onChange={(event) => setContactNote(event.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          <button type="button" onClick={saveProfile} disabled={savingProfile} className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-60">
            {savingProfile ? 'Saving...' : 'Save bio and contact'}
          </button>
        </section>

        <section className="bg-white shadow-sm border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Photos</h2>
          <p className="text-sm text-gray-600">Upload one or more images. One photo is the main image on the press kit.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {kit.images.map((image) => (
              <figure key={image.id} className="space-y-2">
                <img src={image.url} alt={image.alt} className="w-full h-40 object-cover rounded-md bg-gray-100" />
                <figcaption className="text-sm text-gray-700">{image.isMain ? 'Main photo' : 'Additional photo'}</figcaption>
                <div className="flex gap-3">
                  {image.isMain ? null : (
                    <button type="button" className="text-sm text-blue-700" onClick={() => makeMain(image.id)}>Make main</button>
                  )}
                  <button type="button" className="text-sm text-red-700" onClick={() => removeImage(image.id)}>Delete</button>
                </div>
              </figure>
            ))}
          </div>
          <label className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer w-fit">
            {uploading ? 'Uploading...' : kit.images.length > 0 ? 'Add another photo' : 'Add photo'}
            <input
              aria-label="Upload photos"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={uploading}
              className="sr-only"
              onChange={(event) => {
                uploadImages(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
        </section>

        <section className="bg-white shadow-sm border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Song list</h2>
          {songs.map((song, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={song.selected}
                aria-label={`Select ${song.title || `song ${index + 1}`}`}
                onChange={(event) => setSongs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, selected: event.target.checked } : item))}
              />
              <label className="sr-only" htmlFor={`epk-song-${index}`}>Song {index + 1}</label>
              <input
                id={`epk-song-${index}`}
                value={song.title}
                aria-label={`Song ${index + 1} title`}
                onChange={(event) => setSongs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
              <label className="sr-only" htmlFor={`epk-artist-${index}`}>Artist {index + 1}</label>
              <input
                id={`epk-artist-${index}`}
                value={song.artist}
                aria-label={`Song ${index + 1} artist`}
                onChange={(event) => setSongs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, artist: event.target.value } : item))}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
              <button type="button" className="text-sm text-gray-700" onClick={() => moveSong(index, -1)} aria-label={`Move song ${index + 1} up`}>Up</button>
              <button type="button" className="text-sm text-gray-700" onClick={() => moveSong(index, 1)} aria-label={`Move song ${index + 1} down`}>Down</button>
              <button type="button" className="text-sm text-red-700" onClick={() => setSongs((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove song ${index + 1}`}>Remove</button>
            </div>
          ))}
          <div className="flex gap-3">
            <button type="button" className="text-sm text-blue-700" onClick={() => setSongs((current) => [...current, { title: '', artist: '', selected: false }])}>Add song</button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={savingSongs || !songs.some((song) => song.selected)}
              className="text-sm text-red-700 disabled:opacity-40"
            >
              Delete selected
            </button>
            <button type="button" onClick={saveSongs} disabled={savingSongs} className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-60">
              {savingSongs ? 'Saving...' : 'Save song list'}
            </button>
          </div>
        </section>
      </div>
      {toast ? <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
};
