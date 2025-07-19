import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, MenuItem, Select, Stack, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useNotification } from '../NotificationProvider';

export default function Admin() {
  const [unapproved, setUnapproved] = useState([]);
  const [media, setMedia] = useState([]);
  const [editMedia, setEditMedia] = useState(null);
  const [editGenre, setEditGenre] = useState('');
  const [editTags, setEditTags] = useState('');
  const notify = useNotification();

  useEffect(() => {
    fetchUnapproved();
    fetchMedia();
  }, []);

  async function fetchUnapproved() {
    try {
      const res = await api.get('/admin/users/unapproved');
      setUnapproved(res.data);
    } catch (err) {
      notify('Failed to fetch unapproved users', 'error');
    }
  }

  async function fetchMedia() {
    try {
      const res = await api.get('/media');
      setMedia(res.data);
    } catch (err) {
      notify('Failed to fetch media', 'error');
    }
  }

  async function handleApprove(userId) {
    try {
      await api.post(`/admin/users/approve/${userId}`);
      notify('User approved!', 'success');
      fetchUnapproved();
    } catch (err) {
      notify('Failed to approve user', 'error');
    }
  }

  async function handleDelete(mediaId) {
    try {
      await api.delete(`/media/${mediaId}`);
      notify('Media deleted!', 'success');
      fetchMedia();
    } catch (err) {
      notify('Failed to delete media', 'error');
    }
  }

  function openEditDialog(item) {
    setEditMedia(item);
    setEditGenre(item.genre || '');
    setEditTags(item.tags.join(', '));
  }

  function closeEditDialog() {
    setEditMedia(null);
    setEditGenre('');
    setEditTags('');
  }

  async function handleEditSave() {
    try {
      await api.put(`/media/${editMedia.id}`, {
        genre: editGenre,
        tags: editTags.split(',').map(t => t.trim())
      });
      notify('Media updated!', 'success');
      fetchMedia();
      closeEditDialog();
    } catch (err) {
      notify('Failed to update media', 'error');
    }
  }

  return (
    <Box maxWidth={900} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>Admin Panel</Typography>
      <Box mb={4}>
        <Typography variant="h6">Unapproved Users</Typography>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unapproved.length === 0 ? (
                <TableRow><TableCell colSpan={2}>No unapproved users</TableCell></TableRow>
              ) : unapproved.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <Button variant="contained" color="primary" onClick={() => handleApprove(u.id)}>Approve</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box>
        <Typography variant="h6">Media Management</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Genre</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {media.length === 0 ? (
                <TableRow><TableCell colSpan={4}>No media</TableCell></TableRow>
              ) : media.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.filename}</TableCell>
                  <TableCell>{item.genre || '-'}</TableCell>
                  <TableCell>{item.tags.join(', ')}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" color="primary" onClick={() => openEditDialog(item)}>Edit</Button>
                      <Button variant="outlined" color="error" onClick={() => handleDelete(item.id)}>Delete</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog open={!!editMedia} onClose={closeEditDialog}>
        <DialogTitle>Edit Media</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Genre"
              value={editGenre}
              onChange={e => setEditGenre(e.target.value)}
              fullWidth
            />
            <TextField
              label="Tags (comma separated)"
              value={editTags}
              onChange={e => setEditTags(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 