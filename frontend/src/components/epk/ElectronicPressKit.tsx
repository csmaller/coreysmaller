import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Toast } from '../Toast';
import { emptyEpk, epkService, type EpkKit, type EpkSong } from '../../services/epk';
import { videoEmbed } from '../../utils/videoEmbed';

function soundCloudSrc(url: string) {
  const params = new URLSearchParams({
    url,
    color: '#ff4a1c',
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'true',
    show_reposts: 'false',
    show_teaser: 'false',
    show_artwork: 'false',
    visual: 'false',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

function songLabel(song: EpkSong) {
  return song.artist ? `${song.title} — ${song.artist}` : song.title;
}

export const ElectronicPressKit: React.FC = () => {
  const { user } = useAuthContext();
  const canEdit = user?.role === 'admin';
  const [kit, setKit] = useState<EpkKit>(emptyEpk());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftArtist, setDraftArtist] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    epkService.get()
      .then((next) => {
        if (active) setKit(next);
      })
      .catch(() => {
        if (active) setKit(emptyEpk());
      });
    return () => {
      active = false;
    };
  }, []);

  const startEdit = (song: EpkSong) => {
    setEditingId(song.id);
    setDraftTitle(song.title);
    setDraftArtist(song.artist ?? '');
    setToast(null);
  };

  const saveEdit = async () => {
    const title = draftTitle.trim();
    if (!editingId || !title) {
      setToast({ kind: 'error', message: 'A song needs a title.' });
      return;
    }
    try {
      setSaving(true);
      setToast(null);
      const next = await epkService.saveSongs(kit.songs.map((song) => (
        song.id === editingId
          ? { title, artist: draftArtist.trim() }
          : { title: song.title, artist: song.artist ?? '' }
      )));
      setKit(next);
      setEditingId(null);
      setToast({ kind: 'success', message: 'Song saved.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save the song.' });
    } finally {
      setSaving(false);
    }
  };

  const main = kit.images.find((image) => image.isMain) ?? kit.images[0];
  const others = kit.images.filter((image) => image !== main);
  const contact = kit.contact;
  const hasContact = Boolean(contact.email || contact.phone || contact.location || contact.note);

  return (
    <section id="epk" className="container section" aria-labelledby="epk-title">
      <div className="epk-heading">
        <div className="section-head">
          <h2 id="epk-title" className="display section-title">Electronic Press Kit</h2>
        </div>
        <a className="btn" href={epkService.songListUrl()}>Download song list</a>
      </div>

      <div className="epk-grid">
        <div>
          {main ? (
            <img className="epk-photo" src={main.url} alt={main.alt || 'Corey Smaller'} />
          ) : (
            <div className="epk-photo epk-photo-empty">Photo coming soon.</div>
          )}
        </div>
        <div className="about-copy">
          {kit.bio ? <p className="epk-bio">{kit.bio}</p> : <p>Bio coming soon.</p>}
        </div>
        {others.length > 0 ? (
          <div className="epk-extras">
            {others.map((image) => (
              <img key={image.id} src={image.url} alt={image.alt || 'Corey Smaller'} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="epk-block">
        <h3 className="display epk-subhead">Song list</h3>
        {kit.songs.length > 0 ? (
          <>
            <ol className="epk-songs">
              {kit.songs.map((song) => (
                <li key={song.id} className={editingId === song.id ? 'is-editing' : undefined}>
                  {canEdit && editingId === song.id ? (
                    <form
                      className="epk-song-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveEdit();
                      }}
                    >
                      <label className="sr-only" htmlFor={`edit-title-${song.id}`}>Title</label>
                      <input
                        id={`edit-title-${song.id}`}
                        className="field"
                        value={draftTitle}
                        aria-label="Song title"
                        onChange={(event) => setDraftTitle(event.target.value)}
                      />
                      <label className="sr-only" htmlFor={`edit-artist-${song.id}`}>Artist</label>
                      <input
                        id={`edit-artist-${song.id}`}
                        className="field"
                        value={draftArtist}
                        aria-label="Artist"
                        onChange={(event) => setDraftArtist(event.target.value)}
                      />
                      <button type="submit" className="epk-song-save" disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" className="epk-song-cancel" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : canEdit ? (
                    <button type="button" className="epk-song-edit" onClick={() => startEdit(song)}>
                      {songLabel(song)}
                    </button>
                  ) : (
                    songLabel(song)
                  )}
                </li>
              ))}
            </ol>
            <a className="btn" href={epkService.songListUrl()}>Download song list</a>
          </>
        ) : (
          <p>Song list coming soon.</p>
        )}
      </div>

      {kit.videos.length > 0 ? (
        <div className="epk-block">
          <h3 className="display epk-subhead">Video</h3>
          <div className="epk-media">
            {kit.videos.map((video) => {
              const embed = videoEmbed(video.youtubeUrl);
              return (
                <figure key={video.id}>
                  <figcaption>{video.title}</figcaption>
                  {embed ? (
                    <iframe
                      className="epk-frame"
                      src={embed.src}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : null}
                </figure>
              );
            })}
          </div>
        </div>
      ) : null}

      {kit.audio.length > 0 ? (
        <div className="epk-block">
          <h3 className="display epk-subhead">Audio</h3>
          <div className="epk-media">
            {kit.audio.map((track) => (
              <figure key={track.id}>
                <figcaption>
                  <a href={track.soundcloudUrl} target="_blank" rel="noreferrer">{track.title}</a>
                </figcaption>
                <iframe
                  className="epk-audio"
                  title={track.title}
                  src={soundCloudSrc(track.soundcloudUrl)}
                  allow="autoplay"
                />
              </figure>
            ))}
          </div>
        </div>
      ) : null}

      {hasContact ? (
        <div className="epk-block">
          <h3 className="display epk-subhead">Contact</h3>
          <div className="about-copy">
            {contact.location ? <p>{contact.location}</p> : null}
            {contact.email ? <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p> : null}
            {contact.phone ? <p><a href={`tel:${contact.phone}`}>{contact.phone}</a></p> : null}
            {contact.note ? <p className="epk-bio">{contact.note}</p> : null}
          </div>
        </div>
      ) : null}
      {toast ? <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} /> : null}
    </section>
  );
};
