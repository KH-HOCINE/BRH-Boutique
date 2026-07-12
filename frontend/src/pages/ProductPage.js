import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/shop/Navbar';
import { useCart } from '../context/CartContext';
import { trackViewContent, trackAddToCart } from '../utils/metaPixel';
import api from '../utils/api';
import { useT } from '../translations';
import './ProductPage.css';
import tshirtImg from '../images/tshirt.jpg';

const SIZE_ORDER   = ['6ans','8ans','10ans','12ans','14ans/Xs','S','M','L','XL','XXL'];
const CHILD_SIZES  = ['6ans','8ans','10ans','12ans','14ans/Xs'];

const SIZE_GUIDE_DATA = [
  { size: 'S',   a: 70, b: 52 },
  { size: 'M',   a: 73, b: 55 },
  { size: 'L',   a: 75, b: 57 },
  { size: 'XL',  a: 76, b: 60 },
  { size: 'XXL', a: 78, b: 62 },
];

export default function ProductPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { dispatch } = useCart();
  const t = useT();

  const [product, setProduct]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [imgIndex, setImgIndex]           = useState(0);
  const [size,  setSize]                  = useState('');
  const [fit,   setFit]                   = useState('');
  const [color, setColor]                 = useState('');
  const [qty,   setQty]                   = useState(1);
  const [lightboxOpen, setLightboxOpen]   = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const getCurrentPrice = () => {
    if (!product) return 0;
    if (!size) return product.priceChild;
    if (CHILD_SIZES.includes(size)) return product.priceChild;
    return product.priceAdult;
  };

  const currentPrice = getCurrentPrice();

  useEffect(() => {
    if (size && CHILD_SIZES.includes(size)) {
      setFit('');
    }
  }, [size]);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data);
        trackViewContent(res.data);
      })
      .catch(() => navigate('/boutique'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxOpen)   setLightboxOpen(false);
        if (sizeGuideOpen)  setSizeGuideOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, sizeGuideOpen]);

  useEffect(() => {
    if (lightboxOpen || sizeGuideOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen, sizeGuideOpen]);

  const nextImage = () => {
    if (product?.images?.length > 1) {
      setImgIndex(prev => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.length > 1) {
      setImgIndex(prev => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !size) {
      toast.warning(t('product.size_needed'));
      return;
    }
    if (product.fits?.length > 0 && !fit && !CHILD_SIZES.includes(size)) {
      toast.warning(t('product.fit_needed'));
      return;
    }
    if (product.colors?.length > 0 && !color) {
      toast.warning(t('product.color_needed') || 'Veuillez sélectionner une couleur');
      return;
    }
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product: product._id,
        name:    product.name,
        price:   currentPrice,
        image:   product.images?.[0] || '',
        size, fit, color, quantity: qty,
      },
    });
    trackAddToCart(product, qty);
    toast.success(t('product.added_to_cart'));
  };

  const openLightbox  = () => setLightboxOpen(true);
  const closeLightbox = () => setLightboxOpen(false);

  const getSizeGuideRows = () => {
    if (!product?.sizes?.length) return SIZE_GUIDE_DATA;
    return SIZE_GUIDE_DATA.filter(row => product.sizes.includes(row.size));
  };

  if (loading) return <><Navbar /><div className="spinner" /></>;
  if (!product) return null;

  const imgSrc = (idx) =>
    product.images?.[idx] || 'https://via.placeholder.com/600x750/f5f5f5/999?text=Photo';

  const hasMultipleImages = product.images?.length > 1;
  const isChildSize       = size && CHILD_SIZES.includes(size);
  const sizeGuideRows     = getSizeGuideRows();

  return (
    <div>
      <Navbar />
      <div className="container product-page">
        <div className="product-images">
          <div className="image-slider">
            <div className="main-image">
              <img
                src={imgSrc(imgIndex)}
                alt={product.name}
                onClick={openLightbox}
                style={{ cursor: 'pointer' }}
              />
            </div>
            {hasMultipleImages && (
              <>
                <button
                  className="nav-arrow prev"
                  onClick={prevImage}
                  aria-label={t('image.previous')}
                >‹</button>
                <button
                  className="nav-arrow next"
                  onClick={nextImage}
                  aria-label={t('image.next')}
                >›</button>
              </>
            )}
          </div>
          {hasMultipleImages && (
            <div className="thumbnails">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  className={`thumb ${i === imgIndex ? 'active' : ''}`}
                  onClick={() => setImgIndex(i)}
                >
                  <img src={imgSrc(i)} alt={`vue ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-details">
          <span className="product-cat">{product.category}</span>
          <h1 className="product-title">{product.name}</h1>
          <p className="product-price-big">
            {currentPrice.toLocaleString('fr-DZ')} {t('common.currency')}
          </p>

          {product.description && (
            <p className="product-desc">{product.description}</p>
          )}

          {product.sizes?.length > 0 && (
            <div className="selector-group">
              <div className="selector-label-row">
                <p className="selector-label">{t('product.size')}</p>
                <button
                  className="size-guide-link"
                  onClick={() => setSizeGuideOpen(true)}
                >
                  {t('product.size_guide')}
                </button>
              </div>
              <div className="size-options">
                {[...product.sizes]
                  .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b))
                  .map(s => (
                    <button
                      key={s}
                      className={`size-btn ${size === s ? 'active' : ''}`}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </button>
                  ))}
              </div>
              <p className="size-helper-text">{t('product.size_helper_text')}</p>
            </div>
          )}

          {product.fits?.length > 0 && !isChildSize && (
            <div className="selector-group">
              <p className="selector-label">{t('product.fit')}</p>
              <div className="size-options">
                {product.fits.map(f => (
                  <button
                    key={f}
                    className={`size-btn ${fit === f ? 'active' : ''}`}
                    onClick={() => setFit(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="selector-group">
              <p className="selector-label">{t('product.color')}</p>
              <div className="color-options">
                {product.colors.map(c => (
                  <button
                    key={c}
                    className={`color-btn ${color === c ? 'active' : ''}`}
                    onClick={() => setColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="selector-group">
            <p className="selector-label">{t('product.quantity')}</p>
            <div className="qty-controls">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>

          {product.stock === 0 ? (
            <button className="btn-primary add-btn" disabled>
              {t('product.out_of_stock')}
            </button>
          ) : (
            <button className="btn-primary add-btn" onClick={handleAddToCart}>
              {t('product.add_to_cart')}
            </button>
          )}
        </div>
      </div>

      {/* ── Lightbox ────────────────────────────────────────── */}
      {lightboxOpen && (
        <div className="lightbox" onClick={closeLightbox}>
          <button
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label={t('image.close')}
          >×</button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={imgSrc(imgIndex)} alt={product.name} />
          </div>
          {hasMultipleImages && (
            <>
              <button
                className="lightbox-nav prev"
                onClick={e => { e.stopPropagation(); prevImage(); }}
                aria-label={t('image.previous')}
              >‹</button>
              <button
                className="lightbox-nav next"
                onClick={e => { e.stopPropagation(); nextImage(); }}
                aria-label={t('image.next')}
              >›</button>
            </>
          )}
          {hasMultipleImages && (
            <div className="lightbox-counter">
              {imgIndex + 1} / {product.images.length}
            </div>
          )}
        </div>
      )}

      {/* ── Guide des tailles ───────────────────────────────── */}
      {sizeGuideOpen && (
        <div
          className="size-guide-overlay"
          onClick={() => setSizeGuideOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('size_guide.title')}
        >
          <div
            className="size-guide-modal"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="size-guide-close"
              onClick={() => setSizeGuideOpen(false)}
              aria-label={t('image.close')}
            >×</button>
            {/* SUPPRESSION DE LA LIGNE size-guide-ref */}
            <h2 className="size-guide-title">{t('size_guide.title')}</h2>
            <p className="size-guide-subtitle">{t('size_guide.subtitle')}</p>

            <div className="size-guide-diagram">
              <div className="size-guide-diagram-img" style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={tshirtImg}
                  alt="Schéma des mesures du t-shirt"
                  style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />
                {/* Flèche verticale (longueur A) */}
                <div className="measure-arrow measure-arrow-vertical" style={{
                  position: 'absolute', left: '15%', top: '10%', bottom: '10%',
                  width: '2px', background: '#c0392b', transform: 'translateX(-50%)',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: '50%',
                    transform: 'translateX(-50%) translateY(-50%)',
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                    borderBottom: '10px solid #c0392b',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: '50%',
                    transform: 'translateX(-50%) translateY(50%)',
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                    borderTop: '10px solid #c0392b',
                  }} />
                  <span style={{
                    position: 'absolute', left: '-20px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#c0392b', fontWeight: 'bold', fontSize: '18px', fontFamily: 'Georgia, serif',
                  }}>A</span>
                </div>
                {/* Flèche horizontale (largeur B) */}
                <div className="measure-arrow measure-arrow-horizontal" style={{
                  position: 'absolute', top: '55%', left: '25%', right: '25%',
                  height: '2px', background: 'white', transform: 'translateY(-50%)',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: '50%',
                    transform: 'translateX(-50%) translateY(-50%)',
                    width: 0, height: 0,
                    borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                    borderRight: '8px solid white',
                  }} />
                  <div style={{
                    position: 'absolute', right: 0, top: '50%',
                    transform: 'translateX(50%) translateY(-50%)',
                    width: 0, height: 0,
                    borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                    borderLeft: '8px solid white',
                  }} />
                  <span style={{
                    position: 'absolute', top: '-25px', left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white', fontWeight: 'bold', fontSize: '18px', fontFamily: 'Georgia, serif',
                  }}>B</span>
                </div>
              </div>

              <div className="size-guide-diagram-legend">
                <div className="legend-item">
                  <span className="legend-key red">{t('size_guide.measure_a')}</span>
                  <p>{t('size_guide.legend_a')}</p>
                </div>
                <div className="legend-item">
                  <span className="legend-key">{t('size_guide.measure_b')}</span>
                  <p>{t('size_guide.legend_b')}</p>
                </div>
              </div>
            </div>

            <table className="size-guide-table">
              <thead>
                <tr>
                  <th>{t('size_guide.table_header_size')}</th>
                  <th>{t('size_guide.table_header_a')}</th>
                  <th>{t('size_guide.table_header_b')}</th>
                </tr>
              </thead>
              <tbody>
                {sizeGuideRows.map(row => (
                  <tr
                    key={row.size}
                    className={size === row.size ? 'size-guide-row-active' : ''}
                  >
                    <td>{row.size}</td>
                    <td>{row.a}</td>
                    <td>{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="size-guide-tip">{t('size_guide.tip')}</p>
          </div>
        </div>
      )}
    </div>
  );
}