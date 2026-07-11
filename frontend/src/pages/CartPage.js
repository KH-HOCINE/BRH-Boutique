import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/shop/Navbar';
import { useCart } from '../context/CartContext';
import { trackInitiateCheckout } from '../utils/metaPixel';
import { useT } from '../translations';
import './CartPage.css';

export default function CartPage() {
  const { cart, dispatch, total, itemCount } = useCart();
  const navigate = useNavigate();
  const t = useT();

  const handleCheckout = () => {
    trackInitiateCheckout(cart.items, total);
    navigate('/commande');
  };

  if (itemCount === 0) return (
    <div>
      <Navbar />
      <div className="container empty-cart">
        <h2>{t('cart.empty')}</h2>
        <Link to="/boutique" className="btn-primary">{t('home.featured.cta')}</Link>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="container cart-page">
        <h1>{t('cart.title')} ({itemCount})</h1>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item, idx) => (
              <div key={idx} className="cart-item">
                <div className="cart-item-img">
                  <Link to={`/produit/${item.product}`}>
                    <img
                      src={item.image || 'https://via.placeholder.com/100x120/f5f5f5/999?text=Photo'}
                      alt={item.name}
                    />
                  </Link>
                </div>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <div className="cart-item-meta">
                    {item.size  && <span>{t('product.size')} : {item.size}</span>}
                    {item.color && <span>{t('product.color')} : {item.color}</span>}
                  </div>
                  <p className="cart-item-price">{item.price.toLocaleString('fr-DZ')} {t('common.currency')}</p>
                </div>
                <div className="cart-item-actions">
                  <div className="qty-mini">
                    <button onClick={() => dispatch({ type: 'UPDATE_QTY', payload: { index: idx, quantity: Math.max(1, item.quantity - 1) } })}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => dispatch({ type: 'UPDATE_QTY', payload: { index: idx, quantity: item.quantity + 1 } })}>+</button>
                  </div>
                  <button className="remove-btn" aria-label={t('cart.remove')} onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: idx })}>✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>{t('checkout.your_order')}</h3>
            <div className="summary-row">
              <span>{t('checkout.items_total')}</span>
              <span>{total.toLocaleString('fr-DZ')} {t('common.currency')}</span>
            </div>
            <div className="summary-row">
              <span>{t('checkout.delivery')}</span>
              <span>{t('checkout.delivery_price_label', { type: '?' })}</span>
            </div>
            <div className="summary-total">
              <span>{t('cart.total')}</span>
              <span>{total.toLocaleString('fr-DZ')} {t('common.currency')}</span>
            </div>
            <button className="btn-primary checkout-btn" onClick={handleCheckout}>
              {t('cart.checkout')}
            </button>
            <Link to="/boutique" className="continue-link">← {t('cart.continue')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}