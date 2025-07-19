import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, MenuItem, Select, Stack, Button
} from '@mui/material';
import { useNotification } from '../NotificationProvider';

const ACTIONS = [
  'register', 'login', 'approve_user', 'upload_media', 'edit_media', 'delete_media'
];
const TARGET_TYPES = ['user', 'media'];

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [loading, setLoading] = useState(false);
  const notify = useNotification();

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = {};
      if (user) params.user = user;
      if (action) params.action = action;
      if (targetType) params.target_type = targetType;
      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data);
    } catch (err) {
      notify('Failed to fetch audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  return (
    <Box maxWidth={1000} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>Audit Logs</Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <TextField label="User" value={user} onChange={e => setUser(e.target.value)} size="small" />
        <Select
          value={action}
          onChange={e => setAction(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Actions</MenuItem>
          {ACTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </Select>
        <Select
          value={targetType}
          onChange={e => setTargetType(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Types</MenuItem>
          {TARGET_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </Select>
        <Button variant="contained" onClick={fetchLogs}>Filter</Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Target Type</TableCell>
              <TableCell>Target ID</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow><TableCell colSpan={6}>No logs found</TableCell></TableRow>
            ) : logs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.username}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.target_type}</TableCell>
                <TableCell>{log.target_id}</TableCell>
                <TableCell>{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 