# G2G ↔ SMMCost Automation Bridge

An automation server that bridges G2G marketplace orders with SMMCost SMM panel fulfillment. When a buyer purchases a Platform Engagement service on G2G, this server automatically fulfills the order via SMMCost API and confirms delivery back to G2G — fully hands-free.

## Features

- Receives G2G webhooks for new orders
- Verifies webhook authenticity using HMAC-SHA256
- Maps G2G offer IDs to SMMCost service IDs
- Places orders on SMMCost automatically
- Polls for order completion every 2 minutes
- Confirms delivery back to G2G (POST /v2/orders/{order_id}/delivery)
- Health monitoring endpoints

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
G2G_API_KEY=your_g2g_api_key
G2G_SECRET=your_g2g_webhook_secret
SMMCOST_KEY=your_smmcost_api_key
PORT=4000
POLL_INTERVAL=120000
```

### 3. Configure Service Map

Edit `service-map.json` to map G2G offer IDs to SMMCost service IDs:

```json
{
  "G2G_OFFER_ID_1": "SMMCOST_SERVICE_ID_1",
  "G2G_OFFER_ID_2": "SMMCOST_SERVICE_ID_2"
}
```

To find SMMCost service IDs, use the utility script:

```bash
SMMCOST_KEY=xxx npm run services instagram
```

### 4. Register Webhook on G2G

1. Log into your G2G seller dashboard
2. Navigate to Settings → Webhooks
3. Add a new webhook URL: `https://your-domain.com/webhook/g2g`
4. Select the event: `order.api_delivery`
5. Copy the webhook secret and add it to your `.env` as `G2G_SECRET`

### 5. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## PM2 Setup (Recommended for Production)

### Install PM2 globally if not already installed:

```bash
npm install -g pm2
```

### Start with PM2:

```bash
pm2 start server.js --name g2g-smmcost-bridge
```

### Useful PM2 Commands:

```bash
# View logs
pm2 logs g2g-smmcost-bridge

# Restart
pm2 restart g2g-smmcost-bridge

# Stop
pm2 stop g2g-smmcost-bridge

# Auto-start on server reboot
pm2 startup
pm2 save
```

### Ecosystem Config (Optional)

Create `ecosystem.config.js` for more control:

```javascript
module.exports = {
  apps: [{
    name: 'g2g-smmcost-bridge',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Then run:
```bash
pm2 start ecosystem.config.js
```

## API Endpoints

### POST /webhook/g2g
Receives order events from G2G marketplace.

**Headers Required:**
- `g2g-timestamp`: Unix timestamp
- `g2g-signature`: HMAC-SHA256 signature
- `Content-Type`: application/json

**Event Types Handled:**
- `order.api_delivery`

### GET /health
Returns server health and status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "pendingOrders": 5,
  "uptime": 86400
}
```

### GET /pending
Lists all orders currently being tracked.

**Response:**
```json
{
  "count": 5,
  "orders": [
    {
      "smmOrderId": "12345",
      "g2gOrderId": "67890",
      "g2gDeliveryId": "D123456",
      "offerId": "OFFER_001",
      "qty": 100,
      "link": "https://instagram.com/p/ABC123",
      "status": "pending",
      "smmStatus": "In progress",
      "createdAt": "2024-01-15T08:00:00Z",
      "lastChecked": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## G2G API Integration

### Webhook Signature Verification
HMAC-SHA256(secret, timestamp + "." + raw_body)

### Delivery Confirmation
**Endpoint:** `POST /v2/orders/{order_id}/delivery`

**Request Body:**
```json
{
  "delivery_id": "D123456",
  "codes": [{
    "content": "Fulfilled via SMMCost. Order: 12345, Qty: 100",
    "content_type": "text/plain",
    "reference_id": "SMM-12345-1705312200000"
  }]
}
```

## Order Flow

1. **Webhook Received**: Server verifies signature and extracts order details
2. **Service Lookup**: Maps G2G offer_id to SMMCost service ID
3. **Order Placed**: Creates order on SMMCost API
4. **Polling**: Checks order status every 2 minutes
5. **Confirmation**: When completed, calls POST /v2/orders/{order_id}/delivery on G2G

## Error Handling

- Invalid webhook signature → 401 Unauthorized, logged
- Unknown offer_id → Logged, order skipped
- SMMCost API error → Logged, does not crash
- G2G delivery confirmation failure → Logged, retries on next poll
- Order pending >24 hours → Warning logged

## Logs

All operations are logged to console with timestamps:

```
[WEBHOOK] Received G2G webhook
[ORDER] Processing G2G order: 12345
[SMMCOST] Order placed: 67890
[POLL] Checking 5 pending orders...
[G2G] Delivery D123456 confirmed for order 67890
[G2G] Reference ID: SMM-67890-1705312200000
```

## Utility Scripts

### Get SMMCost Services

Fetch and filter available SMMCost services:

```bash
# List all services
SMMCOST_KEY=xxx node get-services.js

# Filter by keyword
SMMCOST_KEY=xxx node get-services.js instagram
SMMCOST_KEY=xxx node get-services.js tiktok
SMMCOST_KEY=xxx node get-services.js youtube
```

## License

MIT