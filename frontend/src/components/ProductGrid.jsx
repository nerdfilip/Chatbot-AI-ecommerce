// ════════════════════════════════════════════════════════════
// FILE 3: src/components/ProductGrid.jsx
// ════════════════════════════════════════════════════════════
import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading, total, page, onPageChange }) => {
  const LIMIT = 15;
  const totalPages = Math.ceil(total / LIMIT);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#6b7280' }}>Se incarca produsele...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={styles.center}>
        <span style={{ fontSize: '48px' }}>🔍</span>
        <p style={{ color: '#6b7280' }}>Nu am gasit produse.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.info}>{total} produse gasite</div>

      <div style={styles.grid}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            style={{ ...styles.pageBtn, opacity: page === 1 ? 0.4 : 1 }}
          >
            ← Anterior
          </button>
          <span style={styles.pageInfo}>Pagina {page} din {totalPages}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            style={{ ...styles.pageBtn, opacity: page === totalPages ? 0.4 : 1 }}
          >
            Urmator →
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    padding: '20px 24px',
  },
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '80px', gap: '16px',
  },
  spinner: {
    width: '40px', height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #1a56db',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  info: {
    padding: '12px 24px 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  pagination: {
    display: 'flex', justifyContent: 'center',
    alignItems: 'center', gap: '16px', padding: '24px',
  },
  pageBtn: {
    padding: '8px 20px', borderRadius: '8px',
    border: '1px solid #e5e7eb', background: 'white',
    cursor: 'pointer', fontSize: '14px', fontWeight: '500',
  },
  pageInfo: { fontSize: '14px', color: '#6b7280' },
};

export default ProductGrid;