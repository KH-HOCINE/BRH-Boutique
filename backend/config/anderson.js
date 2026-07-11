// config/anderson.js

const ANDERSON_API_URL   = process.env.ANDERSON_API_URL || 'https://anderson-ecommerce.ecotrack.dz';
const ANDERSON_API_TOKEN = process.env.ANDERSON_API_TOKEN;

async function andersonRequest(path, { method = 'GET', body } = {}) {
  if (!ANDERSON_API_TOKEN) {
    throw new Error('ANDERSON_API_TOKEN manquant dans les variables d\'environnement');
  }

  const response = await fetch(`${ANDERSON_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANDERSON_API_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Anderson API error [${method} ${path}] →`, text);
    throw new Error(`Anderson API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Synchronise une commande locale avec Anderson Express (ECOTRACK)
 * @param {Object} order - Document Mongoose de la commande
 * @returns {Promise<Object>} Réponse de l'API Anderson
 */
async function createAndersonOrder(order) {
  const {
    orderNumber,
    customer: {
      fullName, phone, phone2, wilayaCode, commune, address, deliveryType,
    },
    totalAmount,
    notes,
    items,
  } = order;

  // Déterminer le type de stop_desk : 1 = Point relais, 0 = Domicile
  const stopDesk = deliveryType === 'office' ? 1 : 0;

  // Construire l'adresse pour Anderson (obligatoire dans l'API)
  let andersonAddress = address;
  if (deliveryType === 'office') {
    andersonAddress = `Point relais Anderson Express - ${commune}`;
  }
  // Si l'adresse est vide (cas rare), on met une valeur par défaut
  if (!andersonAddress || andersonAddress.trim() === '') {
    andersonAddress = `Livraison à ${commune}, Wilaya ${wilayaCode}`;
  }

  // Liste des produits (noms séparés par des virgules)
  const productNames = items.map(item => item.name).join(',');

  // ✅ Construction des paramètres de la requête (URLSearchParams)
  const params = new URLSearchParams({
    reference: orderNumber,
    nom_client: fullName,
    telephone: phone,
    telephone_2: phone2 || '',
    adresse: andersonAddress,
    code_postal: '', // Optionnel
    commune: commune,
    code_wilaya: wilayaCode, // Doit être un nombre entre 1 et 58
    montant: totalAmount,
    remarque: notes || '',
    produit: productNames,
    boutique: 'BHR Boutique', // Vous pouvez personnaliser ou laisser vide
    type: 1, // 1 = Livraison (selon la doc)
    stop_desk: stopDesk,
    // Champs optionnels supplémentaires
    weight: '',
    fragile: '',
    gps_link: '',
  });

  const path = `/api/v1/create/order?${params.toString()}`;
  
  console.log(`[Anderson] Synchronisation de la commande ${orderNumber}...`);
  const response = await andersonRequest(path, { method: 'POST' });
  console.log(`[Anderson] ✅ Synchronisation réussie pour ${orderNumber}`);
  
  return response;
}

module.exports = { 
  andersonRequest, 
  ANDERSON_API_URL, 
  createAndersonOrder // Export de la nouvelle fonction
};