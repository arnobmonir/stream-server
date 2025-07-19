import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MediaList from './pages/MediaList';
import Upload from './pages/Upload';
import Player from './pages/Player';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminAuditLog from './pages/AdminAuditLog';
import { AppBar, Toolbar, Button, Container, Typography } from '@mui/material';
import api from './api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(null);

  useEffect(() => {
    async function fetchRole() {
      if (token) {
        try {
          const res = await api.get('/me');
          setRole(res.data.role);
        } catch {
          setRole(null);
        }
      } else {
        setRole(null);
      }
    }
    fetchRole();
  }, [token]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Media Server</Typography>
          {token ? (
            <>
              <Button color="inherit" component={Link} to="/">Media List</Button>
              <Button color="inherit" component={Link} to="/upload">Upload</Button>
              <Button color="inherit" component={Link} to="/profile">Profile</Button>
              {role === 'admin' && <Button color="inherit" component={Link} to="/admin">Admin</Button>}
              {role === 'admin' && <Button color="inherit" component={Link} to="/admin-audit">Audit Logs</Button>}
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/register">Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={token ? <Upload /> : <Navigate to="/login" replace />} />
          <Route path="/player/:id" element={token ? <Player /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={token && role === 'admin' ? <Admin /> : <Navigate to="/login" replace />} />
          <Route path="/admin-audit" element={token && role === 'admin' ? <AdminAuditLog /> : <Navigate to="/login" replace />} />
          <Route
            path="/"
            element={token ? <MediaList /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
