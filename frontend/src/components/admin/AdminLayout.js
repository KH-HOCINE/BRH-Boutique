import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  FiHome,
  FiShoppingBag,
  FiPackage,
  FiExternalLink,
  FiLogOut,
  FiUser,
  FiMenu,
  FiX,
} from "react-icons/fi";

import logo from "../../images/Logo.png"; // Import du logo

import "./AdminLayout.css";

export default function AdminLayout({ children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="admin-layout">

      {/* ==========================
            Bouton Menu Mobile
      =========================== */}

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* ==========================
            Overlay Mobile
      =========================== */}

      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMenu}
        ></div>
      )}

      {/* ==========================
            Sidebar
      =========================== */}

      <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}>

        {/* Logo remplacé par l'image */}
        <div className="sidebar-logo">
          <img src={logo} alt="Logo boutique" className="sidebar-logo-img" />
        </div>

        <nav className="sidebar-nav">

          <NavLink
            to="/admin"
            end
            onClick={closeMenu}
          >
            <FiHome />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/produits"
            onClick={closeMenu}
          >
            <FiShoppingBag />
            <span>Produits</span>
          </NavLink>

          <NavLink
            to="/admin/commandes"
            onClick={closeMenu}
          >
            <FiPackage />
            <span>Commandes</span>
          </NavLink>

          <NavLink
            to="/"
            target="_blank"
            onClick={closeMenu}
          >
            <FiExternalLink />
            <span>Voir la boutique</span>
          </NavLink>

        </nav>

        <div className="sidebar-user">

          <span>
            <FiUser />
            {admin?.name || "Administrateur"}
          </span>

          <button onClick={handleLogout}>
            <FiLogOut />
            Déconnexion
          </button>

        </div>

      </aside>

      {/* ==========================
            Contenu
      =========================== */}

      <main className="admin-main">
        {children}
      </main>

    </div>
  );
}