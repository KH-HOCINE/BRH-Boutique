import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../utils/api';
import tshirtNoirAvant from '../images/Tshirt noir avant.png';
import tshirtNoirArriere from '../images/Tshirt noir arriere.png';
import tshirtBlancAvant from '../images/Tshirt blanc avant.png';
import tshirtBlancArriere from '../images/Tshirt blanc arriere.png';
import './AdminDashboard.css';
import './AdminOrders.css'; // ✅ réutilise les styles de la modale (.modal-overlay, .detail-*, .lightbox-*, .status-*, .edit-*)

import {
  FaEdit,
  FaTrash,
  FaTimes,
  FaHome,
  FaBuilding,
  FaBox,
  FaTruck,
  FaMoneyBillWave,
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
  FaExpand,
  FaCommentDots,
  FaCalendarAlt,
} from 'react-icons/fa';

const STATUS_OPTIONS = ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];
const BADGE = {
  'En attente': 'badge badge-pending',
  'Confirmée':  'badge badge-confirmed',
  'Expédiée':   'badge badge-shipped',
  'Livrée':     'badge badge-delivered',
  'Annulée':    'badge badge-cancelled',
};
const EMPTY_ITEM = { name: '', price: 0, quantity: 1, size: '', fit: '', color: '', image: '', custom: false, note: '', designNote: '', designImages: [] };

// ✅ map couleur -> côté -> image du t-shirt (mêmes 4 visuels que le configurateur)
const TSHIRT_IMAGES = {
  Noir:  { front: tshirtNoirAvant,  back: tshirtNoirArriere },
  Blanc: { front: tshirtBlancAvant, back: tshirtBlancArriere },
};

// ✅ Renvoie la bonne image de t-shirt selon la couleur de l'article et le côté du design.
// Si la couleur enregistrée ne correspond à rien de connu, on retombe sur le Noir par défaut.
const getTshirtImage = (color, side) => {
  const palette = TSHIRT_IMAGES[color] || TSHIRT_IMAGES.Noir;
  return side === 'back' ? palette.back : palette.front;
};

/* ✅ Normalise une entrée de designImages :
   - ancien format : simple string (URL) → position par défaut
   - nouveau format : { side, url, x, y, w, h } → utilisé tel quel */
const normalizeDesignImage = (design, idx) => {
  if (typeof design === 'string') {
    return {
      side: idx === 0 ? 'front' : 'back',
      url: design,
      x: 28, y: 20, w: 44, h: 40,
    };
  }
  return {
    side: design.side || (idx === 0 ? 'front' : 'back'),
    url: design.url,
    x: typeof design.x === 'number' ? design.x : 28,
    y: typeof design.y === 'number' ? design.y : 20,
    w: typeof design.w === 'number' ? design.w : 44,
    h: typeof design.h === 'number' ? design.h : 40,
  };
};

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);

  // ─── Modale de détail de commande (identique à AdminOrders) ───
  const [selected, setSelected]   = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [draft, setDraft]         = useState(null);
  const [saving, setSaving]       = useState(false);

  // ✅ Aperçu plein écran : image simple (produit standard)
  const [fullscreenImg, setFullscreenImg] = useState(null);
  // ✅ Aperçu plein écran : mockup fidèle (t-shirt + design positionné exactement)
  const [fullscreenMockup, setFullscreenMockup] = useState(null);

  const [wilayas, setWilayas]                 = useState([]);
  const [communes, setCommunes]               = useState([]);
  const [wilayasLoading, setWilayasLoading]   = useState(false);
  const [communesLoading, setCommunesLoading] = useState(false);

  const fetchDashboard = () => {
    api.get('/orders/stats/summary').then(r => setStats(r.data));
    api.get('/orders?limit=5').then(r => setRecent(r.data.orders));
  };

  useEffect(() => { fetchDashboard(); }, []);

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

  const filteredCommunes = draft?.customer?.deliveryType === 'office'
    ? communes.filter(c => c.hasStopDesk)
    : communes;

  const statusBadge = (s) => BADGE[s] || 'badge';

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

  const startEdit = () => {
    setDraft(prepareDraft(selected));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditMode(false);
  };

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
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Statut mis à jour');
      fetchDashboard();
      if (selected?._id === id) setSelected(p => ({ ...p, status }));
    } catch { toast.error('Erreur'); }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Supprimer cette commande définitivement ?')) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Commande supprimée');
      closeModal();
      fetchDashboard();
    } catch { toast.error('Erreur'); }
  };

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
              <tr key={order._id} className="tbl-row" onClick={() => selectOrder(order)}>
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

      {/* ── MODAL : détail / édition de la commande sélectionnée ── */}
      {modalOpen && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="order-detail">
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
                    <h3><FaUser /> Informations du client</h3>
                    <p><FaUser /><strong>Nom et prénom :</strong>{selected.customer.fullName}</p>
                    <p><FaPhone /> <strong>Téléphone N°01 :</strong> {selected.customer.phone}</p>
                    {selected.customer.phone2 && <p><FaPhoneAlt /> <strong>Téléphone N°02 :</strong> {selected.customer.phone2}</p>}
                    {selected.customer.email  && <p><FaEnvelope /> {selected.customer.email}</p>}
                    <p><FaMapMarkerAlt /> <strong>Adresse:</strong>{selected.customer.commune}, {selected.customer.wilaya}</p>
                    <p>{selected.customer.address}</p>
                    <p><FaTruck /> <strong>Type de Livraison:</strong>{selected.customer.deliveryType === 'home' ? 'À domicile' : 'Stop Desk '}</p>
                     <p><FaCalendarAlt /> <strong>Date et Heure de la commande: </strong>{new Date(selected.createdAt).toLocaleDateString('fr-DZ')} à {new Date(selected.createdAt).toLocaleTimeString('fr-DZ')}</p>
                  </div>

                  <div className="detail-section">
                    <h3><FaBox /> Articles</h3>
                    {selected.items.map((item, i) => {
                      const normalizedDesigns = (item.designImages || []).map((d, idx) => normalizeDesignImage(d, idx));
                      return (
                        <div key={i} className="detail-item">
                          {item.custom && normalizedDesigns.length > 0 ? (
                            // ✅ Aperçu FIDÈLE : le design est affiché exactement à la
                            // position / taille choisies par le client (x, y, w, h en %),
                            // sur le t-shirt de la BONNE couleur et du BON côté.
                            <div className="tshirt-preview-group">
                              {normalizedDesigns.map((design, idx) => (
                                <div key={idx} className="tshirt-preview-wrapper">
                                  <div
                                    className="tshirt-preview"
                                    onClick={() => setFullscreenMockup({ ...design, color: item.color })}
                                    title="Cliquer pour agrandir l'aperçu exact"
                                  >
                                    <img
                                      src={getTshirtImage(item.color, design.side)}
                                      alt="T-shirt"
                                      className="tshirt-preview-base"
                                      draggable={false}
                                    />
                                    <img
                                      src={design.url}
                                      alt={design.side === 'back' ? 'Design dos' : 'Design devant'}
                                      className="design-on-tshirt-exact"
                                      style={{
                                        left: `${design.x}%`,
                                        top: `${design.y}%`,
                                        width: `${design.w}%`,
                                        height: `${design.h}%`,
                                      }}
                                      draggable={false}
                                    />
                                    <span className="side-label">
                                      {design.side === 'back' ? 'Dos' : 'Devant'}
                                    </span>
                                    <span className="zoom-hint"><FaExpand /></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <img
                              src={item.image || 'https://via.placeholder.com/50x50/f5f5f5/999?text=?'}
                              alt={item.name}
                              className="detail-item-image"
                              onClick={() => setFullscreenImg(item.image || 'https://via.placeholder.com/600x600/f5f5f5/999?text=Pas+d%27image')}
                              title="Cliquer pour agrandir"
                            />
                          )}

                          <div className="detail-item-info">
                            <span className="detail-item-name">
                              <strong>Model:</strong>{item.name} /
                              <strong>Taille:</strong>{item.size && ` ${item.size}`} /
                              <strong>Coupe:</strong>{item.fit && `  ${item.fit}`} /
                              <strong>Couleur:</strong>{item.color && `  ${item.color}`}
                            </span>
                            <span className="detail-item-qty"><strong>Nombre : x {item.quantity}</strong></span>
                            {/* ✅ Note du client sur son design */}
                            {item.custom && item.designNote && (
                              <span className="detail-item-designnote">
                                <FaCommentDots /> {item.designNote}
                              </span>
                            )}
                          </div>
                          <span className="detail-item-price">
                            {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
                          </span>
                        </div>
                      );
                    })}
                    <div className="detail-shipping"><span><FaBox /> Prix d'articles</span><span>{(selected.subtotal ?? 0).toLocaleString('fr-DZ')} DA</span></div>
                    <div className="detail-shipping"><span><FaTruck /> Prix de livraison</span><span>{(selected.deliveryPrice ?? 0).toLocaleString('fr-DZ')} DA</span></div>
                    <div className="detail-total"><span><FaMoneyBillWave /> Prix total </span><span>{selected.totalAmount.toLocaleString('fr-DZ')} DA</span></div>
                  </div>

                  {selected.notes && (
                    <div className="detail-section">
                      <h3><FaClipboardList /> Notes</h3>
                      <p className="notes-text">{selected.notes}</p>
                    </div>
                  )}

                  <div className="detail-section">
                    <h3><FaUndo /> Changer le statut de la commande </h3>
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

                        {/* ✅ Aperçu fidèle en mode édition aussi (lecture seule) */}
                        {item.custom && item.designImages && item.designImages.length > 0 && (
                          <div className="tshirt-preview-group edit-preview">
                            {item.designImages.map((d, i2) => {
                              const design = normalizeDesignImage(d, i2);
                              return (
                                <div key={i2} className="tshirt-preview-wrapper small">
                                  <div className="tshirt-preview" onClick={() => setFullscreenMockup({ ...design, color: item.color })}>
                                    <img src={getTshirtImage(item.color, design.side)} alt="T-shirt" className="tshirt-preview-base" draggable={false} />
                                    <img
                                      src={design.url}
                                      alt="Design"
                                      className="design-on-tshirt-exact"
                                      style={{
                                        left: `${design.x}%`, top: `${design.y}%`,
                                        width: `${design.w}%`, height: `${design.h}%`,
                                      }}
                                      draggable={false}
                                    />
                                    <span className="side-label">{design.side === 'back' ? 'Dos' : 'Devant'}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="edit-grid">
                          <label className="full-width">Nom du produit<input value={item.name} onChange={e => setItem(idx, 'name', e.target.value)} /></label>
                          <label>Prix (DA)<input type="number" min="0" value={item.price} onChange={e => setItem(idx, 'price', e.target.value)} /></label>
                          <label>Quantité<input type="number" min="1" value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} /></label>
                          <label>Taille<input value={item.size || ''} onChange={e => setItem(idx, 'size', e.target.value)} placeholder="M, L, XL…" /></label>
                          <label>Coupe<input value={item.fit || ''} onChange={e => setItem(idx, 'fit', e.target.value)} placeholder="Regular, Slim…" /></label>
                          <label>Couleur<input value={item.color || ''} onChange={e => setItem(idx, 'color', e.target.value)} placeholder="Noir, Blanc…" /></label>
                          <label className="full-width">URL image<input value={item.image || ''} onChange={e => setItem(idx, 'image', e.target.value)} placeholder="https://…" /></label>
                          <label className="full-width">Note custom<input value={item.note || ''} onChange={e => setItem(idx, 'note', e.target.value)} /></label>
                          {/* ✅ Note design du client, modifiable par l'admin si besoin */}
                          <label className="full-width">Détails design (client)
                            <textarea
                              className="admin-designnote-textarea"
                              rows={2}
                              value={item.designNote || ''}
                              onChange={e => setItem(idx, 'designNote', e.target.value)}
                            />
                          </label>
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

      {/* ── LIGHTBOX : image simple (produit standard) ── */}
      {fullscreenImg && (
        <div className="lightbox-overlay" onClick={() => setFullscreenImg(null)}>
          <button className="lightbox-close" onClick={() => setFullscreenImg(null)}>
            <FaTimes />
          </button>
          <img
            src={fullscreenImg}
            alt="Aperçu plein écran"
            className="lightbox-image"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── LIGHTBOX : mockup fidèle (t-shirt + design positionné exactement) ── */}
      {fullscreenMockup && (
        <div className="lightbox-overlay" onClick={() => setFullscreenMockup(null)}>
          <button className="lightbox-close" onClick={() => setFullscreenMockup(null)}>
            <FaTimes />
          </button>
          <div className="lightbox-mockup" onClick={e => e.stopPropagation()}>
            <img
              src={getTshirtImage(fullscreenMockup.color, fullscreenMockup.side)}
              alt="T-shirt"
              className="lightbox-mockup-base"
              draggable={false}
            />
            <img
              src={fullscreenMockup.url}
              alt="Design"
              className="lightbox-mockup-design"
              style={{
                left: `${fullscreenMockup.x}%`,
                top: `${fullscreenMockup.y}%`,
                width: `${fullscreenMockup.w}%`,
                height: `${fullscreenMockup.h}%`,
              }}
              draggable={false}
            />
            <span className="lightbox-mockup-label">
              {fullscreenMockup.side === 'back' ? 'Dos' : 'Devant'}
            </span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}