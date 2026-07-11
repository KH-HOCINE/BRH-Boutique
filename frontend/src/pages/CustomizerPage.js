// CustomizerPage.js
import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/shop/Navbar';
import { useCart } from '../context/CartContext';
import { useT } from '../translations';
import api from '../utils/api';
import tshirtImg from '../images/tshirt.jpg';
import './CustomizerPage.css';

const SIDES = ['front', 'back'];

const SIZE_ORDER  = ['6ans','8ans','10ans','12ans','14ans/Xs','S','M','L','XL','XXL'];
const CHILD_SIZES = ['6ans','8ans','10ans','12ans','14ans/Xs'];
const ADULT_SIZES = ['S','M','L','XL','XXL'];
const FITS        = ['Regular', 'Oversize'];

// Tailles à ne PAS afficher dans le tableau du guide des tailles
// (elles restent sélectionnables normalement dans les boutons de taille)
const SIZE_GUIDE_EXCLUDED = ['6ans', '8ans', '10ans', '12ans', '14ans/Xs'];

// Nouveaux prix : simple / double face
const PRICE_CHILD_SINGLE = 2500;
const PRICE_CHILD_DOUBLE = 2700;
const PRICE_ADULT_SINGLE = 2900;
const PRICE_ADULT_DOUBLE = 3200;

// Données du guide des tailles (mesures en cm)
const SIZE_GUIDE_DATA = [
  { size: '6ans',   a: 50, b: 38 },
  { size: '8ans',   a: 54, b: 40 },
  { size: '10ans',  a: 58, b: 42 },
  { size: '12ans',  a: 62, b: 44 },
  { size: '14ans/Xs', a: 66, b: 46 },
  { size: 'S',      a: 70, b: 52 },
  { size: 'M',      a: 73, b: 55 },
  { size: 'L',      a: 75, b: 57 },
  { size: 'XL',     a: 76, b: 60 },
  { size: 'XXL',    a: 78, b: 62 },
];

const INITIAL_DESIGN = { file: null, url: null, x: 30, y: 22, w: 40, h: 38 };

export default function CustomizerPage() {
  const navigate = useNavigate();
  const { dispatch } = useCart();
  const t = useT();

  const [activeSide, setActiveSide] = useState('front');
  const [designs, setDesigns]       = useState({ front: { ...INITIAL_DESIGN }, back: { ...INITIAL_DESIGN } });
  const [dragging, setDragging]     = useState(null);
  const [size, setSize]             = useState('');
  const [fit, setFit]               = useState('');
  const [qty, setQty]               = useState(1);
  const [uploading, setUploading]   = useState(false);
  const [color, setColor]           = useState('');           // Nouveau : couleur choisie
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false); // Nouveau : ouverture du guide

  const canvasRef   = useRef(null);
  const fileInputRef = useRef(null);

  const design    = designs[activeSide];
  const isChild   = CHILD_SIZES.includes(size);
  const hasBothSides = !!(designs.front.url && designs.back.url);

  // Calcul du prix selon la taille et le nombre de faces
  let price = 0;
  if (size) {
    if (isChild) {
      price = hasBothSides ? PRICE_CHILD_DOUBLE : PRICE_CHILD_SINGLE;
    } else {
      price = hasBothSides ? PRICE_ADULT_DOUBLE : PRICE_ADULT_SINGLE;
    }
  } else {
    // Par défaut (aucune taille sélectionnée) on affiche le prix adulte simple
    price = PRICE_ADULT_SINGLE;
  }

  const hasDesign = designs.front.url || designs.back.url;

  // Reset fit if child size selected
  useEffect(() => { if (isChild) setFit(''); }, [isChild]);

  const setDesign = useCallback((updates) => {
    setDesigns(prev => ({ ...prev, [activeSide]: { ...prev[activeSide], ...updates } }));
  }, [activeSide]);

  // Fonction d'upload vers Cloudinary
  const uploadDesign = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('design', file);
    try {
      const { data } = await api.post('/upload/design', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url;
    } catch (err) {
      toast.error("Erreur lors de l'upload du design");
      console.error(err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadDesign(file);
    if (url) {
      setDesign({ file, url, x: 28, y: 20, w: 44, h: 40 });
    }
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = await uploadDesign(file);
    if (url) {
      setDesign({ file, url, x: 28, y: 20, w: 44, h: 40 });
    }
  };

  const getRelPos = (e, el) => {
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const onMouseDownMove = (e) => {
    e.preventDefault();
    const { px, py } = getRelPos(e, canvasRef.current);
    setDragging({ type: 'move', startMouseX: px, startMouseY: py, startDesign: { ...design } });
  };

  const onMouseDownResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { px, py } = getRelPos(e, canvasRef.current);
    setDragging({ type: 'resize', startMouseX: px, startMouseY: py, startDesign: { ...design } });
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging || !canvasRef.current) return;
      const { px, py } = getRelPos(e, canvasRef.current);
      const dx = px - dragging.startMouseX;
      const dy = py - dragging.startMouseY;
      const sd = dragging.startDesign;
      if (dragging.type === 'move') {
        setDesign({
          x: Math.max(0, Math.min(100 - sd.w, sd.x + dx)),
          y: Math.max(0, Math.min(100 - sd.h, sd.y + dy)),
        });
      } else {
        setDesign({
          w: Math.max(10, Math.min(90 - sd.x, sd.w + dx)),
          h: Math.max(10, Math.min(90 - sd.y, sd.h + dy)),
        });
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, setDesign]);

  // Gestion du clavier pour fermer le guide
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sizeGuideOpen) setSizeGuideOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sizeGuideOpen]);

  // Bloquer le scroll quand le guide est ouvert
  useEffect(() => {
    if (sizeGuideOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sizeGuideOpen]);

  const handleAddToCart = () => {
    if (!hasDesign) { toast.warning(t('customizer.toast.no_design')); return; }
    if (!size)      { toast.warning(t('customizer.toast.no_size')); return; }
    if (!isChild && !fit) { toast.warning(t('customizer.toast.no_fit')); return; }
    if (!color)     { toast.warning('Veuillez choisir une couleur (Noir ou Blanc)'); return; }

    const placements = [];
    const designUrls = [];
    if (designs.front.url) { placements.push('devant'); designUrls.push(designs.front.url); }
    if (designs.back.url)  { placements.push('derrière'); designUrls.push(designs.back.url); }
    const placementLabel = placements.join(' + ');

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product: `custom-tshirt-${Date.now()}`,
        name:    `T-shirt personnalisé (${placementLabel})`,
        price,
        image:   tshirtImg,
        designImages: designUrls,
        size,
        fit:     isChild ? '' : fit,
        color,
        quantity: qty,
        custom:  true,
        note:    `Design ${placementLabel} — contactez-nous pour envoyer votre fichier.`,
      },
    });

    toast.success(t('product.added_to_cart'));
    navigate('/panier');
  };

  // Données pour le guide des tailles (filtrées selon les tailles disponibles
  // ET on retire les tailles qu'on ne veut pas afficher dans le tableau du guide)
  const sizeGuideRows = SIZE_GUIDE_DATA.filter(
    row => SIZE_ORDER.includes(row.size) && !SIZE_GUIDE_EXCLUDED.includes(row.size)
  );

  return (
    <div>
      <Navbar />
      <div className="customizer-page">

        <div className="customizer-header">
          <Link to="/" className="customizer-back">← {t('common.back')}</Link>
          <div className="customizer-header-text">
            <span className="customizer-eyebrow">{t('customizer.eyebrow')}</span>
            <h1>{t('customizer.title')}</h1>
          </div>
        </div>

        <div className="customizer-layout">

          {/* Canvas col */}
          <div className="customizer-canvas-col">

            <div className="side-tabs">
              {SIDES.map(side => (
                <button
                  key={side}
                  className={`side-tab ${activeSide === side ? 'active' : ''}`}
                  onClick={() => setActiveSide(side)}
                >
                  {side === 'front' ? t('customizer.side.front_label') : t('customizer.side.back_label')}
                  {designs[side].url && <span className="side-dot" />}
                </button>
              ))}
            </div>

            <div
              className="tshirt-canvas"
              ref={canvasRef}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <img src={tshirtImg} alt="T-shirt vierge" className="tshirt-base" draggable={false} />

              {!design.url && (
                <div className="tshirt-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>{t('customizer.dropzone.text')}</span>
                  <small>{t('customizer.dropzone.click')}</small>
                </div>
              )}

              {design.url && (
                <div
                  className={`design-overlay ${dragging ? 'dragging' : ''}`}
                  style={{ left:`${design.x}%`, top:`${design.y}%`, width:`${design.w}%`, height:`${design.h}%` }}
                  onMouseDown={onMouseDownMove}
                  onTouchStart={onMouseDownMove}
                >
                  <img src={design.url} alt="Ton design" draggable={false} />
                  <div className="resize-handle" onMouseDown={onMouseDownResize} onTouchStart={onMouseDownResize}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 12 L12 2M7 12 L12 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <button
                    className="design-remove"
                    onClick={e => { e.stopPropagation(); setDesign({ file: null, url: null }); }}
                  >×</button>
                </div>
              )}
            </div>

            <div className="canvas-actions">
              <button className="btn-upload" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {uploading ? 'Envoi...' : (design.url ? t('customizer.btn.change') : t('customizer.btn.upload'))}
              </button>
              {design.url && (
                <div className="scale-controls">
                  <button onClick={() => setDesign({ w: Math.max(10, design.w - 5), h: Math.max(10, design.h - 5) })}>−</button>
                  <span>{t('customizer.resize_label')}</span>
                  <button onClick={() => setDesign({ w: Math.min(80, design.w + 5), h: Math.min(80, design.h + 5) })}>+</button>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileUpload} />
          </div>

          {/* Options col */}
          <div className="customizer-options-col">
            <div className="options-card">
              <h2>{t('customizer.options.title')}</h2>

              <div className="option-group">
                <label>{t('customizer.placement.label')}</label>
                <div className="placement-pills">
                  {SIDES.map(side => (
                    <button
                      key={side}
                      className={`placement-pill ${activeSide === side ? 'active' : ''}`}
                      onClick={() => setActiveSide(side)}
                    >
                      {side === 'front' ? t('customizer.side.front') : t('customizer.side.back')}
                      {designs[side].url && ' ✓'}
                    </button>
                  ))}
                </div>
                <p className="option-hint">{t('customizer.placement.hint')}</p>
              </div>

              <div className="option-group summary">
                <div className="summary-row">
                  <span>{t('customizer.summary.front')}</span>
                  <span className={designs.front.url ? 'ok' : 'muted'}>
                    {designs.front.url ? t('customizer.summary.has_design') : t('customizer.summary.empty')}
                  </span>
                </div>
                <div className="summary-row">
                  <span>{t('customizer.summary.back')}</span>
                  <span className={designs.back.url ? 'ok' : 'muted'}>
                    {designs.back.url ? t('customizer.summary.has_design') : t('customizer.summary.empty')}
                  </span>
                </div>
              </div>

              <div className="option-group">
                <div className="selector-label-row">
                  <label>{t('customizer.size.label')}</label>
                  <button
                    className="size-guide-link"
                    onClick={() => setSizeGuideOpen(true)}
                  >
                    {t('product.size_guide')}
                  </button>
                </div>
                <div className="size-grid">
                  {SIZE_ORDER.map(s => (
                    <button
                      key={s}
                      className={`size-btn ${size === s ? 'active' : ''}`}
                      onClick={() => setSize(s)}
                    >{s}</button>
                  ))}
                </div>
                {size && (
                  <p className="size-price-hint">
                    {isChild
                      ? `Taille enfant — ${(hasBothSides ? PRICE_CHILD_DOUBLE : PRICE_CHILD_SINGLE).toLocaleString('fr-DZ')} DA`
                      : `Taille adulte — ${(hasBothSides ? PRICE_ADULT_DOUBLE : PRICE_ADULT_SINGLE).toLocaleString('fr-DZ')} DA`}
                  </p>
                )}
              </div>

              {!isChild && (
                <div className="option-group">
                  <label>{t('customizer.fit.label')}</label>
                  <div className="fit-pills">
                    {FITS.map(f => (
                      <button
                        key={f}
                        className={`fit-pill ${fit === f ? 'active' : ''}`}
                        onClick={() => setFit(f)}
                      >{f}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nouveau : choix de la couleur */}
              <div className="option-group">
                <label>Couleur du t-shirt</label>
                <div className="color-options">
                  <button
                    className={`color-btn ${color === 'Noir' ? 'active' : ''}`}
                    onClick={() => setColor('Noir')}
                  >
                    ⬤ Noir
                  </button>
                  <button
                    className={`color-btn ${color === 'Blanc' ? 'active' : ''}`}
                    onClick={() => setColor('Blanc')}
                  >
                    ◯ Blanc
                  </button>
                </div>
              </div>

              <div className="option-group">
                <label>{t('customizer.quantity.label')}</label>
                <div className="qty-row">
                  <div className="qty-controls">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(q => q + 1)}>+</button>
                  </div>
                  <span className="qty-total">
                    = {(price * qty).toLocaleString('fr-DZ')} DA
                  </span>
                </div>
              </div>

              {/* Note de paiement */}
              <div className="payment-note">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div>
                  <strong>⚠️ Paiement à l'avance obligatoire</strong>
                  <p>
                    Les commandes personnalisées ne sont pas éligibles au paiement à la livraison (cash). 
                    Un paiement anticipé par <strong>BaridiMob</strong> est requis avant le début de la production.
                    Vous pouvez régler une partie ou la totalité du montant. 
                    Dès réception du virement, nous lancerons la fabrication de votre design.
                  </p>
                </div>
              </div>

              <button
                className={`btn-order ${!hasDesign ? 'disabled' : ''}`}
                disabled={!hasDesign}
                onClick={handleAddToCart}
              >
                {hasDesign
                  ? t('customizer.btn.order', { price: (price * qty).toLocaleString('fr-DZ') })
                  : t('customizer.btn.order_disabled')}
              </button>
              <p className="price-note">{t('customizer.price_note')}</p>

              {hasDesign && (
                <div className="custom-info-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p>{t('customizer.info_box')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Guide des tailles (modal) ────────────────────────────── */}
      {sizeGuideOpen && (
        <div
          className="size-guide-overlay"
          onClick={() => setSizeGuideOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('size_guide.title')}
        >
          <div
            className="size-guide-modal"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="size-guide-close"
              onClick={() => setSizeGuideOpen(false)}
              aria-label={t('image.close')}
            >×</button>
            <p className="size-guide-ref">{t('size_guide.reference')}</p>
            <h2 className="size-guide-title">{t('size_guide.title')}</h2>
            <p className="size-guide-subtitle">{t('size_guide.subtitle')}</p>

            <div className="size-guide-diagram">
              <div className="size-guide-diagram-img" style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={tshirtImg}
                  alt="Schéma des mesures du t-shirt"
                  style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />
                {/* Flèche verticale (longueur A) */}
                <div className="measure-arrow measure-arrow-vertical" style={{
                  position: 'absolute', left: '15%', top: '10%', bottom: '10%',
                  width: '2px', background: '#c0392b', transform: 'translateX(-50%)',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: '50%',
                    transform: 'translateX(-50%) translateY(-50%)',
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                    borderBottom: '10px solid #c0392b',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: '50%',
                    transform: 'translateX(-50%) translateY(50%)',
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                    borderTop: '10px solid #c0392b',
                  }} />
                  <span style={{
                    position: 'absolute', left: '-20px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#c0392b', fontWeight: 'bold', fontSize: '18px', fontFamily: 'Georgia, serif',
                  }}>A</span>
                </div>
                {/* Flèche horizontale (largeur B) */}
                <div className="measure-arrow measure-arrow-horizontal" style={{
                  position: 'absolute', top: '55%', left: '25%', right: '25%',
                  height: '2px', background: 'white', transform: 'translateY(-50%)',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: '50%',
                    transform: 'translateX(-50%) translateY(-50%)',
                    width: 0, height: 0,
                    borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                    borderRight: '8px solid white',
                  }} />
                  <div style={{
                    position: 'absolute', right: 0, top: '50%',
                    transform: 'translateX(50%) translateY(-50%)',
                    width: 0, height: 0,
                    borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                    borderLeft: '8px solid white',
                  }} />
                  <span style={{
                    position: 'absolute', top: '-25px', left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white', fontWeight: 'bold', fontSize: '18px', fontFamily: 'Georgia, serif',
                  }}>B</span>
                </div>
              </div>

              <div className="size-guide-diagram-legend">
                <div className="legend-item">
                  <span className="legend-key red">{t('size_guide.measure_a')}</span>
                  <p>{t('size_guide.legend_a')}</p>
                </div>
                <div className="legend-item">
                  <span className="legend-key">{t('size_guide.measure_b')}</span>
                  <p>{t('size_guide.legend_b')}</p>
                </div>
              </div>
            </div>

            <table className="size-guide-table">
              <thead>
                <tr>
                  <th>{t('size_guide.table_header_size')}</th>
                  <th>{t('size_guide.table_header_a')}</th>
                  <th>{t('size_guide.table_header_b')}</th>
                </tr>
              </thead>
              <tbody>
                {sizeGuideRows.map(row => (
                  <tr
                    key={row.size}
                    className={size === row.size ? 'size-guide-row-active' : ''}
                  >
                    <td>{row.size}</td>
                    <td>{row.a}</td>
                    <td>{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="size-guide-tip">{t('size_guide.tip')}</p>
          </div>
        </div>
      )}
    </div>
  );
}