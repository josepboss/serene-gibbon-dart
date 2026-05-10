require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuration
const G2G_BASE_URL = 'https://open-api.g2g.com';
const SMMCOST_BASE_URL = 'https://smmcost.com/api/v2';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '120000', 10);
const MAX_PENDING_HOURS = 24;

// In-memory order tracking
const pendingOrders = new Map();

// Load service map
const fs = require('fs');
const path = require('path');
const serviceMapPath = path.join(__dirname, 'service-map.json');
let serviceMap = {};

try {
  serviceMap = JSON.parse(fs.readFileSync(serviceMapPath, 'utf8'));
  console.log(`[INIT] Loaded ${Object.keys(serviceMap).length} service mappings`);
} catch (err) {
  console.warn('[INIT] Could not load service-map.json, using empty map');
}

// ============================================
// G2G Webhook Handler
// ============================================
app.post('/webhook/g2g', async (req, res) => {
  const timestamp = req.headers['g2g-timestamp'];
  const signature = req.headers['g2g-signature'];
  const rawBody = JSON.stringify(req.body);

  // Verify signature
  if (!verifyG2GSignature(timestamp, rawBody, signature)) {
    console.warn('[WEBHOOK] Invalid signature received');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('[WEBHOOK] Received G2G webhook');
  console.log('[WEBHOOK] Event type:', req.body.event_type);

  if (req.body.event_type === 'order.api_delivery') {
    await handleNewOrder(req.body);
  }

  res.status(200).json({ status: 'received' });
});

// ============================================
// HMAC-SHA256 Signature Verification
// ============================================
function verifyG2GSignature(timestamp, rawBody, signature) {
  if (!timestamp || !signature) return false;
  
  const secret = process.env.G2G_SECRET;
  if (!secret) {
    console.error('[AUTH] G2G_SECRET not configured');
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ============================================
// Handle New Order from G2G
// ============================================
async function handleNewOrder(payload) {
  try {
    const order = payload.order;
    const delivery = payload.delivery;
    
    if (!order || !delivery) {
      console.error('[ORDER] Missing order or delivery data');
      return;
    }

    const offerId = order.offer_id.toString();
    const g2gOrderId = order.id;
    const g2gDeliveryId = delivery.id;
    const qty = order.quantity;

    // Look up SMMCost service ID
    const smmServiceId = serviceMap[offerId];
    if (!smmServiceId) {
      console.error(`[ORDER] No SM<dyad-write path="server.js" description="Complete Express server with G2G webhook and SMMCost fulfillment">
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuration
const G2G_BASE_URL = 'https://open-api.g2g.com';
const SMMCOST_BASE_URL = 'https://smmcost.com/api/v2';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '120000', 10);
const MAX_PENDING_HOURS = 24;

// In-memory order tracking
const pendingOrders = new Map();

// Load service map
const fs = require('fs');
const path = require('path');
const serviceMapPath = path.join(__dirname, 'service-map.json');
let serviceMap = {};

try {
  serviceMap = JSON.parse(fs.readFileSync(serviceMapPath, 'utf8'));
  console.log(`[INIT] Loaded ${Object.keys(serviceMap).length} service mappings`);
} catch (err) {
  console.warn('[INIT] Could not load service-map.json, using empty map');
}

// ============================================
// G2G Webhook Handler
// ============================================
app.post('/webhook/g2g', async (req, res) => {
  const timestamp = req.headers['g2g-timestamp'];
  const signature = req.headers['g2g-signature'];
  const rawBody = JSON.stringify(req.body);

  // Verify signature
  if (!verifyG2GSignature(timestamp, rawBody, signature)) {
    console.warn('[WEBHOOK] Invalid signature received');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('[WEBHOOK] Received G2G webhook');
  console.log('[WEBHOOK] Event type:', req.body.event_type);

  if (req.body.event_type === 'order.api_delivery') {
    await handleNewOrder(req.body);
  }

  res.status(200).json({ status: 'received' });
});

// ============================================
// HMAC-SHA256 Signature Verification
// ============================================
function verifyG2GSignature(timestamp, rawBody, signature) {
  if (!timestamp || !signature) return false;
  
  const secret = process.env.G2G_SECRET;
  if (!secret) {
    console.error('[AUTH] G2G_SECRET not configured');
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ============================================
// Handle New Order from G2G
// ============================================
async function handleNewOrder(payload) {
  try {
    const order = payload.order;
    const delivery = payload.delivery;
    
    if (!order || !delivery) {
      console.error('[ORDER] Missing order or delivery data');
      return;
    }

    const offerId = order.offer_id.toString();
    const g2gOrderId = order.id;
    const g2gDeliveryId = delivery.id;
    const qty = order.quantity;

    // Look up SMMCost service ID
    const smmServiceId = serviceMap[offerId];
    if (!smmServiceId) {
      console.error(`[ORDER] No SMMCost service mapping for offer_id: ${offerId}`);
      return;
    }

    // Extract delivery info from additional_info_list
    const additionalInfo = delivery.delivery_summary?.additional_info_list || [];
    let link = '';
    let username = '';

    for (const info of additionalInfo) {
      if (info.field === 'link' || info.field === 'post_url') {
        link = info.value || info;
      }
      if (info.field === 'username' || info.field === 'instagram') {
        username = info.value || info;
      }
    }

    // Fallback to order link if not in additional info
    if (!link && order.link) {
      link = order.link;
    }

    console.log(`[ORDER] Processing G2G order: ${g2gOrderId}`);
    console.log(`[ORDER] Offer ID: ${offerId} → SMMCost Service: ${smmServiceId}`);
    console.log(`[ORDER] Quantity: ${qty}, Link: ${link}`);

    // Place order on SMMCost
    const smmResult = await placeSMMOrder(smmServiceId, link, qty);
    
    if (!smmResult || smmResult.error) {
      console.error('[ORDER] SMMCost order failed:', smmResult?.error || 'Unknown error');
      return;
    }

    const smmOrderId = smmResult.order;
    console.log(`[ORDER] SMMCost order placed: ${smmOrderId}`);

    // Track the order
    const orderData = {
      smmOrderId,
      g2gOrderId,
      g2gDeliveryId,
      offerId,
      qty,
      link,
      username,
      status: 'pending',
      createdAt: new Date(),
      lastChecked: new Date()
    };
    
    pendingOrders.set(smmOrderId, orderData);
    console.log(`[TRACK] Added to pending orders, total: ${pendingOrders.size}`);

  } catch (err) {
    console.error('[ORDER] Error processing order:', err.message);
  }
}

// ============================================
// SMMCost API Calls
// ============================================
async function placeSMMOrder(serviceId, link, quantity) {
  try {
    const response = await axios.post(SMMCOST_BASE_URL, null, {
      params: {
        key: process.env.SMMCOST_KEY,
        action: 'add',
        service: serviceId,
        link: link,
        quantity: quantity
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  } catch (err) {
    console.error('[SMMCOST] Error placing order:', err.message);
    return { error: err.message };
  }
}

async function checkSMMOrderStatus(orderId) {
  try {
    const response = await axios.post(SMMCOST_BASE_URL, null, {
      params: {
        key: process.env.SMMCOST_KEY,
        action: 'status',
        order: orderId
      }
    });

    return response.data;
  } catch (err) {
    console.error('[SMMCOST] Error checking status:', err.message);
    return { error: err.message };
  }
}

// ============================================
// Order Polling Loop
// ============================================
async function pollOrders() {
  if (pendingOrders.size === 0) return;

  console.log(`[POLL] Checking ${pendingOrders.size} pending orders...`);

  for (const [smmOrderId, orderData] of pendingOrders) {
    try {
      const result = await checkSMMOrderStatus(smmOrderId);
      
      if (result.error) {
        console.error(`[POLL] Error for order ${smmOrderId}:`, result.error);
        continue;
      }

      // Extract status from response
      const statusData = result[smmOrderId];
      const status = statusData?.status || 'Unknown';
      
      orderData.lastChecked = new Date();
      orderData.smmStatus = status;

      console.log(`[POLL] Order ${smmOrderId}: ${status}`);

      // Check for completion or partial completion
      if (status === 'Completed' || status === 'Partial') {
        await confirmG2GDelivery(orderData, statusData);
        pendingOrders.delete(smmOrderId);
        console.log(`[POLL] Order ${smmOrderId} completed, removed from tracking`);
      }
      // Check for cancellation
      else if (status === 'Canceled') {
        console.warn(`[POLL] Order ${smmOrderId} was canceled`);
        pendingOrders.delete(smmOrderId);
      }
      // Check for stale orders (> 24 hours)
      else {
        const hoursPending = (Date.now() - orderData.createdAt) / (1000 * 60 * 60);
        if (hoursPending > MAX_PENDING_HOURS) {
          console.warn(`[POLL] Order ${smmOrderId} pending for ${hoursPending.toFixed(1)} hours`);
        }
      }

    } catch (err) {
      console.error(`[POLL] Error polling order ${smmOrderId}:`, err.message);
    }
  }
}

// ============================================
// G2G Delivery Confirmation
// ============================================
async function confirmG2GDelivery(orderData, smmStatus) {
  const { g2gDeliveryId, smmOrderId, offerId, qty } = orderData;
  
  try {
    const deliveryCode = `SMM-${smmOrderId}`;
    
    const response = await axios.patch(
      `${G2G_BASE_URL}/v2/deliveries/${g2gDeliveryId}`,
      {
        delivery_code: deliveryCode,
        status: 'delivered',
        notes: `Fulfilled via SMMCost. Order: ${smmOrderId}, Qty: ${qty}`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.G2G_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[G2G] Delivery ${g2gDeliveryId} confirmed: ${deliveryCode}`);
    
  } catch (err) {
    console.error(`[G2G] Failed to confirm delivery ${g2gDeliveryId}:`, err.message);
    // Don't remove from tracking - will retry on next poll
  }
}

// ============================================
// Health & Status Endpoints
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    pendingOrders: pendingOrders.size,
    uptime: process.uptime()
  });
});

app.get('/pending', (req, res) => {
  const orders = Array.from(pendingOrders.values()).map(o => ({
    smmOrderId: o.smmOrderId,
    g2gOrderId: o.g2gOrderId,
    g2gDeliveryId: o.g2gDeliveryId,
    offerId: o.offerId,
    qty: o.qty,
    link: o.link,
    status: o.status,
    smmStatus: o.smmStatus,
    createdAt: o.createdAt,
    lastChecked: o.lastChecked
  }));
  
  res.json({
    count: pendingOrders.size,
    orders
  });
});

// ============================================
// Graceful Shutdown
// ============================================
process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Stopping polling loop...');
  clearInterval(pollInterval);
  console.log('[SHUTDOWN] Exiting gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[SHUTDOWN] Received SIGTERM, shutting down...');
  clearInterval(pollInterval);
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[ERROR] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled rejection:', reason);
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` G2G ↔ SMMCost Bridge Server`);
  console.log(`========================================`);
  console.log(` Listening on port: ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(` Pending: http://localhost:${PORT}/pending`);
  console.log(` Polling interval: ${POLL_INTERVAL / 1000}s`);
  console.log(`========================================`);
});

// Start polling loop
const pollInterval = setInterval(pollOrders, POLL_INTERVAL);
console.log('[INIT] Order polling started');