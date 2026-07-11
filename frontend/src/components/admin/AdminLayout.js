import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">Admin</div>

        <nav className="sidebar-nav">
          <NavLink to="/admin"          end>📊 Dashboard</NavLink>
          <NavLink to="/admin/produits">👕 Produits</NavLink>
          <NavLink to="/admin/commandes">📦 Commandes</NavLink>
          <NavLink to="/" target="_blank">🛍️ Voir la boutique</NavLink>
        </nav>

        <div className="sidebar-user">
          <span>{admin?.name}</span>
          <button onClick={handleLogout}>Déconnexion</button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
