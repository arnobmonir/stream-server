# Stream Server: Local Network Media Server

A full-featured, low-latency, low-bandwidth media server for your local network. Supports video, audio, and photos (including iPhone HEIC), with user authentication, admin approval, transcoding, audit logs, and a modern React + Material UI frontend.

---

## Features
- **Media Types:** Video, audio, photos (HEIC/JPEG/PNG)
- **User Authentication:** JWT-based, with admin approval required
- **Admin Panel:** Approve users, manage media, view audit logs
- **Transcoding:** On-the-fly (FFmpeg) for low-bitrate streaming
- **HEIC Support:** Converts iPhone photos to JPEG
- **Audit Logs:** Tracks all key actions (login, upload, delete, etc.)
- **Modern UI:** React + Material UI, mobile-friendly
- **Upload Progress & Notifications:** Real-time feedback for users

---

## Quick Start (Development)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd stream-server
```

### 2. Backend Setup (FastAPI)
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend Setup (React)
```bash
cd frontend
npm install
npm run dev
```
- The frontend will run on [http://localhost:5173](http://localhost:5173) by default.

### 4. Run Backend (Dev)
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
- The backend will run on [http://localhost:8000](http://localhost:8000)

---

## Deployment (Production & Raspberry Pi)

### 1. Build Frontend
```bash
cd frontend
npm run build
```
- Output is in `frontend/dist/`

### 2. Serve Frontend & Backend
- **Recommended:** Use Nginx or Caddy as a reverse proxy.
- **Backend:**
  ```bash
  uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 2
  ```
- **Frontend:**
  - Copy `frontend/dist` to your web server root (e.g., `/var/www/html/mediaserver`)

### 3. Example Nginx Config
```
server {
    listen 80;
    server_name <your-pi-ip-or-domain>;

    root /var/www/html/mediaserver;
    index index.html;

    location /media/ {
        proxy_pass http://localhost:8000/media/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location / {
        try_files $uri /index.html;
    }
}
```

### 4. Raspberry Pi Tips
- Use Raspberry Pi OS Lite or Ubuntu Server.
- Install dependencies: `sudo apt install python3 python3-venv ffmpeg nginx nodejs npm`
- Use a fast SD card or external USB for media.
- For best performance, pre-transcode large videos.

---

## Usage
- **Register:** New users must be approved by an admin before login.
- **Admin:** First user can be set as admin in the database (see below).
- **Upload:** Upload video, audio, or photos. HEIC images are auto-converted.
- **Stream:** Play media in browser or with VLC/network player.
- **Audit Logs:** Admins can view all actions in the admin panel.

---

## Database & Admin Setup
- By default, all new users are regular users and require admin approval.
- To make yourself admin, update your user in the database:
  ```sql
  UPDATE user SET role = 'admin', is_approved = 1 WHERE username = '<your-username>';
  ```
- Use SQLite tools or a DB browser to edit `media_server.db`.

---

## Troubleshooting
- **Transcoding is slow:** Raspberry Pi 3 is limited; pre-transcode heavy files if needed.
- **Cannot login after register:** Wait for admin approval.
- **Media not playing:** Check file format and transcoding status.
- **Port issues:** Make sure ports 8000 (backend) and 80 (frontend) are open.

---

## Security Notes
- Set a strong `SECRET_KEY` in backend for production.
- Use HTTPS if exposing to the internet (Let’s Encrypt).
- Restrict access to your LAN if not public.

---

## Contributing
PRs and issues welcome! Please open an issue for bugs or feature requests.

---

## License
MIT 