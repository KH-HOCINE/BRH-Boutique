import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSearch } from '../../context/SearchContext';
import { useLang, LANGUAGES } from '../../context/LanguageContext';
import { useT } from '../../translations';
import Logo from '../../images/Logo.jpg';
import './Navbar.css';

export default function Navbar() {
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm } = useSearch();
  const { lang, setLang } = useLang();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (pathname !== '/boutique') {
      navigate('/boutique');
    }
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">

        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img src={Logo} alt="Logo Boutique" className="logo-image" />
        </Link>

        {/* Liens de navigation — masqués sur mobile */}
        <div className="navbar-links">
          <Link to="/"         className={pathname === '/'        ? 'active' : ''} onClick={closeMenu}>{t('nav.home')}</Link>
          <Link to="/boutique" className={pathname === '/boutique' ? 'active' : ''} onClick={closeMenu}>{t('nav.catalog')}</Link>
          <Link to="/suivi"    className={pathname === '/suivi'   ? 'active' : ''} onClick={closeMenu}>{t('nav.tracking')}</Link>
        </div>

        {/* Formulaire de recherche — masqué sur mobile */}
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder={t('nav.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-icon" aria-label="Rechercher">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7" />
              <line x1="21" y1="21" x2="15" y2="15" />
            </svg>
          </button>
        </form>

        {/* Sélecteur de langue — masqué sur mobile */}
        <div className="lang-switcher">
          {Object.values(LANGUAGES).map(({ code, label }) => (
            <button
              key={code}
              className={`lang-btn${lang === code ? ' lang-btn--active' : ''}`}
              onClick={() => setLang(code)}
              aria-label={`Langue : ${label}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Panier */}
        <Link to="/panier" className="navbar-cart" onClick={closeMenu}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </Link>

        {/* Bouton hamburger — visible sur mobile uniquement */}
        <button
          className={`hamburger-btn${menuOpen ? ' is-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

      </div>

      {/* Menu mobile déroulant */}
      {menuOpen && (
        <div className="mobile-menu">
          {/* Recherche */}
          <form className="mobile-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder={t('nav.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" aria-label="Rechercher">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7" />
                <line x1="21" y1="21" x2="15" y2="15" />
              </svg>
            </button>
          </form>

          {/* Liens */}
          <Link to="/"         className={pathname === '/'        ? 'active' : ''} onClick={closeMenu}>{t('nav.home')}</Link>
          <Link to="/boutique" className={pathname === '/boutique' ? 'active' : ''} onClick={closeMenu}>{t('nav.catalog')}</Link>
          <Link to="/suivi"    className={pathname === '/suivi'   ? 'active' : ''} onClick={closeMenu}>{t('nav.tracking')}</Link>

          {/* Langue */}
          <div className="mobile-lang">
            {Object.values(LANGUAGES).map(({ code, label }) => (
              <button
                key={code}
                className={`lang-btn${lang === code ? ' lang-btn--active' : ''}`}
                onClick={() => { setLang(code); closeMenu(); }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}