import React, { useState } from 'react';
import api from '../api';
import { Box, Typography, TextField, Button, Stack } from '@mui/material';
import { useNotification } from '../NotificationProvider';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const notify = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/register', { username, password });
      notify(res.data.detail || 'Registration successful! You can now log in.', 'success');
      setUsername('');
      setPassword('');
    } catch (err) {
      let msg = 'Registration failed';
      if (err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      notify(msg, 'error');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" p={3}>
      <Typography variant="h5" gutterBottom>Register</Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" color="primary">Register</Button>
        </Stack>
      </form>
    </Box>
  );
} 