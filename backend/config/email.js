const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ───────────────────────────────
// ADMIN EMAIL
// ───────────────────────────────
const sendOrderNotificationToAdmin = async (order) => {
  const html = `
    <h2>🛍️ Nouvelle commande</h2>

    <p><b>Commande :</b> ${order.orderNumber}</p>
    <p><b>Client :</b> ${order.customer.fullName}</p>
    <p><b>Téléphone :</b> ${order.customer.phone}</p>
    <p><b>Adresse :</b> ${order.customer.address}</p>

    <h3>Total: ${order.totalAmount.toLocaleString('fr-DZ')} DA</h3>
  `;

  try {
 await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: process.env.ADMIN_EMAIL,
  subject: `🛍️ Nouvelle commande ${order.orderNumber}`,
  html,
});

    console.log("✅ Email admin envoyé");
  } catch (err) {
    console.error("❌ Email admin erreur:", err);
  }
};

// ───────────────────────────────
// CLIENT EMAIL
// ───────────────────────────────
const sendOrderConfirmationToClient = async (order) => {
  if (!order.customer.email) return;

  const html = `
    <h1>Merci pour votre commande 🎉</h1>
    <p>Bonjour <b>${order.customer.fullName}</b></p>
    <p>Commande : <b>${order.orderNumber}</b></p>
    <p>Total : <b>${order.totalAmount.toLocaleString('fr-DZ')} DA</b></p>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: order.customer.email,
      subject: `Confirmation commande ${order.orderNumber}`,
      html,
    });

    console.log("✅ Email client envoyé");
  } catch (err) {
    console.error("❌ Email client erreur:", err);
  }
};

module.exports = {
  sendOrderNotificationToAdmin,
  sendOrderConfirmationToClient
};