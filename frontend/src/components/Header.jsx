import React from 'react';

const Header = ({ search, onSearch, onCategoryChange, categories, selectedCategory }) => {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>🛒</span>
        <span style={styles.logoText}>FilipShop</span>
      </div>

      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Cauta produse..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.categories}>
        <button
          onClick={() => onCategoryChange('')}
          style={{
            ...styles.catBtn,
            ...(selectedCategory === '' ? styles.catBtnActive : {})
          }}
        >
          Toate
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            style={{
              ...styles.catBtn,
              ...(selectedCategory === cat ? styles.catBtnActive : {})
            }}
          >
            {cat}
          </button>
        ))}
      </div>
    </header>
  );
};

const styles = {
  header: {
    background: '#1a56db',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  searchBar: {
    flex: 1,
    minWidth: '200px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  categories: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  catBtn: {
    padding: '6px 14px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.4)',
    background: 'transparent',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  catBtnActive: {
    background: 'white',
    color: '#1a56db',
    fontWeight: '600',
    border: '1px solid white',
  },
};

export default Header;