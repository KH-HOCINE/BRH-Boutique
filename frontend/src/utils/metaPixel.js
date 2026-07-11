// Utilitaire Meta Pixel — événements côté client

const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID;

// Initialiser le Pixel Meta dans index.html ou ici
export const initMetaPixel = () => {
  if (!PIXEL_ID || window.fbq) return;

  (function(f,b,e,v,n,t,s){
    if(f.fbq) return;
    n=f.fbq=function(){n.callMethod ?
      n.callMethod.apply(n,arguments) : n.queue.push(arguments)};
    if(!f._fbq) f._fbq=n;
    n.push=n; n.loaded=!0; n.version='2.0';
    n.queue=[];
    t=b.createElement(e); t.async=!0;
    t.src=v;
    s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s);
  })(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
};

export const trackViewContent = (product) => {
  if (!window.fbq) return;
  window.fbq('track', 'ViewContent', {
    content_ids:  [product._id],
    content_name: product.name,
    content_type: 'product',
    value:        product.price,
    currency:     'DZD',
  });
};

export const trackAddToCart = (product, quantity = 1) => {
  if (!window.fbq) return;
  window.fbq('track', 'AddToCart', {
    content_ids:  [product._id],
    content_name: product.name,
    content_type: 'product',
    value:        product.price * quantity,
    currency:     'DZD',
    num_items:    quantity,
  });
};

export const trackInitiateCheckout = (items, total) => {
  if (!window.fbq) return;
  window.fbq('track', 'InitiateCheckout', {
    content_ids:  items.map(i => i.product),
    num_items:    items.reduce((s, i) => s + i.quantity, 0),
    value:        total,
    currency:     'DZD',
  });
};

export const trackPurchase = (orderNumber, total, items) => {
  if (!window.fbq) return;
  window.fbq('track', 'Purchase', {
    order_id:     orderNumber,
    content_ids:  items.map(i => i.product),
    content_type: 'product',
    num_items:    items.reduce((s, i) => s + i.quantity, 0),
    value:        total,
    currency:     'DZD',
  });
};
