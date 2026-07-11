// AdminOrders.js
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../utils/api';
import tshirtImg from '../images/tshirt.jpg'; // ✅ pour l'aperçu personnalisé
import './AdminOrders.css';

import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaHome,
  FaBuilding,
  FaBox,
  FaTruck,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaShippingFast,
  FaUndo,
  FaPlus,
  FaSave,
  FaTimesCircle,
  FaUser,
  FaSpinner,
} from 'react-icons/fa';

const STATUSES = ['Tous', 'En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];
const STATUS_OPTIONS = ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];
const BADGE = {
  'En attente': 'badge badge-pending',
  'Confirmée':  'badge badge-confirmed',
  'Expédiée':   'badge badge-shipped',
  'Livrée':     'badge badge-delivered',
  'Annulée':    'badge badge-cancelled',
};
const EMPTY_ITEM = { name: '', price: 0, quantity: 1, size: '', fit: '', color: '', image: '', custom: false, note: '', designImages: [] };

export default function AdminOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('Tous');
  const [search,   setSearch]   = useState('');
  const [sortKey,  setSortKey]  = useState('createdAt');
  const [sortDir,  setSortDir]  = useState(-1);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 20;

  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [draft,    setDraft]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  /* ── Territoires (Anderson Express) ───────── */
  const [wilayas, setWilayas]                 = useState([]);
  const [communes, setCommunes]               = useState([]);
  const [wilayasLoading, setWilayasLoading]   = useState(false);
  const [communesLoading, setCommunesLoading] = useState(false);

  /* ── Chargement des commandes ───────────────── */
  const fetchOrders = () => {
    setLoading(true);
    api.get('/orders', { params: { limit: 500 } })
      .then(r => setOrders(r.data.orders))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchOrders(); }, []);

  /* ── Charger les wilayas ─────── */
  useEffect(() => {
    const fetchWilayas = async () => {
      setWilayasLoading(true);
      try {
        const { data } = await api.get('/anderson/wilayas');
        setWilayas(data.items || []);
      } catch (err) {
        console.error(err);
        toast.error('Impossible de charger les wilayas');
      } finally {
        setWilayasLoading(false);
      }
    };
    fetchWilayas();
  }, []);

  /* ── Charger les communes (avec info Stop Desk) ── */
  useEffect(() => {
    if (!editMode || !draft?.customer?.wilayaId) {
      setCommunes([]);
      return;
    }
    const fetchCommunes = async () => {
      setCommunesLoading(true);
      try {
        const { data } = await api.get('/anderson/communes', {
          params: { wilayaId: draft.customer.wilayaId },
        });
        setCommunes(data.items || []);
      } catch (err) {
        console.error(err);
        toast.error('Impossible de charger les communes');
        setCommunes([]);
      } finally {
        setCommunesLoading(false);
      }
    };
    fetchCommunes();
  }, [editMode, draft?.customer?.wilayaId]);

  /* ── Communes filtrées selon le type de livraison ── */
  const filteredCommunes = draft?.customer?.deliveryType === 'office'
    ? communes.filter(c => c.hasStopDesk)
    : communes;

  /* ── Filtrage + tri ───────── */
  const displayed = useMemo(() => {
    let list = orders.filter(o => {
      const matchFilter = filter === 'Tous' || o.status === filter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        (o.customer.phone2 || '').includes(q) ||
        o.customer.wilaya.toLowerCase().includes(q) ||
        o.customer.commune.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
    list = [...list].sort((a, b) => {
      let av, bv;
      if (sortKey === 'name')        { av = a.customer.fullName; bv = b.customer.fullName; }
      else if (sortKey === 'wilaya') { av = a.customer.wilaya;   bv = b.customer.wilaya; }
      else                           { av = a[sortKey];           bv = b[sortKey]; }
      if (typeof av === 'number') return (av - bv) * sortDir;
      return String(av || '').localeCompare(String(bv || '')) * sortDir;
    });
    return list;
  }, [orders, filter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / PER_PAGE));
  const pageSlice  = displayed.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1); else { setSortKey(key); setSortDir(1); }
    setPage(1);
  };
  const si = (k) => sortKey === k ? (sortDir === 1 ? ' ↑' : ' ↓') : ' ↕';

  /* ── Stats ───────────────── */
  const stats = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'En attente').length,
    delivered: orders.filter(o => o.status === 'Livrée').length,
    revenue:   orders.filter(o => o.status !== 'Annulée').reduce((s, o) => s + o.totalAmount, 0),
  }), [orders]);

  /* ── Gestion modal ───────── */
  const closeModal = () => {
    setModalOpen(false);
    setEditMode(false);
    setDraft(null);
    setSelected(null);
  };

  const selectOrder = (order) => {
    setSelected(order);
    setEditMode(false);
    setDraft(null);
    setModalOpen(true);
  };

  const prepareDraft = (order) => {
    const d = JSON.parse(JSON.stringify(order));
    const foundWilaya = wilayas.find(w => w.name === d.customer.wilaya);
    d.customer.wilayaId = foundWilaya?.id || '';
    return d;
  };

  const openEdit = (order) => {
    setSelected(order);
    setDraft(prepareDraft(order));
    setEditMode(true);
    setModalOpen(true);
  };

  const startEdit = () => {
    setDraft(prepareDraft(selected));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditMode(false);
  };

  /* ── Helpers édition ─────── */
  const setCustomer = (field, value) =>
    setDraft(d => {
      if (!d) return d;

      if (field === 'wilayaId') {
        const found = wilayas.find(w => w.id === value);
        return {
          ...d,
          customer: {
            ...d.customer,
            wilayaId: value,
            wilaya: found?.name || '',
            commune: '',
          },
        };
      }

      if (field === 'commune') {
        return { ...d, customer: { ...d.customer, commune: value } };
      }

      if (field === 'deliveryType') {
        // Si on passe en Stop Desk et que la commune actuelle n'en a pas, on la réinitialise
        const stillValid = value === 'office'
          ? communes.some(c => c.name === d.customer.commune && c.hasStopDesk)
          : true;
        return {
          ...d,
          customer: {
            ...d.customer,
            deliveryType: value,
            ...(stillValid ? {} : { commune: '' }),
          },
        };
      }

      return { ...d, customer: { ...d.customer, [field]: value } };
    });

  const setItem = (idx, field, value) =>
    setDraft(d => {
      const items = [...d.items];
      items[idx] = { ...items[idx], [field]: (field === 'price' || field === 'quantity') ? Number(value) : value };
      return { ...d, items };
    });

  const addItem    = () => setDraft(d => ({ ...d, items: [...d.items, { ...EMPTY_ITEM }] }));
  const removeItem = (idx) => setDraft(d => ({ ...d, items: d.items.filter((_, i) => i !== idx) }));

  const draftSubtotal = draft ? draft.items.reduce((s, i) => s + (Number(i.price)||0)*(Number(i.quantity)||0), 0) : 0;
  const draftTotal    = draft ? draftSubtotal + (Number(draft.deliveryPrice)||0) : 0;

  const saveEdit = async () => {
    if (!draft.items.length) return toast.error('Au moins 1 article requis');
    setSaving(true);
    try {
      const { data } = await api.put(`/orders/${draft._id}`, {
        customer: {
          fullName:     draft.customer.fullName,
          phone:        draft.customer.phone,
          phone2:       draft.customer.phone2,
          email:        draft.customer.email,
          wilaya:       draft.customer.wilaya,
          commune:      draft.customer.commune,
          address:      draft.customer.address,
          deliveryType: draft.customer.deliveryType,
        },
        items:         draft.items,
        notes:         draft.notes,
        deliveryPrice: Number(draft.deliveryPrice) || 0,
        status:        draft.status,
      });
      toast.success('Commande mise à jour ✓');
      setSelected(data);
      setEditMode(false);
      setDraft(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Statut mis à jour');
      fetchOrders();
      if (selected?._id === id) setSelected(p => ({ ...p, status }));
    } catch { toast.error('Erreur'); }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Supprimer cette commande définitivement ?')) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Commande supprimée');
      closeModal();
      fetchOrders();
    } catch { toast.error('Erreur'); }
  };

  /* ── Rendu ───────────────── */
  return (
    <AdminLayout>
      <h1 className="page-title">Commandes</h1>

      {/* Statistiques */}
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-val">{stats.total}</span>
          <span className="stat-lbl">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-val">{stats.pending}</span>
          <span className="stat-lbl">En attente</span>
        </div>
        <div className="stat-card">
          <span className="stat-val">{stats.delivered}</span>
          <span className="stat-lbl">Livrées</span>
        </div>
        <div className="stat-card revenue">
          <span className="stat-val">{stats.revenue.toLocaleString('fr-DZ')} DA</span>
          <span className="stat-lbl">Chiffre d'affaires</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher nom, téléphone, wilaya, N° commande…"
          />
        </div>
        <div className="filter-pills">
          {STATUSES.map(s => (
            <button key={s} className={`pill ${filter === s ? 'active' : ''}`}
              onClick={() => { setFilter(s); setPage(1); }}>{s}</button>
          ))}
        </div>
      </div>

      {/* ── TABLEAU ── */}
      <div className="table-section">
        <div className="tbl-wrap">
          {loading ? (
            <div className="spinner" style={{ margin: '60px auto' }} />
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('orderNumber')}>N° commande{si('orderNumber')}</th>
                  <th onClick={() => handleSort('name')}>Nom et prénom{si('name')}</th>
                  <th>Tél 1</th>
                  <th>Tél 2</th>
                  <th onClick={() => handleSort('wilaya')}>Wilaya / Commune{si('wilaya')}</th>
                  <th>Livraison</th>
                  <th className="text-right" onClick={() => handleSort('totalAmount')}>Prix{si('totalAmount')}</th>
                  <th onClick={() => handleSort('status')}>Statut{si('status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.length === 0 ? (
                  <tr><td colSpan={9} className="empty-cell">Aucune commande trouvée</td></tr>
                ) : pageSlice.map(o => (
                  <tr key={o._id}
                    className={`tbl-row ${selected?._id === o._id ? 'tbl-active' : ''} ${o.status === 'Annulée' ? 'tbl-cancelled' : ''}`}
                    onClick={() => selectOrder(o)}
                  >
                    <td><span className="order-num">{o.orderNumber}</span></td>
                    <td><span className="client-name">{o.customer.fullName}</span></td>
                    <td>{o.customer.phone}</td>
                    <td className={o.customer.phone2 ? '' : 'muted-cell'}>{o.customer.phone2 || '—'}</td>
                    <td>
                      <span className="city-main">{o.customer.wilaya}</span>
                      <span className="city-sub">{o.customer.commune}</span>
                    </td>
                    <td>
                      <span className="delivery-type">
                        {o.customer.deliveryType === 'home' ? (
                          <><FaHome /> Domicile</>
                        ) : (
                          <><FaBuilding /> Stop Desk</>
                        )}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="price-total">{o.totalAmount.toLocaleString('fr-DZ')} DA</span>
                      <span className="price-detail">
                        {(o.subtotal ?? 0).toLocaleString('fr-DZ')} + {(o.deliveryPrice ?? 0).toLocaleString('fr-DZ')} livr.
                      </span>
                    </td>
                    <td><span className={BADGE[o.status] || 'badge'}>{o.status}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="row-actions">
                        <button className="icon-btn" title="Modifier" onClick={() => openEdit(o)}>
                          <FaEdit />
                        </button>
                        <button className="icon-btn icon-del" title="Supprimer" onClick={() => deleteOrder(o._id)}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span className="pag-info">
            {displayed.length === 0 ? '0' : `${(page-1)*PER_PAGE+1}–${Math.min(page*PER_PAGE, displayed.length)}`} sur {displayed.length} commandes
          </span>
          <div className="pag-btns">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className={`pag-btn ${page === i+1 ? 'active' : ''}`}
                onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODAL ── */}
      {modalOpen && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="order-detail">
              {/* En-tête */}
              <div className="detail-header">
                <h2>{selected.orderNumber}</h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {!editMode && (
                    <>
                      <button className="action-btn edit-btn" onClick={startEdit}>
                        <FaEdit /> Modifier
                      </button>
                      <button className="action-btn delete-btn" onClick={() => deleteOrder(selected._id)}>
                        <FaTrash /> Supprimer
                      </button>
                    </>
                  )}
                  <button className="close-btn" onClick={closeModal}>
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* MODE LECTURE */}
              {!editMode && (
                <>
                  <div className="detail-section">
                    <h3><FaUser /> Client</h3>
                    <p><strong>{selected.customer.fullName}</strong></p>
                    <p><FaPhone /> {selected.customer.phone}</p>
                    {selected.customer.phone2 && <p><FaPhoneAlt /> Secondaire : {selected.customer.phone2}</p>}
                    {selected.customer.email  && <p><FaEnvelope /> {selected.customer.email}</p>}
                    <p><FaMapMarkerAlt /> {selected.customer.commune}, {selected.customer.wilaya}</p>
                    <p>{selected.customer.address}</p>
                    <p><FaTruck /> {selected.customer.deliveryType === 'home' ? 'À domicile' : 'Stop Desk Anderson Express'}</p>
                  </div>

                  <div className="detail-section">
                    <h3><FaBox /> Articles</h3>
                    {selected.items.map((item, i) => (
                      <div key={i} className="detail-item">
                        {/* ── Aperçu du produit ── */}
                        {item.custom && item.designImages && item.designImages.length > 0 ? (
                          // ✅ Cas personnalisé : aperçu t-shirt + design
                          <div className="tshirt-preview-group">
                            {item.designImages.map((url, idx) => (
                              <div key={idx} className="tshirt-preview-wrapper">
                                <div
                                  className="tshirt-preview"
                                  style={{ backgroundImage: `url(${tshirtImg})` }}
                                >
                                  <img
                                    src={url}
                                    alt={`Design ${idx === 0 ? 'devant' : 'dos'}`}
                                    className="design-on-tshirt"
                                  />
                                  <span className="side-label">
                                    {idx === 0 ? 'Devant' : 'Dos'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // ✅ Cas produit standard : image du produit
                          <img
                            src={item.image || 'https://via.placeholder.com/50x50/f5f5f5/999?text=?'}
                            alt={item.name}
                            className="detail-item-image"
                          />
                        )}

                        <div className="detail-item-info">
                          <span className="detail-item-name">
                            {item.name}
                            {item.size && ` (${item.size})`}
                            {item.fit && ` - ${item.fit}`}
                            {item.color && ` - ${item.color}`}
                          </span>
                          <span className="detail-item-qty">x{item.quantity}</span>
                        </div>
                        <span className="detail-item-price">
                          {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
                        </span>
                      </div>
                    ))}
                    <div className="detail-shipping"><span><FaBox /> Sous-total</span><span>{(selected.subtotal ?? 0).toLocaleString('fr-DZ')} DA</span></div>
                    <div className="detail-shipping"><span><FaTruck /> Livraison</span><span>{(selected.deliveryPrice ?? 0).toLocaleString('fr-DZ')} DA</span></div>
                    <div className="detail-total"><span><FaMoneyBillWave /> Total TTC</span><span>{selected.totalAmount.toLocaleString('fr-DZ')} DA</span></div>
                  </div>

                  {selected.notes && (
                    <div className="detail-section">
                      <h3><FaClipboardList /> Notes</h3>
                      <p className="notes-text">{selected.notes}</p>
                    </div>
                  )}

                  <div className="detail-section">
                    <h3><FaUndo /> Changer le statut</h3>
                    <div className="status-btns">
                      {STATUS_OPTIONS.map(s => {
                        let icon;
                        switch (s) {
                          case 'En attente': icon = <FaClock />; break;
                          case 'Confirmée': icon = <FaCheckCircle />; break;
                          case 'Expédiée': icon = <FaShippingFast />; break;
                          case 'Livrée': icon = <FaCheckCircle />; break;
                          case 'Annulée': icon = <FaBan />; break;
                          default: icon = null;
                        }
                        return (
                          <button key={s} className={`status-btn ${selected.status === s ? 'active' : ''}`}
                            onClick={() => updateStatus(selected._id, s)}>
                            {icon} {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3><FaCalendarAlt /> Informations</h3>
                    <p>📅 {new Date(selected.createdAt).toLocaleDateString('fr-DZ')} à {new Date(selected.createdAt).toLocaleTimeString('fr-DZ')}</p>
                    {selected.notificationSent && <p><FaEnvelope /> Email envoyé</p>}
                  </div>
                </>
              )}

              {/* MODE ÉDITION */}
              {editMode && draft && (
                <>
                  <div className="detail-section">
                    <h3><FaUser /> Client</h3>
                    <div className="edit-grid">
                      <label>Nom complet<input value={draft.customer.fullName} onChange={e => setCustomer('fullName', e.target.value)} /></label>
                      <label>Tél principal<input value={draft.customer.phone} onChange={e => setCustomer('phone', e.target.value)} /></label>
                      <label>Tél secondaire<input value={draft.customer.phone2 || ''} onChange={e => setCustomer('phone2', e.target.value)} placeholder="Optionnel" /></label>
                      <label>Email<input value={draft.customer.email || ''} onChange={e => setCustomer('email', e.target.value)} /></label>

                      <label>
                        Wilaya
                        <select
                          value={draft.customer.wilayaId || ''}
                          onChange={e => setCustomer('wilayaId', e.target.value)}
                          disabled={wilayasLoading}
                        >
                          <option value="">
                            {wilayasLoading
                              ? 'Chargement…'
                              : (draft.customer.wilaya || 'Sélectionner une wilaya')}
                          </option>
                          {wilayas.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                        {wilayasLoading && <span className="field-loading"><FaSpinner className="spin" /></span>}
                      </label>

                      <label>
                        Commune
                        <select
                          value={draft.customer.commune || ''}
                          onChange={e => setCustomer('commune', e.target.value)}
                          disabled={!draft.customer.wilayaId || communesLoading}
                        >
                          <option value="">
                            {!draft.customer.wilayaId
                              ? "Choisir une wilaya d'abord"
                              : communesLoading
                                ? 'Chargement…'
                                : (draft.customer.commune || 'Sélectionner une commune')}
                          </option>
                          {filteredCommunes.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        {communesLoading && <span className="field-loading"><FaSpinner className="spin" /></span>}
                        {!communesLoading && draft.customer.deliveryType === 'office' && draft.customer.wilayaId && filteredCommunes.length === 0 && (
                          <small className="error-message">Aucun Stop Desk Anderson Express disponible dans cette wilaya</small>
                        )}
                      </label>

                      <label className="full-width">Adresse<input value={draft.customer.address} onChange={e => setCustomer('address', e.target.value)} /></label>

                      <label>Livraison
                        <select value={draft.customer.deliveryType} onChange={e => setCustomer('deliveryType', e.target.value)}>
                          <option value="home">À domicile</option>
                          <option value="office">Stop Desk Anderson</option>
                        </select>
                      </label>
                    </div>

                    {draft.customer.deliveryType === 'office' && (
                      <p className="zr-info-text" style={{ marginTop: 12 }}>
                        Retrait au point Stop Desk Anderson Express de la commune sélectionnée.
                      </p>
                    )}
                  </div>

                  <div className="detail-section">
                    <h3><FaBox /> Articles</h3>
                    {draft.items.map((item, idx) => (
                      <div key={idx} className="edit-item-block">
                        <div className="edit-item-header">
                          <span className="edit-item-num">Article {idx + 1}</span>
                          <button className="remove-item-btn" onClick={() => removeItem(idx)}>
                            <FaTimesCircle /> Supprimer
                          </button>
                        </div>
                        <div className="edit-grid">
                          <label className="full-width">Nom du produit<input value={item.name} onChange={e => setItem(idx, 'name', e.target.value)} /></label>
                          <label>Prix (DA)<input type="number" min="0" value={item.price} onChange={e => setItem(idx, 'price', e.target.value)} /></label>
                          <label>Quantité<input type="number" min="1" value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} /></label>
                          <label>Taille<input value={item.size || ''} onChange={e => setItem(idx, 'size', e.target.value)} placeholder="M, L, XL…" /></label>
                          <label>Coupe<input value={item.fit || ''} onChange={e => setItem(idx, 'fit', e.target.value)} placeholder="Regular, Slim…" /></label>
                          <label>Couleur<input value={item.color || ''} onChange={e => setItem(idx, 'color', e.target.value)} /></label>
                          <label className="full-width">URL image<input value={item.image || ''} onChange={e => setItem(idx, 'image', e.target.value)} placeholder="https://…" /></label>
                          <label className="full-width">Note custom<input value={item.note || ''} onChange={e => setItem(idx, 'note', e.target.value)} /></label>
                        </div>
                      </div>
                    ))}
                    <button className="add-item-btn" onClick={addItem}>
                      <FaPlus /> Ajouter un article
                    </button>
                    <div className="detail-shipping" style={{ marginTop: 12 }}><span><FaBox /> Sous-total</span><span>{draftSubtotal.toLocaleString('fr-DZ')} DA</span></div>
                    <div className="detail-shipping">
                      <span><FaTruck /> Livraison (DA)</span>
                      <input className="delivery-input" type="number" min="0" value={draft.deliveryPrice}
                        onChange={e => setDraft(d => ({ ...d, deliveryPrice: Number(e.target.value) }))} />
                    </div>
                    <div className="detail-total"><span><FaMoneyBillWave /> Total TTC</span><span>{draftTotal.toLocaleString('fr-DZ')} DA</span></div>
                  </div>

                  <div className="detail-section">
                    <h3><FaClipboardList /> Notes</h3>
                    <textarea className="notes-textarea" value={draft.notes || ''} rows={3}
                      onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} />
                  </div>

                  <div className="detail-section">
                    <h3><FaUndo /> Statut</h3>
                    <select className="status-select" value={draft.status}
                      onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="edit-actions">
                    <button className="save-btn" onClick={saveEdit} disabled={saving}>
                      <FaSave /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    <button className="cancel-btn" onClick={cancelEdit}>
                      <FaTimes /> Annuler
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}