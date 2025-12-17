# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Weight Endpoints

#### Get Latest Weight
```http
GET /api/weight/latest
```

**Response:**
```json
{
  "success": true,
  "data": {
    "weight": 25.5,
    "stable": true,
    "timestamp": "2025-12-17T09:00:00.000Z"
  }
}
```

#### Get Weight History
```http
GET /api/weight/history?limit=50
```

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "weight": 25.5,
      "stable": true,
      "timestamp": "2025-12-17T09:00:00.000Z"
    }
  ]
}
```

#### Get Weight Statistics
```http
GET /api/weight/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 100,
    "average": 24.75,
    "min": 20.0,
    "max": 30.0,
    "latest": 25.5,
    "stable": true
  }
}
```

### LED Control Endpoints

#### Send LED Command
```http
POST /api/led/control
```

**Request Body:**
```json
{
  "command": "HIGH_GREEN"
}
```

**Valid Commands:**
- `HIGH_GREEN` - Turn green LED on
- `HIGH_RED` - Turn red LED on
- `BLINK_GREEN` - Blink green LED
- `BLINK_RED` - Blink red LED

**Response:**
```json
{
  "success": true,
  "message": "LED command sent: HIGH_GREEN"
}
```

### Status Endpoints

#### Get MQTT Connection Status
```http
GET /api/status
```

**Response:**
```json
{
  "success": true,
  "connected": true,
  "topic": "amanerve/loadcell/telemetry",
  "broker": "mqtt://localhost"
}
```

#### Get System Status
```http
GET /api/system/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mqtt_connected": true,
    "latest_weight": {
      "weight": 25.5,
      "stable": true,
      "timestamp": "2025-12-17T09:00:00.000Z"
    },
    "uptime": 3600.5,
    "memory": {
      "rss": 50331648,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576
    }
  }
}
```

### Legacy Endpoints (Backward Compatibility)

#### Get Historical Data
```http
GET /api/history
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "weight": 25.5,
      "timestamp": "2025-12-17T09:00:00.000Z"
    }
  ]
}
```

## Socket.IO Events

### Client → Server

#### `mo-confirmed`
Sent when a Manufacturing Order (MO) is confirmed.

**Payload:**
```json
{
  "mo": "MO123456",
  "timestamp": "2025-12-17T09:00:00.000Z"
}
```

#### `print-confirm`
Sent when print/confirm button is clicked.

**Payload:**
```json
{
  "mo": "MO123456",
  "lot": 1,
  "rm_index": 0,
  "rm_name": "Material A",
  "weight": 25.5,
  "target": 25.0,
  "timestamp": "2025-12-17T09:00:00.000Z"
}
```

#### `request-history`
Request historical data.

**Payload:** None

### Server → Client

#### `mqtt-status`
MQTT connection status update.

**Payload:**
```json
{
  "connected": true
}
```

#### `telemetry-data`
Legacy telemetry data event.

**Payload:**
```json
{
  "weight": 25.5,
  "timestamp": "2025-12-17T09:00:00.000Z"
}
```

#### `weightData`
Weight data with stability information.

**Payload:**
```json
{
  "weight": 25.5,
  "stable": true,
  "timestamp": "2025-12-17T09:00:00.000Z"
}
```

#### `confirmData`
Button confirm event.

**Payload:**
```json
{
  "weight": 25.5,
  "timestamp": "2025-12-17T09:00:00.000Z"
}
```

#### `history-data`
Historical data array.

**Payload:**
```json
[
  {
    "weight": 25.5,
    "timestamp": "2025-12-17T09:00:00.000Z"
  }
]
```

#### `mo-api-response`
Response from external MO API.

**Payload:**
```json
{
  "success": true,
  "data": {
    // API response data
  }
}
```

#### `mo-data-confirm`
MO data confirmation with calculated target weights.

**Payload:**
```json
{
  "success": true,
  "data": {
    "nomor_mo": "MO123456",
    "qty_plan": 1,
    "lot": 0,
    "produk_rm_items": ["Material A", "Material B"],
    "produk_rm_qty": [100.0, 50.0],
    "target_weights": [25.0, 12.5],
    "total_rm": 2
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (no data available)
- `500` - Internal Server Error
