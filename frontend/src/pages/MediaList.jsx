import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, InputAdornment, Select, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function MediaList() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');

  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await api.get('/media');
        setMedia(res.data);
      } catch (err) {
        setError('Failed to fetch media');
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, []);

  // Get unique genres for filter
  const genres = Array.from(new Set(media.map(m => m.genre).filter(Boolean)));

  // Filtered media
  const filtered = media.filter(item =>
    (!search || item.filename.toLowerCase().includes(search.toLowerCase())) &&
    (!genre || item.genre === genre)
  );

  return (
    <Box maxWidth={900} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>Media Library</Typography>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Select
          value={genre}
          onChange={e => setGenre(e.target.value)}
          displayEmpty
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All Genres</MenuItem>
          {genres.map(g => (
            <MenuItem key={g} value={g}>{g}</MenuItem>
          ))}
        </Select>
      </Box>
      {loading ? (
        <Typography>Loading media...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filtered.length === 0 ? (
        <Typography>No media found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Genre</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.filename}</TableCell>
                  <TableCell>{item.genre || '-'}</TableCell>
                  <TableCell>{item.tags.join(', ')}</TableCell>
                  <TableCell>
                    <Link to={`/player/${item.id}`}>Play/Stream</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
} 