import { Link } from 'react-router-dom';
import { useT, useLang } from '../../translations';
import './ProductCard.css';

// ⛔ Plus besoin de API_URL : les images sont des URLs Cloudinary complètes
// const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

export default function ProductCard({ product }) {
  const t = useT();
  const { lang } = useLang();

  // Les images sont maintenant des URLs absolues Cloudinary (https://...)
  // On utilise directement product.images[0] sans préfixe
  const imgSrc = product.images?.[0] || 'https://via.placeholder.com/400x500/f5f5f5/999?text=Photo';

  // Gestion des prix (rétrocompatibilité)
  const priceChild = product.priceChild ?? product.price;
  const priceAdult = product.priceAdult ?? product.price;

  // Locale selon la langue active
  const locale   = lang === 'ar' ? 'ar-DZ' : lang === 'en' ? 'en-DZ' : 'fr-DZ';
  const currency = t('common.currency');

  const priceDisplay = priceChild !== priceAdult
    ? `${priceChild.toLocaleString(locale)} - ${priceAdult.toLocaleString(locale)} ${currency}`
    : `${priceChild.toLocaleString(locale)} ${currency}`;

  return (
    <Link to={`/produit/${product._id}`} className="product-card">
      <div className="product-card-img">
        <img src={imgSrc} alt={product.name} loading="lazy" />
        {product.isFeatured && <span className="featured-tag">{t('product.featured')}</span>}
        {product.stock === 0 && <div className="sold-out">{t('product.sold_out')}</div>}
      </div>
      <div className="product-card-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{priceDisplay}</p>
      </div>
    </Link>
  );
}