import React, { useState } from 'react';
import api, { setAuthToken } from '../api';
import { Box, Typography, TextField, Button, Stack } from '@mui/material';
import { useNotification } from '../NotificationProvider';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const notify = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', new URLSearchParams({ username, password }));
      setAuthToken(res.data.access_token);
      onLogin(res.data.access_token);
      notify('Login successful!', 'success');
    } catch (err) {
      let msg = 'Login failed';
      if (err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      notify(msg, 'error');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" p={3}>
      <Typography variant="h5" gutterBottom>Login</Typography>
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
          <Button type="submit" variant="contained" color="primary">Login</Button>
        </Stack>
      </form>
    </Box>
  );
} 