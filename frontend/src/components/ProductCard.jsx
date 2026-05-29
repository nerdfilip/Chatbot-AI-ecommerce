import React from 'react';

const EMOJI_MAP = {
  'telefoane': '📱', 'laptopuri': '💻', 'televizoare': '📺',
  'electrocasnice mari': '🏠', 'electrocasnice mici': '⚡',
  'tablete': '📟', 'smartwatch': '⌚', 'audio': '🎧',
  'monitoare': '🖥️', 'gaming': '🎮', 'stocare': '💾',
  'retea': '📡', 'periferice': '⌨️', 'foto-video': '📷',
  'smart home': '🏡', 'componente PC': '🔩', 'climatizare': '❄️',
  'accesorii': '🔋', 'ingrijire personala': '✨',
};

const ProductCard = ({ product, index = 0 }) => {
  const inStock = product.stock === 'instock';
  const emoji = EMOJI_MAP[product.category] || '📦';

  return (
    <div
      className="product-card"
      style={{
        ...styles.card,
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Image area */}
      <div style={styles.imageArea}>
        <span style={styles.emoji}>{emoji}</span>
        <span style={{
          ...styles.stockPill,
          background: inStock ? '#dcfce7' : '#fee2e2',
          color: inStock ? '#15803d' : '#b91c1c',
        }}>
          {inStock ? '✓ Stoc' : '✗ Epuizat'}
        </span>
      </div>

      {/* Body */}
      <div style={styles.body}>
        <span style={styles.category}>{product.category}</span>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.description}>{product.description}</p>
        <div style={styles.priceRow}>
          <span style={styles.price}>
            {product.price > 0
              ? `${product.price.toFixed(2)} RON`
              : 'Indisponibil'}
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    border: '1px solid #f1f5f9',
  },
  imageArea: {
    background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  emoji: {
    fontSize: '52px',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
    transition: 'transform 0.3s ease',
  },
  stockPill: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '20px',
    fontFamily: "'DM Sans', sans-serif",
  },
  body: {
    padding: '14px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  category: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#94a3b8',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
  },
  name: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: '1.4',
    fontFamily: "'DM Sans', sans-serif",
    marginTop: '2px',
  },
  description: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1,
    marginTop: '4px',
    fontFamily: "'DM Sans', sans-serif",
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #f1f5f9',
  },
  price: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#2563eb',
    fontFamily: "'DM Sans', sans-serif",
  },
};

export default ProductCard;