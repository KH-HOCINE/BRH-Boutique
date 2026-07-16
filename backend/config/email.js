const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ───────────────────────────────
// HELPERS
// ───────────────────────────────

const formatDA = (amount) => `${(amount || 0).toLocaleString('fr-DZ')} DA`;

// Génère les lignes du tableau d'articles (réutilisé dans les 2 emails)
const buildItemsRows = (items = []) => {
  return items.map(item => {
    const meta = [item.size, item.fit, item.color].filter(Boolean).join(' · ');
    return `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;">
          ${item.image ? `<img src="${item.image}" width="48" height="48" style="border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:10px;" />` : ''}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#111;">${item.name}</div>
          ${meta ? `<div style="font-size:12px;color:#777;">${meta}</div>` : ''}
          ${item.custom ? `<div style="font-size:12px;color:#b7791f;">🎨 Design personnalisé</div>` : ''}
          ${item.note ? `<div style="font-size:12px;color:#777;">Note : ${item.note}</div>` : ''}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">× ${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
          ${formatDA(item.price * item.quantity)}
        </td>
      </tr>`;
  }).join('');
};

// Bloc infos client + livraison
const buildCustomerInfoBlock = (customer) => `
  <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
    <tr>
      <td style="padding:4px 0;color:#777;width:130px;">Client</td>
      <td style="padding:4px 0;color:#111;font-weight:600;">${customer.fullName || '-'}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#777;">Téléphone</td>
      <td style="padding:4px 0;color:#111;">${customer.phone || '-'}${customer.phone2 ? ` / ${customer.phone2}` : ''}</td>
    </tr>
    ${customer.email ? `
    <tr>
      <td style="padding:4px 0;color:#777;">Email</td>
      <td style="padding:4px 0;color:#111;">${customer.email}</td>
    </tr>` : ''}
    <tr>
      <td style="padding:4px 0;color:#777;">Wilaya</td>
      <td style="padding:4px 0;color:#111;">${customer.wilaya || '-'}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#777;">Commune</td>
      <td style="padding:4px 0;color:#111;">${customer.commune || '-'}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#777;">Livraison</td>
      <td style="padding:4px 0;color:#111;">${customer.deliveryType === 'office' ? 'Bureau / Stop desk' : 'À domicile'}</td>
    </tr>
    ${customer.address ? `
    <tr>
      <td style="padding:4px 0;color:#777;">Adresse</td>
      <td style="padding:4px 0;color:#111;">${customer.address}</td>
    </tr>` : ''}
  </table>
`;

// Bloc récap montants
const buildTotalsBlock = (order) => `
  <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
    <tr>
      <td style="padding:4px 0;color:#777;">Prix d'articles</td>
      <td style="padding:4px 0;text-align:right;color:#111;">${formatDA(order.subtotal)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#777;">Prix de livraison</td>
      <td style="padding:4px 0;text-align:right;color:#111;">${formatDA(order.deliveryPrice)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0 0;font-weight:700;color:#111;border-top:1px solid #ddd;">Total</td>
      <td style="padding:8px 0 0;text-align:right;font-weight:700;color:#111;border-top:1px solid #ddd;">
        ${formatDA(order.totalAmount)}
      </td>
    </tr>
  </table>
`;

// ───────────────────────────────
// ADMIN EMAIL
// ───────────────────────────────
const sendOrderNotificationToAdmin = async (order) => {
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#111;">🛍️ Nouvelle commande — ${order.orderNumber}</h2>
      <p style="color:#777;font-size:13px;margin-top:-8px;">
        Passée le ${new Date(order.createdAt).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>

      ${buildCustomerInfoBlock(order.customer)}

      <h3 style="color:#111;margin-top:24px;margin-bottom:8px;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#777;">
        Articles commandés
      </h3>
      <table style="width:100%;border-collapse:collapse;">
        ${buildItemsRows(order.items)}
      </table>

      ${buildTotalsBlock(order)}

      ${order.notes ? `
      <div style="margin-top:16px;padding:10px 14px;background:#f7f7f7;border-radius:8px;font-size:13px;color:#333;">
        <b>Note client :</b> ${order.notes}
      </div>` : ''}

      <p style="margin-top:20px;font-size:12px;color:#999;">
        Statut Anderson Express : ${order.andersonSyncStatus === 'synced' ? '✅ Synchronisée' : '❌ Échec de synchronisation'}
      </p>
    </div>
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
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#111;font-size:22px;">Merci pour votre commande 🎉</h1>
      <p style="color:#333;">Bonjour <b>${order.customer.fullName}</b>,</p>
      <p style="color:#333;">Votre commande <b>${order.orderNumber}</b> a bien été enregistrée. Voici le récapitulatif :</p>

      <h3 style="color:#111;margin-top:24px;margin-bottom:8px;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#777;">
        Articles commandés
      </h3>
      <table style="width:100%;border-collapse:collapse;">
        ${buildItemsRows(order.items)}
      </table>

      ${buildTotalsBlock(order)}

      <h3 style="color:#111;margin-top:24px;margin-bottom:8px;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#777;">
        Livraison
      </h3>
      ${buildCustomerInfoBlock(order.customer)}

      ${order.notes ? `
      <div style="margin-top:16px;padding:10px 14px;background:#f7f7f7;border-radius:8px;font-size:13px;color:#333;">
        <b>Votre note :</b> ${order.notes}
      </div>` : ''}

      <p style="margin-top:24px;font-size:13px;color:#777;">
        Vous pouvez suivre votre commande à tout moment avec le numéro <b>${order.orderNumber}</b>.
      </p>
    </div>
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