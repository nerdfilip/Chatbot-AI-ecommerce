import React from 'react';
import ProductCard from './ProductCard';

const LIMIT = 15;

const SkeletonCard = ({ index }) => (
  <div style={{ ...SK.card, animationDelay: `${index * 40}ms` }}>
    <div style={SK.img} />
    <div style={SK.body}>
      <div style={{ ...SK.line, width: '35%', height: '10px' }} />
      <div style={{ ...SK.line, width: '85%', height: '14px', marginTop: '6px' }} />
      <div style={{ ...SK.line, width: '70%', height: '12px', marginTop: '4px' }} />
      <div style={{ ...SK.line, width: '55%', height: '12px', marginTop: '2px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <div style={{ ...SK.line, width: '30%', height: '11px' }} />
        <div style={{ ...SK.line, width: '35%', height: '14px' }} />
      </div>
    </div>
  </div>
);

const SK = {
  card: {
    background: 'white',
    borderRadius: '18px',
    overflow: 'hidden',
    border: '1px solid #f1f5f9',
    animation: 'cardIn 0.4s ease both',
  },
  img: {
    height: '130px',
    background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
    backgroundSize: '400px 100%',
    animation: 'shimmer 1.4s ease infinite',
  },
  body: { padding: '16px', display: 'flex', flexDirection: 'column' },
  line: {
    borderRadius: '6px',
    background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
    backgroundSize: '400px 100%',
    animation: 'shimmer 1.4s ease infinite',
  },
};

const ProductGrid = ({ products, loading, total, page, onPageChange }) => {
  const totalPages = Math.ceil(total / LIMIT);

  if (loading) {
    return (
      <div style={{ padding: '0 0 40px' }}>
        <div style={S.topBar}>
          <div style={{ ...SK.line, width: '100px', height: '13px' }} />
        </div>
        <div className="products-grid">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div style={S.empty}>
        <div style={S.emptyIcon}>🔍</div>
        <p style={S.emptyTitle}>Niciun produs găsit</p>
        <p style={S.emptySub}>Încearcă alte cuvinte cheie sau o altă categorie.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={S.topBar}>
        <span style={S.count}>{total} produse</span>
        {totalPages > 1 && (
          <span style={S.pageLabel}>Pagina {page} / {totalPages}</span>
        )}
      </div>

      <div className="products-grid">
        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>

      {totalPages > 1 && (
        <div style={S.pager}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            style={{ ...S.arrowBtn, opacity: page === 1 ? 0.35 : 1 }}
          >
            ← Anterior
          </button>

          <div style={S.dots}>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const p = i + 1;
              const active = page === p;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  style={{ ...S.dot, ...(active ? S.dotActive : {}) }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            style={{ ...S.arrowBtn, opacity: page === totalPages ? 0.35 : 1 }}
          >
            Următor →
          </button>
        </div>
      )}
    </div>
  );
};

const S = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px 8px',
  },
  count: {
    fontSize: '13px',
    color: '#94a3b8',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: '500',
  },
  pageLabel: {
    fontSize: '13px',
    color: '#cbd5e1',
    fontFamily: "'Outfit', sans-serif",
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '100px 24px',
    gap: '12px',
    animation: 'cardIn 0.4s ease both',
  },
  emptyIcon: { fontSize: '56px', marginBottom: '8px' },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#334155',
    fontFamily: "'Outfit', sans-serif",
  },
  emptySub: {
    fontSize: '14px',
    color: '#94a3b8',
    fontFamily: "'Outfit', sans-serif",
  },
  pager: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '40px 24px',
    flexWrap: 'wrap',
  },
  arrowBtn: {
    padding: '10px 22px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.15s',
  },
  dots: { display: 'flex', gap: '4px' },
  dot: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.15s',
  },
  dotActive: {
    background: '#0f172a',
    border: '1.5px solid #0f172a',
    color: 'white',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
  },
};

export default ProductGrid;