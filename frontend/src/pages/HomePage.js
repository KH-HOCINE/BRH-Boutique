import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import Navbar from '../components/shop/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/shop/ProductCard';

import { useT } from '../translations';

import animeBg from '../images/anime.jpg';
import tshirtImg from '../images/Tshirt noir avant.png';

import './CustomSection.css';
import './HomePage.css';

import api from '../utils/api';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const t = useT();

  useEffect(() => {
    // On demande explicitement 4 produits vedettes
    api.get('/products?featured=true&limit=4')
      .then(res => {
        // La réponse contient maintenant { products, total, ... }
        setFeatured(res.data.products || []);
      })
      .catch(err => console.error('Erreur chargement produits :', err));
  }, []);

  return (
    <>
      <Helmet>
        <title>
          BRH Boutique | Boutique de vêtements en ligne en Algérie
        </title>

        <meta
          name="description"
          content="Découvrez BRH Boutique, votre boutique de vêtements en ligne en Algérie. Vêtements tendance pour homme et femme, livraison rapide dans les 58 wilayas et paiement à la livraison."
        />

        <meta
          name="keywords"
          content="BRH Boutique, vêtements Algérie, boutique en ligne Algérie, mode homme, mode femme"
        />

        <link
          rel="canonical"
          href="https://brhboutique.store/"
        />

        <meta
          property="og:title"
          content="BRH Boutique | Boutique de vêtements en ligne en Algérie"
        />

        <meta
          property="og:description"
          content="Découvrez les dernières tendances chez BRH Boutique avec une livraison rapide partout en Algérie."
        />

        <meta
          property="og:image"
          content="https://brhboutique.store/Logo.png"
        />

        <meta
          property="og:url"
          content="https://brhboutique.store/"
        />

        <meta
          name="twitter:card"
          content="summary_large_image"
        />
      </Helmet>

      <div>
        <Navbar />

        {/* Hero */}
        <section className="hero">
          <div className="hero-content">
            <span className="hero-sub">{t('home.hero.sub')}</span>

            <h1 className="hero-title">
              {t('home.hero.title')}
            </h1>

            <p className="hero-desc">
              {t('home.hero.desc')}
            </p>

            <Link
              to="/boutique"
              className="btn-primary hero-btn"
            >
              {t('home.hero.cta')}
              <span className="arrow">→</span>
            </Link>
          </div>

          <div
            className="hero-bg"
            style={{
              backgroundImage: `url(${animeBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        </section>

        {/* Produits en vedette */}
        {featured.length > 0 && (
          <section className="section container">
            <div className="section-header">
              <h2>{t('home.featured.title')}</h2>

              <Link
                to="/boutique"
                className="see-all"
              >
                {t('home.featured.see_all')} →
              </Link>
            </div>

            <div className="products-grid">
              {featured.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                />
              ))}
            </div>

            <div className="shop-all-container">
              <Link
                to="/boutique"
                className="btn-secondary shop-all-btn"
              >
                {t('home.featured.cta')}
                <span className="arrow">→</span>
              </Link>
            </div>
          </section>
        )}

        {/* Personnalisation */}
        <section className="custom-section">
          <div className="custom-inner">

            <div className="custom-tshirt-wrap">
              <img
                src={tshirtImg}
                alt={t('home.custom.tshirt_alt')}
              />

              <div className="custom-design-zone">

                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>

                <span>
                  {t('home.custom.design_zone_label')}
                </span>

              </div>
            </div>

            <div className="custom-text">

              <span className="custom-eyebrow">
                {t('home.custom.eyebrow')}
              </span>

              <h2 className="custom-title">
                {t('home.custom.title_prefix')}
                <br />
                <em>{t('home.custom.title_em')}</em>
              </h2>

              <div className="custom-divider" />

              <p className="custom-desc">
                {t('home.custom.desc_line1')}
                <br />
                {t('home.custom.desc_line2')}
              </p>

              <Link
                to="/customiser"
                className="custom-cta"
              >
                {t('home.custom.cta')}
              </Link>

              <span className="custom-price-note">
                {t('home.custom.price_note')}
              </span>

            </div>

          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}