import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../images/Logo.png'; // Import du logo
import './AdminLogin.css';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        {/* Logo */}
        <div className="login-logo-wrapper">
          <img src={logo} alt="Logo boutique" className="login-logo" />
        </div>

        <h1>Administration</h1>
        <p className="login-subtitle">Connectez-vous pour gérer votre boutique</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="exemple@boutique.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          <p>Accès réservé aux administrateurs</p>
        </div>
      </div>
    </div>
  );
}