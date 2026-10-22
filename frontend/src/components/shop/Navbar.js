
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

  /* ============================================================
     RECHERCHE
     ============================================================ */

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (pathname !== '/boutique') {
      navigate('/boutique');
    }

    setMenuOpen(false);
    setMobileSearchOpen(false);
  };

  /* ============================================================
     FERMER TOUS LES MENUS
     ============================================================ */

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
    setMobileLangOpen(false);
  };

  /* ============================================================
     MENU MOBILE
     ============================================================ */

  const toggleMenu = () => {
    setMenuOpen((v) => !v);
    setMobileSearchOpen(false);
    setMobileLangOpen(false);
  };

  /* ============================================================
     RECHERCHE MOBILE
     ============================================================ */

  const toggleMobileSearch = () => {
    setMobileSearchOpen((v) => !v);
    setMobileLangOpen(false);
    setMenuOpen(false);
  };

  /* ============================================================
     LANGUE MOBILE
     ============================================================ */

  const toggleMobileLang = () => {
    setMobileLangOpen((v) => !v);
    setMobileSearchOpen(false);
    setMenuOpen(false);
  };

  /* ============================================================
     LABEL ACCESSIBLE DU PANIER
     ============================================================ */

  const cartLabel =
    itemCount > 0
      ? `Panier, ${itemCount} article${itemCount > 1 ? 's' : ''}`
      : 'Panier vide';

  return (
    <nav className="navbar">
      <div className="container navbar-inner">

        {/* ======================================================
            BOUTON HAMBURGER — MOBILE UNIQUEMENT
            ====================================================== */}

        <button
          className={`hamburger-btn${menuOpen ? ' is-open' : ''}`}
          onClick={toggleMenu}
          aria-label={
            menuOpen
              ? 'Fermer le menu'
              : 'Ouvrir le menu'
          }
          aria-expanded={menuOpen}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        {/* ======================================================
            BOUTON LANGUE — MOBILE UNIQUEMENT
            Globe + A + 文
            ====================================================== */}

        <button
          className={`lang-toggle-btn${
            mobileLangOpen ? ' is-active' : ''
          }`}
          onClick={toggleMobileLang}
          aria-label="Changer de langue"
          aria-expanded={mobileLangOpen}
          type="button"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            {/* Globe central */}

            <circle
              cx="24"
              cy="24"
              r="15"
            />

            {/* Méridien gauche */}

            <path
              d="M24 9c-4.5 4-6.8 9-6.8 15s2.3 11 6.8 15"
            />

            {/* Méridien droit */}

            <path
              d="M24 9c4.5 4 6.8 9 6.8 15s-2.3 11-6.8 15"
            />

            {/* Parallèle supérieur */}

            <path
              d="M10.5 18c3.8-1.8 8.3-2.7 13.5-2.7s9.7.9 13.5 2.7"
            />

            {/* Parallèle inférieur */}

            <path
              d="M10.5 30c3.8 1.8 8.3 2.7 13.5 2.7s9.7-.9 13.5-2.7"
            />

            {/* Bulle gauche — A */}

            <path
              d="
                M4 5
                H14
                C16.2 5 18 6.8 18 9
                V14
                C18 16.2 16.2 18 14 18
                H9
                L5 21
                V18
                H4
                C1.8 18 0 16.2 0 14
                V9
                C0 6.8 1.8 5 4 5
                Z
              "
            />

            {/* Lettre A */}

            <path
              d="M5 14.2L8.8 8L12.6 14.2"
            />

            <path
              d="M6.4 12H11.2"
            />

            {/* Bulle droite — 文 */}

            <path
              d="
                M34 27
                H44
                C46.2 27 48 28.8 48 31
                V36
                C48 38.2 46.2 40 44 40
                H39
                L35 43
                V40
                H34
                C31.8 40 30 38.2 30 36
                V31
                C30 28.8 31.8 27 34 27
                Z
              "
            />

            {/* Caractère 文 */}

            <path
              d="M35 30H43"
            />

            <path
              d="M39 29V37"
            />

            <path
              d="M35.5 33H42.5"
            />

            <path
              d="M35.5 37L39 34L42.5 37"
            />
          </svg>
        </button>

        {/* ======================================================
            LOGO
            ====================================================== */}

        <Link
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
          aria-label="Accueil"
        >
          <img
            src={Logo}
            alt="Logo Boutique"
            className="logo-image"
          />
        </Link>

        {/* ======================================================
            LIENS DE NAVIGATION — DESKTOP
            ====================================================== */}

        <div className="navbar-links">

          <Link
            to="/"
            className={pathname === '/' ? 'active' : ''}
            onClick={closeMenu}
          >
            {t('nav.home')}
          </Link>

          <Link
            to="/boutique"
            className={
              pathname === '/boutique'
                ? 'active'
                : ''
            }
            onClick={closeMenu}
          >
            {t('nav.catalog')}
          </Link>

          <Link
            to="/suivi"
            className={
              pathname === '/suivi'
                ? 'active'
                : ''
            }
            onClick={closeMenu}
          >
            {t('nav.tracking')}
          </Link>

          <Link
    to="/customiser"
    className={pathname === '/customiser' ? 'active' : ''}
    onClick={closeMenu}
  >
    {t('nav.customize')}
  </Link>

        </div>

        {/* ======================================================
            FORMULAIRE DE RECHERCHE — DESKTOP
            ====================================================== */}

        <form
          className="navbar-search"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <input
            type="text"
            placeholder={t('nav.search')}
            aria-label={t('nav.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            type="submit"
            className="search-icon"
            aria-label="Rechercher"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                cx="10"
                cy="10"
                r="7"
              />

              <line
                x1="21"
                y1="21"
                x2="15"
                y2="15"
              />
            </svg>
          </button>
        </form>

        {/* ======================================================
            ICÔNE RECHERCHE — MOBILE UNIQUEMENT
            ====================================================== */}

        <button
          className="search-toggle-btn"
          onClick={toggleMobileSearch}
          aria-label="Rechercher"
          aria-expanded={mobileSearchOpen}
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx="10"
              cy="10"
              r="7"
            />

            <line
              x1="21"
              y1="21"
              x2="15"
              y2="15"
            />
          </svg>
        </button>

        {/* ======================================================
            SÉLECTEUR DE LANGUE — DESKTOP
            ====================================================== */}

        <div
          className="lang-switcher"
          role="group"
          aria-label="Choisir la langue"
        >

          {Object.values(LANGUAGES).map(
            ({ code, label }) => (
              <button
                key={code}
                className={`lang-btn${
                  lang === code
                    ? ' lang-btn--active'
                    : ''
                }`}
                onClick={() => setLang(code)}
                aria-label={`Langue : ${label}`}
                aria-pressed={lang === code}
                type="button"
              >
                {label}
              </button>
            )
          )}

        </div>

        {/* ======================================================
            PANIER
            ====================================================== */}

        <Link
          to="/panier"
          className="navbar-cart"
          onClick={closeMenu}
          aria-label={cartLabel}
        >
          <svg
            width="26"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M5 8h18l-1.5 13a1 1 0 01-1 1H7.5a1 1 0 01-1-1L5 8z"
            />

            <path
              d="M10 8V6a4 4 0 018 0v2"
            />
          </svg>

          {itemCount > 0 && (
            <span
              className="cart-badge"
              aria-hidden="true"
            >
              {itemCount}
            </span>
          )}
        </Link>

      </div>

      {/* ========================================================
          BARRE DE RECHERCHE MOBILE DÉROULANTE
          ======================================================== */}

      {mobileSearchOpen && (
        <form
          className="mobile-search-bar"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <input
            type="text"
            autoFocus
            placeholder={t('nav.search')}
            aria-label={t('nav.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            type="submit"
            aria-label="Rechercher"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                cx="10"
                cy="10"
                r="7"
              />

              <line
                x1="21"
                y1="21"
                x2="15"
                y2="15"
              />
            </svg>
          </button>
        </form>
      )}

      {/* ========================================================
          MENU LANGUE MOBILE DÉROULANT
          ======================================================== */}

      {mobileLangOpen && (
        <div
          className="mobile-lang-menu"
          role="group"
          aria-label="Choisir la langue"
        >

          {Object.values(LANGUAGES).map(
            ({ code, label }) => (
              <button
                key={code}
                className={`lang-btn${
                  lang === code
                    ? ' lang-btn--active'
                    : ''
                }`}
                onClick={() => {
                  setLang(code);
                  setMobileLangOpen(false);
                }}
                aria-label={`Langue : ${label}`}
                aria-pressed={lang === code}
                type="button"
              >
                {label}
              </button>
            )
          )}

        </div>
      )}

      {/* ========================================================
          MENU MOBILE DÉROULANT
          ======================================================== */}

      {menuOpen && (
        <div className="mobile-menu">

          <Link
            to="/boutique"
            className={
              pathname === '/boutique'
                ? 'active'
                : ''
            }
            onClick={closeMenu}
          >
            Catalogue
          </Link>

          <Link
            to="/suivi"
            className={
              pathname === '/suivi'
                ? 'active'
                : ''
            }
            onClick={closeMenu}
          >
            Suivre ma commande
          </Link>

          <Link
            to="/customiser"
            className={
              pathname === '/customiser'
                ? 'active'
                : ''
            }
            onClick={closeMenu}
          >
            Customiser
          </Link>

        </div>
      )}

    </nav>
  );
}
