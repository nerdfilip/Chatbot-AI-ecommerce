import React from 'react';

const EMOJI = {
  'telefoane': '📱', 'laptopuri': '💻', 'televizoare': '📺',
  'electrocasnice mari': '🏠', 'electrocasnice mici': '⚡',
  'tablete': '📟', 'smartwatch': '⌚', 'audio': '🎧',
  'monitoare': '🖥️', 'gaming': '🎮', 'stocare': '💾',
  'retea': '📡', 'periferice': '⌨️', 'foto-video': '📷',
  'smart home': '🏡', 'componente PC': '🔩', 'climatizare': '❄️',
  'accesorii': '🔋', 'ingrijire personala': '✨',
};

const BG = {
  'telefoane': 'linear-gradient(135deg,#e0f2fe,#bfdbfe)',
  'laptopuri': 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
  'televizoare': 'linear-gradient(135deg,#fce7f3,#fbcfe8)',
  'audio': 'linear-gradient(135deg,#fef3c7,#fde68a)',
  'gaming': 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
  'smartwatch': 'linear-gradient(135deg,#e0f2fe,#bae6fd)',
  'tablete': 'linear-gradient(135deg,#f3e8ff,#e9d5ff)',
  'default': 'linear-gradient(135deg,#f1f5f9,#e2e8f0)',
};

const ProductCard = ({ product, index = 0 }) => {
  const inStock = product.stock === 'instock';
  const emoji = EMOJI[product.category] || '📦';
  const bg = BG[product.category] || BG.default;

  return (
    <div
      className="product-card"
      style={{
        ...S.card,
        animationDelay: `${Math.min(index * 35, 400)}ms`,
      }}
    >
      {/* Image */}
      <div style={{ ...S.imgArea, background: bg }}>
        <span style={S.emoji}>{emoji}</span>
        {!inStock && <div style={S.outOfStock}>Epuizat</div>}
      </div>

      {/* Content */}
      <div style={S.body}>
        <span style={S.cat}>{product.category}</span>
        <h3 style={S.name}>{product.name}</h3>
        <p style={S.desc}>{product.description}</p>
        <div style={S.footer}>
          <span style={{ ...S.stock, color: inStock ? '#16a34a' : '#dc2626' }}>
            {inStock ? '● In stoc' : '● Epuizat'}
          </span>
          <span style={S.price}>
            {product.price > 0 ? `${product.price.toLocaleString('ro-RO')} RON` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

const S = {
  card: {
    background: '#ffffff',
    borderRadius: '18px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #f1f5f9',
    transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease',
    cursor: 'default',
    animation: 'cardIn 0.4s ease both',
  },
  imgArea: {
    height: '130px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
    overflow: 'hidden',
  },
  emoji: {
    fontSize: '54px',
    filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.12))',
    transition: 'transform 0.3s ease',
    lineHeight: 1,
  },
  outOfStock: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(239,68,68,0.9)',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '999px',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '0.3px',
    backdropFilter: 'blur(4px)',
  },
  body: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    flex: 1,
  },
  cat: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#94a3b8',
    fontWeight: '600',
    fontFamily: "'Outfit', sans-serif",
  },
  name: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: '1.4',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.2px',
  },
  desc: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1,
    fontFamily: "'Outfit', sans-serif",
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #f8fafc',
  },
  stock: {
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: "'Outfit', sans-serif",
  },
  price: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.3px',
  },
};

export default ProductCard;