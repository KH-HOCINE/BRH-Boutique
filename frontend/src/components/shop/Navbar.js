import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSearch } from '../../context/SearchContext';
import { useLang, LANGUAGES } from '../../context/LanguageContext';
import { useT } from '../../translations';
import Logo from '../../images/Logo.png';
import './Navbar.css';

export default function Navbar() {
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm } = useSearch();
  const { lang, setLang } = useLang();
  const t = useT();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (pathname !== '/boutique') {
      navigate('/boutique');
    }
    setMenuOpen(false);
    setMobileSearchOpen(false);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
    setMobileLangOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((v) => !v);
    setMobileSearchOpen(false);
    setMobileLangOpen(false);
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen((v) => !v);
    setMobileLangOpen(false);
    setMenuOpen(false);
  };

  const toggleMobileLang = () => {
    setMobileLangOpen((v) => !v);
    setMobileSearchOpen(false);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">

        {/* Bouton hamburger — visible sur mobile uniquement */}
        <button
          className={`hamburger-btn${menuOpen ? ' is-open' : ''}`}
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Bouton traduction — visible sur mobile uniquement */}
        <button
          className={`lang-toggle-btn${mobileLangOpen ? ' is-active' : ''}`}
          onClick={toggleMobileLang}
          aria-label="Changer de langue"
          aria-expanded={mobileLangOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="3" width="12" height="14" rx="2" />
            <text x="9" y="13.5" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="700">A</text>
            <path d="M11 13h9a2 2 0 012 2v6a2 2 0 01-2 2h-9a2 2 0 01-2-2v-6a2 2 0 012-2z" />
            <path d="M14.3 17l1.7 3.6 1.7-3.6M14.7 19.3h2.6" strokeWidth="1.3" />
          </svg>
        </button>

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

        {/* Formulaire de recherche desktop */}
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

        {/* Icône recherche — visible sur mobile uniquement */}
        <button
          className="search-toggle-btn"
          onClick={toggleMobileSearch}
          aria-label="Rechercher"
          aria-expanded={mobileSearchOpen}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="10" cy="10" r="7" />
            <line x1="21" y1="21" x2="15" y2="15" />
          </svg>
        </button>

        {/* Sélecteur de langue desktop */}
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

      </div>

      {/* Barre de recherche mobile déroulante */}
      {mobileSearchOpen && (
        <form className="mobile-search-bar" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            autoFocus
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
      )}

      {/* Menu langue mobile déroulant */}
      {mobileLangOpen && (
        <div className="mobile-lang-menu">
          {Object.values(LANGUAGES).map(({ code, label }) => (
            <button
              key={code}
              className={`lang-btn${lang === code ? ' lang-btn--active' : ''}`}
              onClick={() => { setLang(code); setMobileLangOpen(false); }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Menu mobile déroulant — seulement les liens */}
     {/* Menu mobile déroulant */}
{menuOpen && (
  <div className="mobile-menu">
    <Link to="/boutique"    className={pathname === '/boutique'    ? 'active' : ''} onClick={closeMenu}>Catalogue</Link>
    <Link to="/suivi"       className={pathname === '/suivi'       ? 'active' : ''} onClick={closeMenu}>Suivre ma commande</Link>
    <Link to="/customiser"  className={pathname === '/customiser'  ? 'active' : ''} onClick={closeMenu}>Customiser</Link>
  </div>
)}
    </nav>
  );
}