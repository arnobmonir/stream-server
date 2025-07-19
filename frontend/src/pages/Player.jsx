import React, { useEffect, useState } from 'react';
import api from '../api';
import { useParams } from 'react-router-dom';
import { Box, Typography, Select, MenuItem, Alert } from '@mui/material';

function getMediaType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (["mp4", "mkv", "mov"].includes(ext)) return "video";
  if (["mp3", "aac", "flac"].includes(ext)) return "audio";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  return "other";
}

export default function Player() {
  const { id } = useParams();
  const [media, setMedia] = useState(null);
  const [error, setError] = useState('');
  const [quality, setQuality] = useState('original');

  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await api.get('/media');
        const item = res.data.find(m => m.id === parseInt(id));
        setMedia(item);
      } catch (err) {
        setError('Failed to load media');
      }
    }
    fetchMedia();
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!media) return <Typography>Loading...</Typography>;

  const mediaType = getMediaType(media.filename);
  let src = `http://localhost:8000/media/stream/${media.id}`;
  if (quality === 'low' && (mediaType === 'video' || mediaType === 'audio')) {
    src += '?quality=low';
  }

  return (
    <Box maxWidth={800} mx="auto" p={3}>
      <Typography variant="h5" gutterBottom>{media.filename}</Typography>
      {(mediaType === 'video') && (
        <Box>
          <Select value={quality} onChange={e => setQuality(e.target.value)} sx={{ mb: 2 }}>
            <MenuItem value="original">Original</MenuItem>
            <MenuItem value="low">Low Quality</MenuItem>
          </Select>
          <video src={src} controls style={{ width: '100%' }} />
        </Box>
      )}
      {(mediaType === 'audio') && (
        <Box>
          <Select value={quality} onChange={e => setQuality(e.target.value)} sx={{ mb: 2 }}>
            <MenuItem value="original">Original</MenuItem>
            <MenuItem value="low">Low Quality</MenuItem>
          </Select>
          <audio src={src} controls style={{ width: '100%' }} />
        </Box>
      )}
      {(mediaType === 'image') && (
        <img src={src} alt={media.filename} style={{ maxWidth: '100%' }} />
      )}
      {(mediaType === 'other') && (
        <a href={src} target="_blank" rel="noopener noreferrer">Download</a>
      )}
    </Box>
  );
} 