import React, { useEffect, useState } from 'react';
import api from '../api';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Select, MenuItem, Card, CardContent, CardMedia, Button, Grid, Alert, Skeleton } from '@mui/material';

function getMediaType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (["mp4", "mkv", "mov"].includes(ext)) return "video";
  if (["mp3", "aac", "flac"].includes(ext)) return "audio";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "image";
  return "other";
}

export default function Player() {
  const { id } = useParams();
  const [media, setMedia] = useState(null);
  const [error, setError] = useState('');
  const [quality, setQuality] = useState('original');
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedia() {
      setLoading(true);
      try {
        const res = await api.get('/media');
        const item = res.data.find(m => m.id === parseInt(id));
        setMedia(item);
        setRelated(res.data.filter(m => m.id !== parseInt(id) && (m.genre === item.genre || m.tags.some(t => item.tags.includes(t)))));
      } catch (err) {
        setError('Failed to load media');
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (loading || !media) return <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mt: 4 }} />;

  const mediaType = getMediaType(media.filename);
  let src = `/media/stream/${media.id}`;
  if (quality === 'low' && (mediaType === 'video' || mediaType === 'audio')) {
    src += '?quality=low';
  }

  return (
    <Box maxWidth={900} mx="auto" p={3}>
      <Button component={Link} to="/" variant="outlined" sx={{ mb: 2 }}>&larr; Back to Library</Button>
      <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 4, mb: 4 }}>
        <Box p={3}>
          <Typography variant="h4" fontWeight={700} mb={2}>{media.filename}</Typography>
          {(mediaType === 'video') && (
            <Box>
              <Select value={quality} onChange={e => setQuality(e.target.value)} sx={{ mb: 2 }}>
                <MenuItem value="original">Original</MenuItem>
                <MenuItem value="low">Low Quality</MenuItem>
              </Select>
              <Box sx={{ bgcolor: '#000', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
                <video src={src} controls style={{ width: '100%' }} />
              </Box>
            </Box>
          )}
          {(mediaType === 'audio') && (
            <Box>
              <Select value={quality} onChange={e => setQuality(e.target.value)} sx={{ mb: 2 }}>
                <MenuItem value="original">Original</MenuItem>
                <MenuItem value="low">Low Quality</MenuItem>
              </Select>
              <Box sx={{ bgcolor: '#111', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
                <audio src={src} controls style={{ width: '100%' }} />
              </Box>
            </Box>
          )}
          {(mediaType === 'image') && (
            <CardMedia component="img" image={src} alt={media.filename} sx={{ maxWidth: '100%', borderRadius: 2, mb: 2 }} />
          )}
          {(mediaType === 'other') && (
            <a href={src} target="_blank" rel="noopener noreferrer">Download</a>
          )}
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>Genre: {media.genre || '-'}</Typography>
            <Typography variant="body2" color="text.secondary">Tags: {media.tags.join(', ') || '-'}</Typography>
          </CardContent>
        </Box>
      </Card>
      {related.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" mb={2}>Related Media</Typography>
          <Grid container spacing={2}>
            {related.slice(0, 4).map(item => (
              <Grid item xs={12} sm={6} md={3} key={item.id}>
                <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2 }}>
                  {getMediaType(item.filename) === 'image' ? (
                    <CardMedia component="img" height="120" image={`/media/stream/${item.id}`} alt={item.filename} sx={{ objectFit: 'cover' }} />
                  ) : (
                    <Box height={120} display="flex" alignItems="center" justifyContent="center" bgcolor="#222">
                      <Typography variant="h3">{getMediaType(item.filename).toUpperCase()}</Typography>
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="subtitle2" noWrap>{item.filename}</Typography>
                  </CardContent>
                  <Button component={Link} to={`/player/${item.id}`} variant="contained" color="primary" size="small" fullWidth>
                    View
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
} 