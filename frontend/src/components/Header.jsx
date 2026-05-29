import React, { useState } from 'react';

const Header = ({ search, onSearch, onCategoryChange, categories, selectedCategory }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🛒</span>
          <span style={styles.logoText}>FilipShop</span>
        </div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Cauta produse..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => onSearch('')} style={styles.clearBtn}>✕</button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          style={styles.menuBtn}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Meniu categorii"
        >
          ☰
        </button>
      </div>

      {/* Categories */}
      <div style={{
        ...styles.catBar,
        ...(menuOpen ? styles.catBarOpen : {})
      }}>
        <div style={styles.catInner}>
          {['', ...categories].map((cat, i) => (
            <button
              key={i}
              onClick={() => { onCategoryChange(cat); setMenuOpen(false); }}
              style={{
                ...styles.catBtn,
                ...(selectedCategory === cat ? styles.catBtnActive : {})
              }}
            >
              {cat === '' ? 'Toate' : cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    background: '#2563eb',
    position: 'sticky',
    top: 0,
    zIndex: 200,
    boxShadow: '0 2px 20px rgba(37,99,235,0.3)',
  },
  inner: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
    textDecoration: 'none',
  },
  logoIcon: { fontSize: '22px' },
  logoText: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
    fontFamily: "'DM Sans', sans-serif",
  },
  searchWrap: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '14px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
    padding: '9px 36px 9px 36px',
    borderRadius: '24px',
    border: '2px solid rgba(255,255,255,0.25)',
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    backdropFilter: 'blur(8px)',
    transition: 'all 0.2s',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    background: 'rgba(255,255,255,0.3)',
    border: 'none',
    color: 'white',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  menuBtn: {
    display: 'none',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catBar: {
    borderTop: '1px solid rgba(255,255,255,0.15)',
    overflow: 'hidden',
    maxHeight: '52px',
    transition: 'max-height 0.3s ease',
  },
  catBarOpen: {
    maxHeight: '200px',
  },
  catInner: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '8px 24px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  catBtn: {
    padding: '5px 14px',
    borderRadius: '20px',
    border: '1.5px solid rgba(255,255,255,0.3)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: "'DM Sans', sans-serif",
  },
  catBtnActive: {
    background: 'white',
    color: '#2563eb',
    border: '1.5px solid white',
    fontWeight: '700',
  },
};

export default Header;