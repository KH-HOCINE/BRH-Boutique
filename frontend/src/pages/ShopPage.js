import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/shop/Navbar';
import Footer from '../components/Footer';   // ← AJOUT
import ProductCard from '../components/shop/ProductCard';
import { useSearch } from '../context/SearchContext';
import api from '../utils/api';
import { useT } from '../translations';
import './ShopPage.css';

const CATEGORIES = ['T-shirt', 'Hoodie', 'Sac à dos', 'Ensemble'];

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Tous');
  const { searchTerm } = useSearch();
  const t = useT();

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== 'Tous') params.category = category;
    if (searchTerm) params.search = searchTerm;

    api.get('/products', { params })
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [category, searchTerm]);

  const grouped = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const key = p.anime?.trim() || '__other__';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });

    return Object.entries(map).sort(([a], [b]) => {
      if (a === '__other__') return 1;
      if (b === '__other__') return -1;
      return a.localeCompare(b, 'fr');
    });
  }, [products]);

  const resultsCountText = () => {
    const count = products.length;
    if (count === 0) return '';
    return count === 1
      ? t('shop.results_count', { count })
      : t('shop.results_count_plural', { count });
  };

  return (
    <div>
      <Navbar />
      <div className="container shop-page">
        <h1 className="shop-title">{t('shop.title')}</h1>

        <div className="category-filters">
          <button
            className={`filter-btn ${category === 'Tous' ? 'active' : ''}`}
            onClick={() => setCategory('Tous')}
          >
            {t('shop.filter_all')}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>{t('shop.empty_products')}</p>
          </div>
        ) : (
          <>
            <p className="results-count">
              {resultsCountText()}
            </p>

            {grouped.map(([anime, items]) => (
              <section key={anime} className="anime-section">
                <div className="anime-section-header">
                  <h2 className="anime-section-title">
                    {anime === '__other__' ? t('shop.other_anime') : anime}
                  </h2>
                  <span className="anime-count">
                    {items.length === 1
                      ? t('shop.results_count', { count: 1 })
                      : t('shop.results_count_plural', { count: items.length })}
                  </span>
                </div>
                <div className="products-grid">
                  {items.map(p => <ProductCard key={p._id} product={p} />)}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {/* ─── FOOTER AJOUTÉ ICI ─── */}
      <Footer />
    </div>
  );
}