import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Select, MenuItem, Card, CardContent, CardMedia, Button, Grid, Alert, Skeleton, CircularProgress, IconButton, Tooltip, Stack, Chip, Divider } from '@mui/material';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import { useNotification } from '../NotificationProvider';
import dayjs from 'dayjs';

function getMediaType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (["mp4", "mkv", "mov"].includes(ext)) return "video";
  if (["mp3", "aac", "flac"].includes(ext)) return "audio";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "image";
  return "other";
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function Player() {
  const { id } = useParams();
  const [media, setMedia] = useState(null);
  const [error, setError] = useState('');
  const [quality, setQuality] = useState('original');
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [hlsReady, setHlsReady] = useState(false);
  const [fileInfo, setFileInfo] = useState({ size: null, mtime: null });
  const videoRef = useRef(null);
  const plyrRef = useRef(null);
  const notify = useNotification();

  useEffect(() => {
    async function fetchMedia() {
      setLoading(true);
      try {
        const res = await api.get('/media');
        const item = res.data.find(m => m.id === parseInt(id));
        setMedia(item);
        setRelated(res.data.filter(m => m.id !== parseInt(id) && (m.genre === item.genre || m.tags.some(t => item.tags.includes(t)))));
        // Fetch file info
        if (item) {
          const statRes = await api.get(`/media/stat/${item.id}`);
          setFileInfo(statRes.data);
        }
      } catch (err) {
        setError('Failed to load media');
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, [id]);

  // HLS check and trigger
  useEffect(() => {
    if (!media) return;
    const mediaType = getMediaType(media.filename);
    if (mediaType !== 'video' || quality !== 'original') {
      setHlsReady(false);
      setProcessing(false);
      return;
    }
    let isMounted = true;
    const checkHls = async () => {
      setProcessing(true);
      try {
        // Try to fetch the playlist
        const hlsUrl = `/media/hls/${media.id}/playlist.m3u8`;
        const resp = await fetch(hlsUrl, { method: 'HEAD' });
        if (resp.ok) {
          if (isMounted) {
            setHlsReady(true);
            setProcessing(false);
          }
          return;
        }
        // If not found, trigger HLS conversion
        await api.post(`/media/hls/${media.id}/trigger`);
        // Poll every 5 seconds until ready
        const poll = setInterval(async () => {
          const pollResp = await fetch(hlsUrl, { method: 'HEAD' });
          if (pollResp.ok) {
            clearInterval(poll);
            if (isMounted) {
              setHlsReady(true);
              setProcessing(false);
            }
          }
        }, 5000);
        return () => clearInterval(poll);
      } catch (err) {
        setProcessing(false);
      }
    };
    checkHls();
    return () => { isMounted = false; };
  }, [media, quality]);

  // Plyr integration for HLS video
  useEffect(() => {
    if (!media || !hlsReady) return;
    const mediaType = getMediaType(media.filename);
    if (mediaType !== 'video') return;
    if (quality !== 'original') return;
    const hlsUrl = `/media/hls/${media.id}/playlist.m3u8`;
    if (plyrRef.current) {
      plyrRef.current.destroy();
    }
    if (Hls.isSupported()) {
      const video = videoRef.current;
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      plyrRef.current = new Plyr(video, {
        controls: [
          'play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['quality', 'speed', 'loop'],
        keyboard: { focused: true, global: true },
      });
      return () => {
        hls.destroy();
        plyrRef.current && plyrRef.current.destroy();
      };
    } else if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = hlsUrl;
      plyrRef.current = new Plyr(videoRef.current);
    }
  }, [media, quality, hlsReady]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (loading || !media) return <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mt: 4 }} />;

  const mediaType = getMediaType(media.filename);
  let src = `/media/stream/${media.id}`;
  if (quality === 'low' && (mediaType === 'video' || mediaType === 'audio')) {
    src += '?quality=low';
  }
  const hlsUrl = `/media/hls/${media.id}/playlist.m3u8`;
  const handleCopy = (url) => {
    navigator.clipboard.writeText(window.location.origin + url);
    notify('URL copied to clipboard!', 'success');
  };

  return (
    <Box maxWidth={1100} mx="auto" p={3}>
      <Button component={Link} to="/" variant="outlined" sx={{ mb: 2 }}>&larr; Back to Library</Button>
      <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 4, mb: 4 }}>
        <Box p={3}>
          <Typography variant="h4" fontWeight={700} mb={1}>{media.filename}</Typography>
          <Stack direction="row" spacing={1} mb={2} alignItems="center">
            {media.genre && <Chip label={media.genre} color="primary" />}
            {media.tags.map(tag => <Chip key={tag} label={tag} size="small" />)}
            {fileInfo.size && <Chip label={formatBytes(fileInfo.size)} size="small" />}
            {fileInfo.mtime && <Chip label={dayjs(fileInfo.mtime).format('YYYY-MM-DD HH:mm')} size="small" />}
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {(mediaType === 'video') && (
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Select value={quality} onChange={e => setQuality(e.target.value)}>
                  <MenuItem value="original">Original (HLS)</MenuItem>
                  <MenuItem value="low">Low Quality</MenuItem>
                </Select>
                <Tooltip title="Copy HLS URL">
                  <IconButton onClick={() => handleCopy(hlsUrl)} disabled={quality !== 'original'}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy Stream URL">
                  <IconButton onClick={() => handleCopy(src)} disabled={quality !== 'low'}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Original File">
                  <IconButton component="a" href={src} download>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share">
                  <IconButton onClick={() => handleCopy(window.location.href)}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Box sx={{ bgcolor: '#000', borderRadius: 2, overflow: 'hidden', mb: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {quality === 'original' ? (
                  processing ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={240}>
                      <CircularProgress color="primary" />
                      <Typography mt={2}>Processing video for streaming... Please wait.</Typography>
                    </Box>
                  ) : hlsReady ? (
                    <video ref={videoRef} controls style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />
                  ) : null
                ) : (
                  <video src={src} controls style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />
                )}
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
            <Typography variant="body2" color="text.secondary" mt={1}>Uploader: {media.uploader || 'Unknown'}</Typography>
            <Typography variant="body2" color="text.secondary">Description: (coming soon)</Typography>
          </CardContent>
        </Box>
      </Card>
      {related.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" mb={2}>Related Media</Typography>
          <Box sx={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <Grid container spacing={2} wrap="nowrap" sx={{ flexWrap: 'nowrap !important' }}>
              {related.slice(0, 8).map(item => (
                <Grid item xs={12} sm={6} md={3} key={item.id} sx={{ minWidth: 220 }}>
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
        </Box>
      )}
      <Box mt={4}>
        <Typography variant="h6" mb={1}>Comments</Typography>
        <Typography variant="body2" color="text.secondary">(Comments feature coming soon!)</Typography>
      </Box>
    </Box>
  );
} 