# 🛍️ Guide Complet — Boutique MERN

## Déploiement & Configuration

---

## 1. PRÉPARATION LOCALE

### Prérequis à installer
- **Node.js** v18+ → https://nodejs.org
- **MongoDB Community** → https://www.mongodb.com/try/download/community
- **Git** → https://git-scm.com

### Lancer le projet en local

```bash
# 1. Ouvrez un terminal dans le dossier backend/
cd boutique-mern/backend
npm install
cp .env.example .env
# → Éditez .env avec vos infos

# 2. Peuplez la base avec des données de test
node seed.js
# → Crée 6 produits + admin : admin@boutique.dz / admin123456

# 3. Lancez le backend
npm run dev
# → http://localhost:5000

# 4. Ouvrez un 2e terminal dans frontend/
cd boutique-mern/frontend
npm install
cp .env.example .env
# → Mettez REACT_APP_API_URL=http://localhost:5000/api

# 5. Lancez le frontend
npm start
# → http://localhost:3000
```

---

## 2. CONFIGURATION EMAIL GMAIL

Pour recevoir les notifications de commandes :

1. Allez sur **myaccount.google.com**
2. Sécurité → **Validation en deux étapes** (activez si pas fait)
3. Sécurité → **Mots de passe des applications**
4. Sélectionnez "Autre" → Nommez-le "Boutique"
5. **Copiez le mot de passe à 16 caractères** généré
6. Dans votre `.env` backend :
   ```
   EMAIL_USER=votre.gmail@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx   ← le mot de passe app
   ADMIN_EMAIL=votre.gmail@gmail.com
   ```

---

## 3. CONFIGURATION META PIXEL

### Récupérer votre Pixel ID

1. Allez sur **business.facebook.com**
2. Gestionnaire d'événements → **Pixels**
3. Créez un pixel si vous n'en avez pas encore
4. Copiez l'**ID du pixel** (ex: `123456789012345`)
5. Dans `.env` frontend : `REACT_APP_META_PIXEL_ID=123456789012345`

### Récupérer le token d'accès (Conversions API)

1. Gestionnaire d'événements → votre Pixel → **Paramètres**
2. Conversions API → **Générer un token d'accès**
3. Copiez le token
4. Dans `.env` backend : `META_ACCESS_TOKEN=EAAxxxxx...`

### Ce que le Pixel trackera automatiquement
| Événement | Déclencheur |
|---|---|
| `PageView` | Chaque visite |
| `ViewContent` | Voir un produit |
| `AddToCart` | Ajouter au panier |
| `InitiateCheckout` | Aller à la commande |
| `Purchase` | Commande confirmée ✓ |

---

## 4. DÉPLOIEMENT BACKEND SUR RENDER (Gratuit)

### Étape 1 — GitHub
```bash
# Dans boutique-mern/
git init
git add .
git commit -m "Initial commit"
# Créez un repo sur github.com puis :
git remote add origin https://github.com/VOTRE_USERNAME/boutique-mern.git
git push -u origin main
```

### Étape 2 — Render
1. Allez sur **render.com** → Sign up (gratuit)
2. **New** → **Web Service**
3. Connectez votre repo GitHub
4. Configurez :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Plan** : Free
   - **Region** : Frankfurt (EU) ← plus proche de l'Algérie

### Étape 3 — Variables d'environnement sur Render
Dans l'onglet **Environment** de votre service Render, ajoutez :

```
NODE_ENV          = production
MONGO_URI         = mongodb+srv://...  (voir section MongoDB Atlas ci-dessous)
JWT_SECRET        = [générez sur render ou mettez une longue chaine aléatoire]
EMAIL_HOST        = smtp.gmail.com
EMAIL_PORT        = 587
EMAIL_USER        = votre.email@gmail.com
EMAIL_PASS        = votre_app_password_gmail
EMAIL_FROM        = votre.email@gmail.com
ADMIN_EMAIL       = votre.email@gmail.com
META_PIXEL_ID     = votre_pixel_id
META_ACCESS_TOKEN = votre_token_meta
CLIENT_URL        = https://votre-boutique.vercel.app
```

### ⚠️ MongoDB en production → MongoDB Atlas (gratuit)
Le MongoDB local ne fonctionne pas sur Render. Créez un cluster gratuit :

1. **mongodb.com/atlas** → Créez un compte gratuit
2. **Create a Cluster** → Choisissez **M0 Free**
3. Database Access → **Add New Database User**
   - Username : `boutique_user`
   - Password : générez un mot de passe fort
4. Network Access → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Clusters → **Connect** → **Connect your application**
6. Copiez la string de connexion :
   ```
   mongodb+srv://boutique_user:MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/boutique-mode
   ```
7. Mettez cette valeur dans `MONGO_URI` sur Render

---

## 5. DÉPLOIEMENT FRONTEND SUR VERCEL (Gratuit)

1. Allez sur **vercel.com** → Sign up avec GitHub
2. **Add New Project** → Importez votre repo
3. Configurez :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Create React App
4. **Environment Variables** → Ajoutez :
   ```
   REACT_APP_API_URL      = https://boutique-backend.onrender.com/api
   REACT_APP_META_PIXEL_ID = votre_pixel_id
   REACT_APP_SHOP_NAME    = Votre Nom de Boutique
   ```
5. Cliquez **Deploy** ✓

> ⚠️ Remplacez `boutique-backend.onrender.com` par l'URL réelle donnée par Render après déploiement.

---

## 6. GESTION DES IMAGES EN PRODUCTION

Le plan gratuit de Render ne conserve pas les fichiers uploadés entre redémarrages. Pour la production, utilisez **Cloudinary** (gratuit) :

### Installer Cloudinary
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

### Créer un compte Cloudinary
1. **cloudinary.com** → Sign up gratuit (25 GB inclus)
2. Dashboard → copiez `Cloud Name`, `API Key`, `API Secret`
3. Ajoutez dans les variables Render :
   ```
   CLOUDINARY_CLOUD_NAME = votre_cloud_name
   CLOUDINARY_API_KEY    = votre_api_key
   CLOUDINARY_API_SECRET = votre_api_secret
   ```

### Modifier routes/products.js pour Cloudinary
Remplacez la configuration Multer par :
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'boutique-mode',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 1000, crop: 'fill' }],
  },
});
```
Et changez la récupération des chemins :
```javascript
// Remplacez :
const images = req.files.map(f => `/uploads/products/${f.filename}`);
// Par :
const images = req.files.map(f => f.path); // URL Cloudinary complète
```

---

## 7. RÉSUMÉ DES URLs FINALES

| Service | URL |
|---|---|
| **Boutique (frontend)** | `https://votre-boutique.vercel.app` |
| **Admin** | `https://votre-boutique.vercel.app/admin` |
| **API backend** | `https://boutique-backend.onrender.com/api` |

---

## 8. CHECKLIST AVANT MISE EN LIGNE

- [ ] Changer le mot de passe admin (ne pas garder `admin123456`)
- [ ] Vérifier que les emails de notification arrivent bien
- [ ] Tester une commande de bout en bout
- [ ] Vérifier le Meta Pixel avec l'extension **Meta Pixel Helper** (Chrome)
- [ ] Vérifier que les images s'affichent (Cloudinary configuré)
- [ ] Mettre le vrai nom de boutique dans `REACT_APP_SHOP_NAME`
- [ ] Ajouter vos vraies photos produits

---

## 9. COMMANDES UTILES

```bash
# Réinitialiser la base de données
cd backend && node seed.js

# Voir les logs du backend en local
npm run dev

# Builder le frontend pour production
cd frontend && npm run build

# Tester l'API
curl http://localhost:5000/api/products
curl http://localhost:5000/api/orders/stats/summary \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## 10. SUPPORT

En cas de problème :
- **Logs Render** : Dashboard → votre service → Logs
- **Logs Vercel** : Dashboard → votre projet → Functions
- **Test emails** : https://mailtrap.io (environnement de test)
- **Test Pixel** : Extension Chrome **Meta Pixel Helper**
