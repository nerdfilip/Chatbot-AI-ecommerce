// ════════════════════════════════════════════════════════════
// FILE 2: src/components/ProductCard.jsx
// ════════════════════════════════════════════════════════════
import React from 'react';

const getCategoryEmoji = (category) => {
  const map = {
    'telefoane': '📱', 'laptopuri': '💻', 'televizoare': '📺',
    'electrocasnice mari': '🏠', 'electrocasnice mici': '🔌',
    'tablete': '📟', 'smartwatch': '⌚', 'audio': '🎧',
    'monitoare': '🖥️', 'gaming': '🎮', 'stocare': '💾',
    'retea': '📡', 'periferice': '⌨️', 'foto-video': '📷',
    'smart home': '🏡', 'componente PC': '🔧', 'climatizare': '❄️',
    'accesorii': '🔋', 'ingrijire personala': '💆',
  };
  return map[category] || '📦';
};

const ProductCard = ({ product }) => {
  const inStock = product.stock === 'instock';

  return (
    <div style={styles.card}>
      <div style={styles.imageArea}>
        <span style={styles.emoji}>{getCategoryEmoji(product.category)}</span>
      </div>
      <div style={styles.body}>
        <span style={styles.category}>{product.category}</span>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.description}>{product.description}</p>
        <div style={styles.footer}>
          <span style={styles.price}>
            {product.price > 0 ? `${product.price.toFixed(2)} RON` : 'Pret indisponibil'}
          </span>
          <span style={{
            ...styles.stockBadge,
            background: inStock ? '#dcfce7' : '#fee2e2',
            color: inStock ? '#16a34a' : '#dc2626',
          }}>
            {inStock ? '✓ In stoc' : '✗ Indisponibil'}
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  imageArea: {
    background: '#f0f4ff',
    height: '110px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: '48px' },
  body: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '5px',
  },
  category: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#6b7280',
    fontWeight: '600',
  },
  name: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    color: '#111827',
    lineHeight: '1.4',
  },
  description: {
    margin: 0,
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.4',
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  price: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a56db',
  },
  stockBadge: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontWeight: '600',
  },
};

export default ProductCard;