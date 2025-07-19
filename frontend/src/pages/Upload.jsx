import React, { useState } from 'react';
import api from '../api';
import { Box, Typography, TextField, Button, Stack, LinearProgress, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { useNotification } from '../NotificationProvider';

const QUALITY_OPTIONS = [
  { label: 'Best', value: 'best' },
  { label: '720p', value: 'best[height<=720]' },
  { label: '480p', value: 'best[height<=480]' },
  { label: '360p', value: 'best[height<=360]' },
  { label: 'Audio only', value: 'bestaudio' },
];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [quality, setQuality] = useState('best');
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

  const handleUrlDownload = async (e) => {
    e.preventDefault();
    if (!videoUrl) {
      notify('Please enter a video URL', 'error');
      return;
    }
    setDownloading(true);
    try {
      await api.post('/media/download', {
        url: videoUrl,
        genre,
        tags: tags.split(',').map(t => t.trim()),
        quality,
      });
      notify('Video download started! It will appear in your library soon.', 'success');
      setVideoUrl('');
      setGenre('');
      setTags('');
    } catch (err) {
      notify('Video download failed', 'error');
    } finally {
      setDownloading(false);
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
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Or Add by Video URL</Typography>
        <form onSubmit={handleUrlDownload}>
          <Stack spacing={2}>
            <TextField
              label="Video URL (YouTube, direct MP4, etc.)"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="quality-label">Quality</InputLabel>
              <Select
                labelId="quality-label"
                value={quality}
                label="Quality"
                onChange={e => setQuality(e.target.value)}
              >
                {QUALITY_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" color="secondary" disabled={downloading}>
              Download Video
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
} 