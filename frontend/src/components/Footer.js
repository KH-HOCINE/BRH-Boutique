import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa';
import Logo from '../images/Logo.png';
import { useT } from '../translations';

export default function Footer() {
  const t = useT();

  return (
    <footer className="footer">
      <div className="footer-brand">
        <img src={Logo} alt="Logo Boutique" className="footer-logo-image" />
        <p className="footer-copy">
          © {new Date().getFullYear()} BRH boutique — {t('footer.rights')}
        </p>
      </div>

      <div className="footer-links">
        <h4>{t('footer.links_title')}</h4>
        <Link to="/boutique">{t('nav.catalog')}</Link>
        <Link to="/suivi">{t('nav.tracking')}</Link>
        <Link to="/customiser">{t('footer.customizer')}</Link>
      </div>

      <div className="footer-social">
        <h4>{t('footer.social_title')}</h4>
        <div className="social-icons">
          <a href="https://www.facebook.com/share/1CgeUZmd24/" target="_blank" rel="noreferrer">
            <FaFacebookF /> <span>Facebook</span>
          </a>
          <a href="https://www.instagram.com/brh.boutique?igsh=MWd3aDB2ODZrMTg5ZA==" target="_blank" rel="noreferrer">
            <FaInstagram /> <span>Instagram</span>
          </a>
          <a
            href="https://www.tiktok.com/@brhboutique?_r=1&_t=ZS-97wu3TSoeo9"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <FaTiktok />
            <span>TikTok</span>
          </a>
        </div>
      </div>
    </footer>
  );
}