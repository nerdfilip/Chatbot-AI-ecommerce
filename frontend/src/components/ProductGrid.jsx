import React from 'react';
import ProductCard from './ProductCard';

const LIMIT = 15;

const SkeletonCard = () => (
  <div style={skStyles.card}>
    <div style={{ ...skStyles.block, height: '120px', borderRadius: '12px 12px 0 0' }} />
    <div style={skStyles.body}>
      <div style={{ ...skStyles.block, height: '10px', width: '40%' }} />
      <div style={{ ...skStyles.block, height: '14px', width: '90%', marginTop: '6px' }} />
      <div style={{ ...skStyles.block, height: '12px', width: '75%', marginTop: '4px' }} />
      <div style={{ ...skStyles.block, height: '16px', width: '50%', marginTop: '10px' }} />
    </div>
  </div>
);

const skStyles = {
  card: {
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #f1f5f9',
  },
  block: {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '400px 100%',
    animation: 'shimmer 1.4s ease infinite',
    borderRadius: '6px',
  },
  body: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
};

const ProductGrid = ({ products, loading, total, page, onPageChange }) => {
  const totalPages = Math.ceil(total / LIMIT);

  if (loading) {
    return (
      <div>
        <div style={styles.info}>
          <div style={{ ...skStyles.block, height: '14px', width: '120px' }} />
        </div>
        <div className="products-grid">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={{ fontSize: '56px' }}>🔍</span>
        <p style={styles.emptyTitle}>Niciun produs găsit</p>
        <p style={styles.emptySubtitle}>Încearcă alte cuvinte cheie sau o altă categorie.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.topBar}>
        <span style={styles.info}>{total} produse</span>
        {totalPages > 1 && (
          <span style={styles.pageInfo}>Pagina {page} din {totalPages}</span>
        )}
      </div>

      <div className="products-grid">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
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

          <div style={styles.pageDots}>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  style={{
                    ...styles.pageDot,
                    ...(page === p ? styles.pageDotActive : {})
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            style={{ ...styles.pageBtn, opacity: page === totalPages ? 0.4 : 1 }}
          >
            Următor →
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px 4px',
  },
  info: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
    fontFamily: "'DM Sans', sans-serif",
  },
  pageInfo: {
    fontSize: '13px',
    color: '#94a3b8',
    fontFamily: "'DM Sans', sans-serif",
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    gap: '12px',
    animation: 'fadeUp 0.4s ease both',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#334155',
    fontFamily: "'DM Sans', sans-serif",
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    fontFamily: "'DM Sans', sans-serif",
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '32px 24px',
    flexWrap: 'wrap',
  },
  pageBtn: {
    padding: '9px 20px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s',
  },
  pageDots: {
    display: 'flex',
    gap: '4px',
  },
  pageDot: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s',
  },
  pageDotActive: {
    background: '#2563eb',
    border: '1.5px solid #2563eb',
    color: 'white',
    fontWeight: '700',
  },
};

export default ProductGrid;