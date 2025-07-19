import React, { useState } from 'react';
import api from '../api';
import { Box, Typography, TextField, Button, Stack, LinearProgress } from '@mui/material';
import { useNotification } from '../NotificationProvider';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const notify = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProgress(0);
    setUploading(false);
    if (!file) {
      notify('Please select a file', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    if (genre) formData.append('genre', genre);
    if (tags) formData.append('tags', tags.split(',').map(t => t.trim()));
    setUploading(true);
    try {
      await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      notify('Upload successful!', 'success');
      setFile(null);
      setGenre('');
      setTags('');
    } catch (err) {
      notify('Upload failed', 'error');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Box maxWidth={400} mx="auto" p={3}>
      <Typography variant="h5" gutterBottom>Upload Media</Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Button variant="contained" component="label">
            {file ? file.name : 'Select File'}
            <input type="file" hidden onChange={e => setFile(e.target.files[0])} />
          </Button>
          <TextField
            label="Genre"
            value={genre}
            onChange={e => setGenre(e.target.value)}
            fullWidth
          />
          <TextField
            label="Tags (comma separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
            fullWidth
          />
          <Button type="submit" variant="contained" color="primary" disabled={uploading}>Upload</Button>
          {uploading && <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />}
        </Stack>
      </form>
    </Box>
  );
} 