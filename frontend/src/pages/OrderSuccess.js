import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/shop/Navbar';
import Footer from '../components/Footer';   // ← ajout
import { useT } from '../translations';
import './OrderSuccess.css';

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const t = useT();

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="success-page">
        <div className="success-icon">✓</div>
        <h1>{t('success.title')}</h1>
        <p className="success-order">{t('success.order_number')} <strong>{orderNumber}</strong></p>
        <p className="success-msg">
          {t('success.message')}
        </p>
        <Link to="/boutique" className="btn-primary">{t('success.back')}</Link>
      </div>
      <Footer />
    </div>
  );
}