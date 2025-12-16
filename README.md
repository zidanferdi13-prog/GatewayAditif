# AmaNerve Loadcell Telemetry Dashboard

Dashboard untuk monitoring telemetry data dari loadcell melalui MQTT protocol.

## 📁 Struktur Project

```
Gateway 3/
├── backend/
│   ├── server.js           # Main server
│   ├── mqtt-client.js      # MQTT client handler
│   └── config.js           # Configuration
├── frontend/
│   ├── index.html          # Main dashboard page
│   ├── css/
│   │   └── style.css       # Styling
│   └── js/
│       └── app.js          # Frontend logic
├── package.json
├── .env                    # Environment variables (buat sendiri)
└── README.md
```

## 🚀 Instalasi

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` ke `.env` dan sesuaikan konfigurasi:
```bash
copy .env.example .env
```

3. Edit `.env` sesuai dengan broker MQTT Anda

## ▶️ Menjalankan Aplikasi

Development mode (dengan auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Menggunakan PM2 (Production)

Start aplikasi:
```bash
pm2 start ecosystem.config.js
```

Stop aplikasi:
```bash
pm2 stop dashboard_timbangan
```

Restart aplikasi:
```bash
pm2 restart dashboard_timbangan
```

Monitor aplikasi:
```bash
pm2 monit
```

Melihat logs:
```bash
pm2 logs dashboard_timbangan
```

Auto-start saat boot:
```bash
pm2 startup
pm2 save
```

## 🌐 Akses Dashboard

Buka browser dan akses:
```
http://localhost:3000
```

## 📊 Features

- ✅ Real-time MQTT data monitoring
- ✅ Live data visualization
- ✅ Historical data chart
- ✅ Responsive design
- ✅ Connection status indicator
- ✅ Statistics dashboard

## 🔧 Development

Untuk development lebih lanjut:
- Backend logic ada di folder `backend/`
- Frontend UI ada di folder `frontend/`
- Konfigurasi MQTT bisa diubah di `.env`
