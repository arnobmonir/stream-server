import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardMedia, CardContent, CardActions, Button, TextField, InputAdornment, Select, MenuItem, Skeleton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MovieIcon from '@mui/icons-material/Movie';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import ImageIcon from '@mui/icons-material/Image';

function getMediaType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (["mp4", "mkv", "mov"].includes(ext)) return "video";
  if (["mp3", "aac", "flac"].includes(ext)) return "audio";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "image";
  return "other";
}

function getMediaIcon(type) {
  if (type === 'video') return <MovieIcon fontSize="large" color="primary" />;
  if (type === 'audio') return <AudiotrackIcon fontSize="large" color="secondary" />;
  if (type === 'image') return <ImageIcon fontSize="large" color="action" />;
  return <MovieIcon fontSize="large" />;
}

export default function MediaList() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');

  useEffect(() => {
    async function fetchMedia() {
      setLoading(true);
      try {
        const res = await api.get('/media');
        setMedia(res.data);
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, []);

  const genres = Array.from(new Set(media.map(m => m.genre).filter(Boolean)));
  const filtered = media.filter(item =>
    (!search || item.filename.toLowerCase().includes(search.toLowerCase())) &&
    (!genre || item.genre === genre)
  );

  return (
    <Box maxWidth={1200} mx="auto" p={3}>
      <Typography variant="h3" fontWeight={700} mb={3} color="primary.main" textAlign="center">
        Stream Server
      </Typography>
      <Box display="flex" gap={2} mb={4} justifyContent="center">
        <TextField
          label="Search media"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <Select
          value={genre}
          onChange={e => setGenre(e.target.value)}
          displayEmpty
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All Genres</MenuItem>
          {genres.map(g => (
            <MenuItem key={g} value={g}>{g}</MenuItem>
          ))}
        </Select>
      </Box>
      <Grid container spacing={3}>
        {loading ? Array.from({ length: 8 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 3 }} />
          </Grid>
        )) : filtered.length === 0 ? (
          <Grid item xs={12}><Typography>No media found.</Typography></Grid>
        ) : filtered.map(item => {
          const type = getMediaType(item.filename);
          let thumb = null;
          if (type === 'image') {
            thumb = `http://localhost:8000/media/stream/${item.id}`;
          }
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3, transition: '0.2s', '&:hover': { boxShadow: 8, transform: 'scale(1.03)' } }}>
                {thumb ? (
                  <CardMedia component="img" height="180" image={thumb} alt={item.filename} sx={{ objectFit: 'cover' }} />
                ) : (
                  <Box height={180} display="flex" alignItems="center" justifyContent="center" bgcolor="#222">
                    {getMediaIcon(type)}
                  </Box>
                )}
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>{item.filename}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>{item.genre || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>{item.tags.join(', ')}</Typography>
                </CardContent>
                <CardActions>
                  <Button component={Link} to={`/player/${item.id}`} variant="contained" color="primary" size="small" fullWidth>
                    Play / Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
} 