import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/shop/Navbar';
import { useT, useLang } from '../translations';
import api from '../utils/api';
import './OrderTracking.css';

// Clés de traduction pour les statuts (correspondent aux valeurs du backend)
const STATUS_KEYS = {
  'En attente': 'tracking.status.pending',
  'Confirmée':  'tracking.status.confirmed',
  'Expédiée':   'tracking.status.shipped',
  'Livrée':     'tracking.status.delivered',
  'Annulée':    'tracking.status.cancelled',
};

const STEP_ICONS = {
  'En attente': '⏳',
  'Confirmée':  '✓',
  'Expédiée':   '🚚',
  'Livrée':     '✓',
};

// Les étapes dans l'ordre (valeurs backend fixes)
const STEPS = ['En attente', 'Confirmée', 'Expédiée', 'Livrée'];

function StatusBadge({ status }) {
  const t = useT();
  const classes = {
    'En attente': 'badge badge--pending',
    'Confirmée':  'badge badge--confirmed',
    'Expédiée':   'badge badge--shipped',
    'Livrée':     'badge badge--delivered',
    'Annulée':    'badge badge--cancelled',
  };
  return (
    <span className={classes[status] || 'badge'}>
      {t(STATUS_KEYS[status] || status)}
    </span>
  );
}

function ProgressBar({ status }) {
  const t = useT();
  const currentIndex = STEPS.indexOf(status);
  if (currentIndex === -1) return null;

  return (
    <div className="progress-bar" aria-label={t('tracking.steps.aria')}>
      {STEPS.map((step, i) => {
        const isDone   = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step} className="progress-item">
            <div
              className={`progress-circle ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {isDone || isActive ? '✓' : i + 1}
            </div>
            <div className={`progress-label ${isActive ? 'active' : ''}`}>
              {t(STATUS_KEYS[step] || step)}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`progress-connector ${isDone ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const [input,   setInput]   = useState(searchParams.get('num') || '');
  const [order,   setOrder]   = useState(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const t = useT();
  const { lang } = useLang();

  const search = async (e) => {
    e.preventDefault();
    const num = input.trim().toUpperCase();
    if (!num) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const { data } = await api.get(`/orders/track/${encodeURIComponent(num)}`);
      setOrder(data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? t('tracking.error.not_found')
          : t('tracking.error.generic')
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    const locale = lang === 'ar' ? 'ar-DZ' : lang === 'en' ? 'en-GB' : 'fr-DZ';
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  const currency = t('common.currency');
  const locale   = lang === 'ar' ? 'ar-DZ' : lang === 'en' ? 'en-DZ' : 'fr-DZ';

  return (
    <div>
      <Navbar />
      <div className="track-page container">
        <h1 className="track-title">{t('tracking.title')}</h1>
        <p className="track-sub">{t('tracking.subtitle')}</p>

        <form className="track-form" onSubmit={search}>
          <input
            type="text"
            className="track-input"
            placeholder={t('tracking.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={t('tracking.placeholder')}
          />
          <button type="submit" className="btn-primary track-btn" disabled={loading}>
            {loading ? '...' : t('tracking.search')}
          </button>
        </form>

        {error && <p className="track-error">{error}</p>}

        {order && (
          <div className="track-card">
            {/* En-tête */}
            <div className="track-card__header">
              <div>
                <p className="track-card__num">{order.orderNumber}</p>
                <p className="track-card__date">
                  {t('tracking.ordered_on')} {formatDate(order.createdAt)}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Barre de progression */}
            {order.status !== 'Annulée' && <ProgressBar status={order.status} />}
            {order.status === 'Annulée' && (
              <p className="track-cancelled">{t('tracking.cancelled_msg')}</p>
            )}

            {/* Articles */}
            <p className="track-section-label">{t('tracking.items_label')}</p>
            <div className="track-items">
              {order.items.map((item, i) => (
                <div key={i} className="track-item">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="track-item__img" />
                  )}
                  <div className="track-item__info">
                    <p className="track-item__name">{item.name}</p>
                    <p className="track-item__meta">
                      {[item.size, item.fit, item.color].filter(Boolean).join(' · ')}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </p>
                  </div>
                  <p className="track-item__price">
                    {(item.price * item.quantity).toLocaleString(locale)} {currency}
                  </p>
                </div>
              ))}
              <div className="track-total">
                <span>{t('cart.total')}</span>
                <span>{order.totalAmount.toLocaleString(locale)} {currency}</span>
              </div>
            </div>

            {/* Infos livraison */}
            <p className="track-section-label">{t('checkout.delivery')}</p>
            <div className="track-info-grid">
              <div className="track-info-cell">
                <p className="track-info-cell__label">{t('checkout.wilaya')}</p>
                <p className="track-info-cell__value">{order.customer.wilaya}</p>
              </div>
              <div className="track-info-cell">
                <p className="track-info-cell__label">{t('checkout.commune')}</p>
                <p className="track-info-cell__value">{order.customer.commune}</p>
              </div>
              <div className="track-info-cell">
                <p className="track-info-cell__label">{t('tracking.delivery_type')}</p>
                <p className="track-info-cell__value">
                  {order.customer.deliveryType === 'office'
                    ? t('tracking.delivery.office')
                    : t('tracking.delivery.home')}
                </p>
              </div>
              {order.notes && (
                <div className="track-info-cell track-info-cell--full">
                  <p className="track-info-cell__label">{t('tracking.notes')}</p>
                  <p className="track-info-cell__value">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}