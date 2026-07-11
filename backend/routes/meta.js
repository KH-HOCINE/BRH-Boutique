const express = require('express');
const router  = express.Router();

// Meta Conversions API — envoie les événements côté serveur
// Plus fiable que le Pixel seul (contourne les adblockers)

const sendMetaEvent = async (eventName, eventData) => {
  const pixelId     = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) return;

  const payload = {
    data: [{
      event_name:  eventName,
      event_time:  Math.floor(Date.now() / 1000),
      action_source: 'website',
      ...eventData,
    }],
    test_event_code: process.env.META_TEST_EVENT_CODE || undefined,
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (data.error) console.error('Meta API error:', data.error);
  } catch (err) {
    console.error('Meta event error:', err.message);
  }
};

// POST /api/meta/event — reçoit les événements du frontend
router.post('/event', async (req, res) => {
  const { eventName, userData, customData } = req.body;

  await sendMetaEvent(eventName, {
    user_data:   userData   || {},
    custom_data: customData || {},
  });

  res.json({ success: true });
});

// POST /api/meta/purchase — événement achat (appelé après commande)
router.post('/purchase', async (req, res) => {
  const { orderId, orderNumber, totalAmount, items, customer } = req.body;

  await sendMetaEvent('Purchase', {
    user_data: {
      ph: customer?.phone ? [customer.phone] : [],
      em: customer?.email ? [customer.email] : [],
    },
    custom_data: {
      currency:    'DZD',
      value:       totalAmount,
      order_id:    orderNumber,
      content_ids: items?.map(i => i.product) || [],
      content_type: 'product',
      num_items:   items?.reduce((s, i) => s + i.quantity, 0) || 1,
    },
  });

  res.json({ success: true });
});

module.exports = router;
