# AmaNerve Loadcell Telemetry Dashboard

Dashboard untuk monitoring telemetry data dari loadcell melalui MQTT protocol.

## 📁 Struktur Project

```
GatewayAditif/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   │   └── config.js     # App configuration
│   │   ├── controllers/      # Request handlers
│   │   │   ├── weightController.js
│   │   │   ├── ledController.js
│   │   │   └── statusController.js
│   │   ├── services/         # Business logic
│   │   │   └── mqttService.js # MQTT client handler
│   │   ├── routes/           # API routes
│   │   │   ├── index.js      # Main router
│   │   │   ├── weightRoutes.js
│   │   │   ├── ledRoutes.js
│   │   │   └── statusRoutes.js
│   │   ├── middleware/       # Express middleware (for future use)
│   │   ├── utils/            # Helper functions (for future use)
│   │   └── app.js            # Express app setup
│   └── server.js             # Server entry point
├── frontend/
│   ├── public/               # Served static files
│   │   ├── index.html        # Main dashboard page
│   │   ├── css/              # Stylesheets
│   │   │   └── style.css
│   │   └── js/               # JavaScript files
│   │       └── app.js        # Frontend logic
│   ├── css/                  # Source CSS
│   ├── js/                   # Source JS
│   └── assets/               # Images and static assets
│       └── images/
├── logs/                     # Application logs
│   └── CALIBRATION_LOG.txt   # Load cell calibration log
├── docs/                     # Documentation
│   ├── API.md               # API documentation
│   └── SETUP.md             # Setup guide
├── tests/                    # Test files
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── package.json
├── ecosystem.config.js      # PM2 configuration
├── .env                     # Environment variables (create from .env.example)
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
- Backend API ada di folder `backend/src/`
  - Controllers: `backend/src/controllers/`
  - Routes: `backend/src/routes/`
  - Services: `backend/src/services/`
  - Config: `backend/src/config/`
- Frontend UI ada di folder `frontend/public/`
- Konfigurasi MQTT bisa diubah di `.env`

## 📚 Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Setup Guide](docs/SETUP.md) - Detailed setup instructions

## 🏗️ Architecture

Project mengikuti best practices dengan separation of concerns:

- **MVC-like Pattern**: Controllers, Services, dan Routes terpisah
- **Modular Structure**: Setiap komponen di folder tersendiri
- **Configuration Management**: Centralized config di `config/`
- **Clean Entry Point**: `server.js` minimal, hanya untuk bootstrap
- **Static Files Organized**: Frontend files di `public/` folder

## 📝 Adding New Features

### New API Endpoint
1. Create controller in `backend/src/controllers/`
2. Create routes in `backend/src/routes/`
3. Register routes in `backend/src/routes/index.js`

### New MQTT Topic
1. Update config in `backend/src/config/config.js`
2. Add handler in `backend/src/services/mqttService.js`

### New UI Component
1. Update HTML in `frontend/public/index.html`
2. Add styles in `frontend/public/css/`
3. Add JavaScript in `frontend/public/js/`
