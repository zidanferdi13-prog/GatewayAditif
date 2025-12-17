# Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MQTT Broker (e.g., Mosquitto, HiveMQ)
- HX711 Load Cell with ESP32/Arduino (optional for hardware integration)

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd GatewayAditif
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# MQTT Configuration
MQTT_BROKER=mqtt://localhost
MQTT_PORT=1883
MQTT_TOPIC=amanerve/loadcell/telemetry
MQTT_CLIENT_ID=amanerve_gateway_3

# Server Configuration
PORT=3000

# Load Cell Configuration
MAX_WEIGHT=100.0
OVERLOAD_THRESHOLD=90.0
ALERT_ENABLED=true
```

### 4. Start the Application

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

## Production Deployment with PM2

### Install PM2
```bash
npm install -g pm2
```

### Start Application
```bash
pm2 start ecosystem.config.js
```

### Manage Application
```bash
# Stop application
pm2 stop dashboard_timbangan

# Restart application
pm2 restart dashboard_timbangan

# View logs
pm2 logs dashboard_timbangan

# Monitor status
pm2 monit

# View application list
pm2 list
```

### Configure Auto-Start on Boot
```bash
pm2 startup
pm2 save
```

## MQTT Broker Setup

### Option 1: Local Mosquitto (Linux/Mac)

**Install:**
```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto
```

**Start:**
```bash
# Linux
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# macOS
brew services start mosquitto
```

**Test:**
```bash
# Subscribe to topic
mosquitto_sub -h localhost -t "amanerve/loadcell/#" -v

# Publish test data
mosquitto_pub -h localhost -t "amanerve/loadcell/telemetry" -m '{"weight": 25.5, "stable": true}'
```

### Option 2: Cloud MQTT (HiveMQ, CloudMQTT, etc.)

Update `.env` with cloud broker details:
```env
MQTT_BROKER=mqtt://your-broker-url.com
MQTT_PORT=1883
# Add username/password if required
```

## Hardware Setup (Optional)

### ESP32/Arduino with HX711 Load Cell

1. Flash the load cell firmware to your ESP32/Arduino
2. Configure WiFi and MQTT credentials
3. Connect HX711 to your microcontroller:
   - VCC → 5V
   - GND → GND
   - DT → GPIO pin (e.g., D2)
   - SCK → GPIO pin (e.g., D3)

### MQTT Topics

The device should publish to:
- `amanerve/loadcell/telemetry` - Weight data
- `amanerve/button/confirm` - Confirm button press

The device should subscribe to:
- `amanerve/led/status` - LED control commands

### Data Format

**Telemetry Data:**
```json
{
  "weight": 25.5,
  "stable": true,
  "raw": 123456,
  "unit": "kg"
}
```

**Confirm Button:**
```json
{
  "weight": 25.5,
  "action": "confirm"
}
```

**LED Commands:**
- `HIGH_GREEN`
- `HIGH_RED`
- `BLINK_GREEN`
- `BLINK_RED`

## Accessing the Application

Once running, open your browser and navigate to:
```
http://localhost:3000
```

Or from another device on the same network:
```
http://<server-ip>:3000
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, change the `PORT` in `.env`:
```env
PORT=3001
```

### MQTT Connection Failed
1. Check if MQTT broker is running
2. Verify `MQTT_BROKER` URL in `.env`
3. Check firewall settings
4. Test broker connection:
   ```bash
   mosquitto_sub -h localhost -t "test" -v
   ```

### Cannot Access from Other Devices
1. Check firewall rules allow incoming connections on port 3000
2. Ensure server is listening on `0.0.0.0` (not just `localhost`)
3. Verify network connectivity

### Load Cell Not Sending Data
1. Check ESP32/Arduino is powered on and connected to WiFi
2. Verify MQTT broker address in device firmware
3. Check MQTT topics match configuration
4. Monitor MQTT broker logs

## Development

### Project Structure
```
GatewayAditif/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Helper functions
│   │   └── app.js          # Express app setup
│   └── server.js           # Server entry point
├── frontend/
│   ├── public/             # Static files
│   │   ├── index.html      # Main HTML
│   │   ├── css/            # Stylesheets
│   │   └── js/             # JavaScript files
│   ├── css/                # Source CSS
│   ├── js/                 # Source JS
│   └── assets/             # Images and assets
├── logs/                   # Application logs
├── docs/                   # Documentation
└── tests/                  # Test files
```

### Adding New Features

1. **New API Endpoint:**
   - Add controller in `backend/src/controllers/`
   - Add routes in `backend/src/routes/`
   - Update `backend/src/routes/index.js`

2. **New MQTT Topic:**
   - Update `backend/src/config/config.js`
   - Add handler in `backend/src/services/mqttService.js`

3. **New UI Feature:**
   - Add HTML in `frontend/public/index.html`
   - Add CSS in `frontend/public/css/`
   - Add JS in `frontend/public/js/`

## Support

For issues or questions:
1. Check the documentation in `docs/`
2. Review logs in `logs/` folder
3. Check PM2 logs: `pm2 logs`
4. Review application console output

## License

MIT License
