import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../utils/api';
import './AdminProducts.css';

const CATEGORIES = ['T-shirt', 'Hoodie', 'Sac à dos', 'Ensemble'];
const ALL_SIZES  = ['6ans','8ans','10ans','12ans','14ans/Xs','S','M','L','XL','XXL'];
const ALL_FITS   = ['Oversize', 'Regularsize'];

// ⛔ Plus besoin de API_URL : les images sont des URLs Cloudinary complètes
// const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

const EMPTY_FORM = {
  name:        '',
  description: '',
  priceChild:  '',
  priceAdult:  '',
  category:    'T-shirt',
  anime:       '',
  sizes:       [],
  fits:        [],
  colors:      '',
  stock:       '',
  isFeatured:  false,
  isAvailable: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [images,   setImages]   = useState([]);
  const [saving,   setSaving]   = useState(false);

  const fetchProducts = () => {
    api.get('/products/admin/all')
      .then(r => setProducts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImages([]);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      ...p,
      anime:       p.anime       || '',
      colors:      p.colors.join(', '),
      fits:        p.fits        || [],
      isFeatured:  p.isFeatured,
      isAvailable: p.isAvailable,
    });
    setImages([]);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',        form.name);
      fd.append('description', form.description);
      fd.append('priceChild',  form.priceChild);
      fd.append('priceAdult',  form.priceAdult);
      fd.append('category',    form.category);
      fd.append('anime',       form.anime.trim());
      fd.append('sizes',       JSON.stringify(form.sizes));
      fd.append('fits',        JSON.stringify(form.fits));
      fd.append('colors',      JSON.stringify(form.colors.split(',').map(c => c.trim()).filter(Boolean)));
      fd.append('stock',       form.stock);
      fd.append('isFeatured',  form.isFeatured);
      fd.append('isAvailable', form.isAvailable);
      images.forEach(img => fd.append('images', img));

      if (editing) {
        await api.put(`/products/${editing._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Produit mis à jour');
      } else {
        await api.post('/products', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Produit créé');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Produit supprimé');
    fetchProducts();
  };

  const toggleSize = (s) => setForm(f => ({
    ...f,
    sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s],
  }));

  const toggleFit = (fit) => setForm(f => ({
    ...f,
    fits: f.fits.includes(fit) ? f.fits.filter(x => x !== fit) : [...f.fits, fit],
  }));

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Produits</h1>
        <button className="btn-primary" onClick={openCreate}>+ Nouveau produit</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="products-admin-grid">
          {products.map(p => (
            <div key={p._id} className="product-admin-card">
              <div className="prod-img">
                {/* URL Cloudinary utilisée directement, sans préfixe API_URL */}
                <img
                  src={p.images?.[0] || 'https://via.placeholder.com/200x240/f5f5f5/999?text=Photo'}
                  alt={p.name}
                />
                {!p.isAvailable && <div className="unavailable-overlay">Masqué</div>}
              </div>
              <div className="prod-info">
                <p className="prod-cat">{p.category}</p>
                {p.anime && <p className="prod-anime">{p.anime}</p>}
                <h3 className="prod-name">{p.name}</h3>
                <p className="prod-price">Enfant: {p.priceChild.toLocaleString('fr-DZ')} DA</p>
                <p className="prod-price">Adulte: {p.priceAdult.toLocaleString('fr-DZ')} DA</p>
                <p className="prod-stock">Stock : {p.stock}</p>
                {p.fits?.length > 0 && (
                  <p className="prod-fits">{p.fits.join(' · ')}</p>
                )}
              </div>
              <div className="prod-actions">
                <button className="btn-outline" onClick={() => openEdit(p)}>Modifier</button>
                <button className="delete-btn" onClick={() => handleDelete(p._id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal formulaire ──────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">

              {/* Nom + Catégorie */}
              <div className="form-row-2">
                <div className="form-group">
                  <label> Titre *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Catégorie *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Anime */}
              <div className="form-group">
                <label>Marque / Anime <span className="label-optional">(optionnel)</span></label>
                <input
                  value={form.anime}
                  onChange={e => setForm({...form, anime: e.target.value})}
                  placeholder="Ex: Prada, Hermes, Animes..."
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  rows={3}
                />
              </div>

              {/* Prix enfant + Prix adulte */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Prix enfant (DA) *</label>
                  <input
                    type="number"
                    value={form.priceChild}
                    onChange={e => setForm({...form, priceChild: e.target.value})}
                    min="0"
                    required
                  />
                  <small className="field-hint">Tailles 6ans,8ans,10ans,12ans,14ans/Xs</small>
                </div>
                <div className="form-group">
                  <label>Prix adulte (DA) *</label>
                  <input
                    type="number"
                    value={form.priceAdult}
                    onChange={e => setForm({...form, priceAdult: e.target.value})}
                    min="0"
                    required
                  />
                  <small className="field-hint">Tailles S,M,L,XL,XXL</small>
                </div>
              </div>

              {/* Stock */}
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={e => setForm({...form, stock: e.target.value})}
                  min="0"
                />
              </div>

              {/* Tailles */}
              <div className="form-group">
                <label>Tailles</label>
                <div className="size-checkboxes">
                  {ALL_SIZES.map(s => (
                    <button
                      type="button"
                      key={s}
                      className={`size-check ${form.sizes.includes(s) ? 'active' : ''}`}
                      onClick={() => toggleSize(s)}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Coupe */}
              <div className="form-group">
                <label>Coupe</label>
                <div className="size-checkboxes">
                  {ALL_FITS.map(f => (
                    <button
                      type="button"
                      key={f}
                      className={`size-check ${form.fits.includes(f) ? 'active' : ''}`}
                      onClick={() => toggleFit(f)}
                    >{f}</button>
                  ))}
                </div>
              </div>

              {/* Couleurs */}
              <div className="form-group">
                <label>Couleurs <span className="label-optional">(séparées par virgule)</span></label>
                <input
                  value={form.colors}
                  onChange={e => setForm({...form, colors: e.target.value})}
                  placeholder="Noir, Blanc, Rouge..."
                />
              </div>

              {/* Photos */}
              <div className="form-group">
                <label>Photos</label>
                {/* Aperçu des images existantes (en mode édition) */}
                {editing && editing.images?.length > 0 && images.length === 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {editing.images.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Photo ${i + 1}`}
                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }}
                      />
                    ))}
                    <p style={{ fontSize: 12, color: 'var(--gray-500)', alignSelf: 'center' }}>
                      Sélectionner de nouvelles photos pour remplacer
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => setImages(Array.from(e.target.files))}
                />
                {images.length > 0 && (
                  <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 6 }}>
                    ✓ {images.length} photo(s) sélectionnée(s)
                  </p>
                )}
              </div>

              {/* Checkboxes */}
              <div className="form-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={e => setForm({...form, isFeatured: e.target.checked})}
                  />
                  Coup de cœur (affiché en page d'accueil)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={e => setForm({...form, isAvailable: e.target.checked})}
                  />
                  Disponible (visible sur la boutique)
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '14px' }}
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Créer le produit')}
              </button>

            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}