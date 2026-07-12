const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// ------------------------------------------------------------------
// Fonction de hachage SHA-256 (recommandée par Meta)
// ------------------------------------------------------------------
const hash = (value) => {
  if (!value) return undefined;

  return crypto
    .createHash('sha256')
    .update(String(value).trim().toLowerCase())
    .digest('hex');
};

// ------------------------------------------------------------------
// Envoi d'un évènement vers Meta Conversions API
// ------------------------------------------------------------------
const sendMetaEvent = async (eventName, eventData) => {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn("⚠️ META_PIXEL_ID ou META_ACCESS_TOKEN manquant.");
    return;
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: crypto.randomUUID(),
        ...eventData,
      },
    ],
  };

  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    console.log("📤 Payload envoyé à Meta :");
    console.dir(payload, { depth: null });

    console.log("📥 Réponse Meta :");
    console.dir(data, { depth: null });

    if (data.error) {
      console.error("❌ Meta API :", data.error);
    } else {
      console.log("✅ Evènement Meta envoyé avec succès.");
    }
  } catch (err) {
    console.error("❌ Erreur Meta :", err.message);
  }
};

// ------------------------------------------------------------------
// Evènement personnalisé
// ------------------------------------------------------------------
router.post("/event", async (req, res) => {
  const { eventName, userData, customData } = req.body;

  await sendMetaEvent(eventName, {
    user_data: userData || {},
    custom_data: customData || {},
  });

  res.json({ success: true });
});

// ------------------------------------------------------------------
// Achat
// ------------------------------------------------------------------
router.post("/purchase", async (req, res) => {
  const { orderNumber, totalAmount, items, customer } = req.body;

  console.log("========== ACHAT ==========");
  console.dir(customer, { depth: null });

  await sendMetaEvent("Purchase", {
    user_data: {
      em: customer?.email
        ? [hash(customer.email)]
        : undefined,

      ph: customer?.phone
        ? [hash(customer.phone.replace(/\s+/g, ""))]
        : undefined,

      fn: customer?.fullName
        ? [hash(customer.fullName.split(" ")[0])]
        : undefined,

      ln: customer?.fullName
        ? [hash(customer.fullName.split(" ").slice(1).join(" "))]
        : undefined,

      client_ip_address: req.ip,
      client_user_agent: req.headers["user-agent"],
    },

    custom_data: {
      currency: "DZD",
      value: Number(totalAmount),

      order_id: orderNumber,

      content_ids:
        items?.map((i) => String(i.product)) || [],

      content_type: "product",

      num_items:
        items?.reduce((s, i) => s + i.quantity, 0) || 1,
    },
  });

  res.json({
    success: true,
  });
});

module.exports = router;