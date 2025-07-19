import React, { useState } from 'react';
import api from '../api';
import { Box, Typography, TextField, Button, Stack, Card, CardContent, Avatar } from '@mui/material';
import { useNotification } from '../NotificationProvider';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

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
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
      <Card sx={{ maxWidth: 400, width: '100%', p: 2, boxShadow: 6, borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <LockOutlinedIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom>Sign Up</Typography>
          </Box>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" color="primary" size="large" fullWidth sx={{ mt: 1 }}>
                Register
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
} 