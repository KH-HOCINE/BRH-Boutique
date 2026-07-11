import { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../utils/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/orders/stats/summary').then(r => setStats(r.data));
    api.get('/orders?limit=5').then(r => setRecent(r.data.orders));
  }, []);

  const statusBadge = (s) => ({
    'En attente': 'badge badge-pending',
    'Confirmée':  'badge badge-confirmed',
    'Expédiée':   'badge badge-shipped',
    'Livrée':     'badge badge-delivered',
    'Annulée':    'badge badge-cancelled',
  }[s] || 'badge');

  return (
    <AdminLayout>
      <h1 className="page-title">Dashboard</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total commandes</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">En attente</span>
            <span className="stat-value warning">{stats.pending}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Confirmées</span>
            <span className="stat-value success">{stats.confirmed}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Chiffre d'affaires</span>
            <span className="stat-value">{stats.revenue.toLocaleString('fr-DZ')} DA</span>
          </div>
        </div>
      )}

      <div className="recent-orders">
        <h2>Dernières commandes</h2>
        <table className="orders-table">
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(order => (
              <tr key={order._id}>
                <td><strong>{order.orderNumber}</strong></td>
                <td>{order.customer.fullName}</td>
                <td>{order.customer.phone}</td>
                <td>{order.totalAmount.toLocaleString('fr-DZ')} DA</td>
                <td><span className={statusBadge(order.status)}>{order.status}</span></td>
                <td>{new Date(order.createdAt).toLocaleDateString('fr-DZ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
