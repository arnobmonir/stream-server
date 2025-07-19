import React, { useEffect, useState } from 'react';
import api from '../api';
import { Box, Typography, TextField, Button, Stack } from '@mui/material';
import { useNotification } from '../NotificationProvider';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const notify = useNotification();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await api.get('/me');
        setUser(res.data);
      } catch (err) {
        notify('Failed to load user info', 'error');
      }
    }
    fetchUser();
  }, [notify]);

  // Optional: handle password change (requires backend endpoint)
  /*
  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/change-password', { password });
      notify('Password changed successfully!', 'success');
      setPassword('');
    } catch (err) {
      notify('Failed to change password', 'error');
    }
  };
  */

  return (
    <Box maxWidth={400} mx="auto" p={3}>
      <Typography variant="h5" gutterBottom>Profile</Typography>
      {user && (
        <Box mb={3}>
          <Typography>Username: <b>{user.username}</b></Typography>
        </Box>
      )}
      {/* Password change form (optional, requires backend support)
      <form onSubmit={handleChangePassword}>
        <Stack spacing={2}>
          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" color="primary">Change Password</Button>
        </Stack>
      </form>
      */}
    </Box>
  );
} 