// pages/CheckoutPage.js - Version Anderson Express (wilayas, communes filtrées par type et tarifs dynamiques)
// ✅ Synchronisation avec Anderson + wilayaCode dans le payload

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/shop/Navbar';
import { useCart } from '../context/CartContext';
import { trackPurchase } from '../utils/metaPixel';
import api from '../utils/api';
import { useT } from '../translations';
import './CheckoutPage.css';

import {
  FaUser, FaPhone, FaCity, FaMapMarkerAlt,
  FaHome, FaBuilding, FaStickyNote, FaTruck, FaSpinner,
} from 'react-icons/fa';

const isValidPhone = (phone) => /^(05|06|07)\d{8}$/.test(phone);

export default function CheckoutPage() {
  const { cart, dispatch, total } = useCart();
  const navigate = useNavigate();
  const t = useT();
  const [loading, setLoading] = useState(false);

  // ── Livraison ──────────────────────────────────────────────
  const [deliveryType, setDeliveryType]     = useState('home'); // 'home' | 'office'
  const [deliveryPrice, setDeliveryPrice]   = useState(0);
  const [priceLoading, setPriceLoading]     = useState(false);
  const [totalWithDelivery, setTotalWithDelivery] = useState(total);

  // ── Wilayas (dynamiques, via Anderson Express) ──────────────
  const [wilayas, setWilayas]               = useState([]);
  const [wilayasLoading, setWilayasLoading] = useState(false);

  // ── Communes (toutes les communes de la wilaya, avec has_stop_desk) ──
  const [communes, setCommunes]               = useState([]);
  const [communesLoading, setCommunesLoading] = useState(false);

  // ── Formulaire ─────────────────────────────────────────────
  const [form, setForm] = useState({
    fullName:  '',
    phone:     '',
    phone2:    '',
    wilaya:    '',
    wilayaId:  '',
    commune:   '',
    address:   '',
    notes:     '',
  });

  // ── Charger les wilayas actives au montage ─────────────────
  useEffect(() => {
    const fetchWilayas = async () => {
      setWilayasLoading(true);
      try {
        const { data } = await api.get('/anderson/wilayas');
        setWilayas(data.items || []);
      } catch (err) {
        console.error(err);
        toast.error(t('checkout.wilayas_error', null, 'Impossible de charger les wilayas'));
      } finally {
        setWilayasLoading(false);
      }
    };
    fetchWilayas();
  }, [t]);

  // ── Charger les communes quand la wilaya change ────────────
  useEffect(() => {
    if (!form.wilayaId) {
      setCommunes([]);
      return;
    }
    const fetchCommunes = async () => {
      setCommunesLoading(true);
      try {
        const { data } = await api.get('/anderson/communes', {
          params: { wilayaId: form.wilayaId },
        });
        setCommunes(data.items || []);
      } catch (err) {
        console.error(err);
        toast.error(t('checkout.communes_error', null, 'Impossible de charger les communes'));
        setCommunes([]);
      } finally {
        setCommunesLoading(false);
      }
    };
    fetchCommunes();
  }, [form.wilayaId, t]);

  // ── Communes filtrées selon le type de livraison ────────────
  const filteredCommunes = deliveryType === 'office'
    ? communes.filter(c => c.hasStopDesk)
    : communes;

  // ── Prix de livraison (via Anderson Express /get/fees) ──────
  useEffect(() => {
    const fetchPrice = async () => {
      if (!form.wilayaId) {
        setDeliveryPrice(0);
        return;
      }
      setPriceLoading(true);
      try {
        const { data } = await api.get('/anderson/delivery-price', {
          params: {
            wilayaId: form.wilayaId,
            type: deliveryType === 'office' ? 'office' : 'home',
          },
        });
        setDeliveryPrice(data.price || 0);
      } catch (err) {
        console.error(err);
        toast.error(t('checkout.price_error', null, 'Impossible de calculer le prix de livraison'));
        setDeliveryPrice(0);
      } finally {
        setPriceLoading(false);
      }
    };
    fetchPrice();
  }, [form.wilayaId, deliveryType, t]);

  useEffect(() => {
    setTotalWithDelivery(total + deliveryPrice);
  }, [total, deliveryPrice]);

  // ── Handlers ───────────────────────────────────────────────
  const handleChange = e => {
    const { name, value } = e.target;

    if (name === 'wilaya') {
      const found = wilayas.find(w => String(w.id) === value);
      setForm(prev => ({
        ...prev,
        wilayaId: value,
        wilaya:   found?.name || '',
        commune:  '', // reset commune quand la wilaya change
      }));
      return;
    }

    if (name === 'commune') {
      setForm(prev => ({ ...prev, commune: value }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);

    const stillValid = type === 'office'
      ? communes.some(c => c.name === form.commune && c.hasStopDesk)
      : communes.some(c => c.name === form.commune);

    if (form.commune && !stillValid) {
      setForm(prev => ({ ...prev, commune: '' }));
      if (type === 'office') {
        toast.info(
          t('checkout.commune_reset_stopdesk', null, 'Veuillez choisir une commune avec Stop Desk disponible.')
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.items.length === 0) return;

    // ── Validations ──────────────────────────────────────────
    if (!form.fullName || !form.phone || !form.wilaya) {
      toast.error(t('checkout.missing_fields', null, 'Remplissez tous les champs obligatoires'));
      return;
    }
    if (!isValidPhone(form.phone)) {
      toast.error(t('checkout.invalid_phone', null, 'Le numéro principal doit commencer par 05, 06 ou 07 et contenir 10 chiffres'));
      return;
    }
    if (form.phone2 && !isValidPhone(form.phone2)) {
      toast.error(t('checkout.invalid_phone2', null, 'Le second numéro doit commencer par 05, 06 ou 07 et contenir 10 chiffres'));
      return;
    }
    if (!form.commune) {
      toast.error(t('checkout.commune_needed', null, 'Veuillez sélectionner votre commune'));
      return;
    }

    // ✅ Validation spécifique : adresse obligatoire pour la livraison à domicile
    if (deliveryType === 'home' && !form.address.trim()) {
      toast.error(t('checkout.address_required', null, 'Veuillez saisir votre adresse de livraison complète'));
      return;
    }

    setLoading(true);
    try {
      // Construction de l'adresse finale
      const finalAddress = deliveryType === 'home'
        ? form.address
        : `${t('checkout.office_fallback', null, 'Retrait Stop Desk Anderson Express')} — ${form.commune}, Wilaya ${form.wilaya}`;

      // ✅ Payload enrichi avec wilayaCode
      const payload = {
        customer: {
          fullName:     form.fullName,
          phone:        form.phone,
          phone2:       form.phone2 || undefined,
          wilaya:       form.wilaya,
          wilayaCode:   Number(form.wilayaId), // ✅ Code numérique pour l'API Anderson
          commune:      form.commune,
          address:      finalAddress,
          deliveryType,
        },
        items:         cart.items,
        notes:         form.notes,
        deliveryPrice: deliveryPrice,
      };

      const res = await api.post('/orders', payload);

      // Pixel Meta
      await api.post('/meta/purchase', {
        orderNumber: res.data.orderNumber,
        totalAmount: totalWithDelivery,
        items:       cart.items,
        customer:    { phone: form.phone, phone2: form.phone2 || '' },
      }).catch(() => {});

      trackPurchase(res.data.orderNumber, totalWithDelivery, cart.items);
      dispatch({ type: 'CLEAR' });
      navigate(`/merci/${res.data.orderNumber}`);
    } catch (err) {
      console.error('Erreur:', err.response?.data);
      toast.error(err.response?.data?.message || t('checkout.order_error', null, 'Erreur lors de la commande'));
    } finally {
      setLoading(false);
    }
  };

  // ── Rendu ──────────────────────────────────────────────────
  return (
    <div>
      <Navbar />
      <div className="container checkout-page">
        <h1>{t('checkout.title')}</h1>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>{t('checkout.your_info')}</h2>

            {/* Nom & Téléphone principal */}
            <div className="form-row">
              <div className="form-group">
                <label><FaUser className="input-icon" /> {t('checkout.full_name')} *</label>
                <input
                  name="fullName" value={form.fullName} onChange={handleChange}
                  placeholder={t('checkout.full_name_placeholder')} required
                />
              </div>
              <div className="form-group">
                <label><FaPhone className="input-icon" /> {t('checkout.phone')} *</label>
                <input
                  name="phone" value={form.phone} onChange={handleChange}
                  placeholder={t('checkout.phone_placeholder')} required
                  pattern="^(05|06|07)\d{8}$"
                  title={t('checkout.phone_title')}
                />
              </div>
            </div>

            {/* Téléphone secondaire */}
            <div className="form-group">
              <label><FaPhone className="input-icon" /> {t('checkout.phone2')}</label>
              <input
                name="phone2" type="tel" value={form.phone2} onChange={handleChange}
                placeholder={t('checkout.phone_placeholder')}
                pattern="^(05|06|07)\d{8}$"
                title={t('checkout.phone_title')}
              />
            </div>

            {/* Wilaya */}
            <div className="form-row">
              <div className="form-group">
                <label><FaCity className="input-icon" /> {t('checkout.wilaya')} *</label>
                <select
                  name="wilaya"
                  value={form.wilayaId}
                  onChange={handleChange}
                  required
                  disabled={wilayasLoading}
                >
                  <option value="">
                    {wilayasLoading
                      ? t('checkout.loading_wilayas', null, 'Chargement...')
                      : t('checkout.select_wilaya')}
                  </option>
                  {wilayas.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {wilayasLoading && (
                  <span className="field-loading">
                    <FaSpinner className="spin" />
                  </span>
                )}
              </div>

              {/* Type de livraison */}
              <div className="form-group">
                <label><FaTruck className="input-icon" /> {t('checkout.delivery')} *</label>
                <div className="delivery-options">
                  {[
                    { type: 'home',   Icon: FaHome,     titleKey: 'delivery.home',   subKey: 'delivery.home_sub' },
                    { type: 'office', Icon: FaBuilding, titleKey: 'delivery.office', subKey: 'delivery.office_sub' },
                  ].map(({ type, Icon, titleKey, subKey }) => (
                    <div
                      key={type}
                      className={`delivery-card ${deliveryType === type ? 'selected' : ''}`}
                      onClick={() => handleDeliveryTypeChange(type)}
                      role="button" tabIndex={0}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleDeliveryTypeChange(type)}
                    >
                      <Icon className="delivery-icon" />
                      <div className="delivery-card-title">{t(titleKey)}</div>
                      <div className="delivery-card-subtitle">{t(subKey)}</div>
                      {form.wilayaId && type === deliveryType && (
                        <div className="delivery-price">
                          {priceLoading
                            ? <FaSpinner className="spin" />
                            : `${deliveryPrice.toLocaleString('fr-DZ')} DA`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Commune */}
            <div className="form-group">
              <label>
                <FaMapMarkerAlt className="input-icon" />{' '}
                {deliveryType === 'office'
                  ? t('checkout.bureau_label', null, 'Bureau')
                  : t('checkout.commune')} *
              </label>
              <select
                name="commune"
                value={form.commune}
                onChange={handleChange}
                required
                disabled={!form.wilayaId || communesLoading}
              >
                <option value="">
                  {!form.wilayaId
                    ? t('checkout.choose_wilaya_first')
                    : communesLoading
                      ? t('checkout.loading_communes', null, 'Chargement...')
                      : deliveryType === 'office'
                        ? t('checkout.choose_commune_stopdesk', null, 'Choisir un point Stop Desk')
                        : t('checkout.choose_commune')}
                </option>
                {filteredCommunes.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              {communesLoading && (
                <span className="field-loading">
                  <FaSpinner className="spin" />
                </span>
              )}
              {!communesLoading && form.wilayaId && deliveryType === 'office' && filteredCommunes.length === 0 && (
                <small className="error-message">
                  {t('checkout.no_stopdesk_in_wilaya', null, 'Aucun Stop Desk disponible dans cette wilaya. Choisissez la livraison à domicile.')}
                </small>
              )}
            </div>

            {/* Adresse domicile (obligatoire en mode home) */}
            {deliveryType === 'home' && (
              <div className="form-group">
                <label><FaMapMarkerAlt className="input-icon" /> {t('checkout.full_address')} *</label>
                <input
                  name="address" value={form.address} onChange={handleChange}
                  placeholder={t('checkout.address_placeholder')}
                  required // ✅ Ajout du required pour le mode home
                />
              </div>
            )}

          

            {/* Notes */}
            <div className="form-group">
              <label><FaStickyNote className="input-icon" /> {t('checkout.notes')}</label>
              <textarea
                name="notes" value={form.notes} onChange={handleChange}
                placeholder={t('checkout.notes_placeholder')} rows={3}
              />
            </div>

            <button
              type="submit"
              className="btn-primary submit-btn"
              disabled={loading || wilayasLoading || communesLoading || priceLoading}
            >
              {loading
                ? t('checkout.submitting')
                : t('checkout.confirm_button', { total: totalWithDelivery.toLocaleString('fr-DZ') })}
            </button>
          </form>

          {/* Récapitulatif commande */}
          <div className="order-recap">
            <h2>{t('checkout.your_order')}</h2>
            {cart.items.map((item, i) => (
              <div key={i} className="recap-item">
                <span className="recap-name">
                  {item.name} {item.size && `(${item.size})`} × {item.quantity}
                </span>
                <span className="recap-price">
                  {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
                </span>
              </div>
            ))}
            <div className="recap-total">
              <span>{t('checkout.items_total')}</span>
              <span>{total.toLocaleString('fr-DZ')} DA</span>
            </div>
            <div className="delivery-summary">
              <span>
                {t('checkout.delivery_price_label', {
                  type: deliveryType === 'home' ? t('delivery.home') : t('delivery.office'),
                })}
              </span>
              <span>{deliveryPrice.toLocaleString('fr-DZ')} DA</span>
            </div>
            <div className="recap-total">
              <span>{t('checkout.grand_total')}</span>
              <span>{totalWithDelivery.toLocaleString('fr-DZ')} DA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}