import React, { useState, useRef, useEffect } from 'react';

const Header = ({ search, onSearch, onCategoryChange, categories, selectedCategory }) => {
  const [focused, setFocused] = useState(false);
  const catRef = useRef(null);

  // scroll active category into view
  useEffect(() => {
    if (catRef.current) {
      const active = catRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedCategory]);

  const allCats = [{ key: '', label: 'Toate' }, ...categories.map(c => ({ key: c, label: c }))];

  return (
    <header style={S.root}>
      <div style={S.top}>
        {/* Brand */}
        <div style={S.brand}>
          <div style={S.brandDot} />
          <span style={S.brandName}>FilipShop</span>
        </div>

        {/* Search */}
        <div style={{ ...S.searchBox, ...(focused ? S.searchBoxFocused : {}) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Caută produse, categorii..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={S.searchInput}
          />
          {search && (
            <button onClick={() => onSearch('')} style={S.clearBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Right slot — empty for symmetry */}
        <div style={S.brandRight}>
          <span style={S.tagline}>✦ e-commerce demo</span>
        </div>
      </div>

      {/* Category bar */}
      <div style={S.catWrap}>
        <div ref={catRef} style={S.catScroll}>
          {allCats.map(({ key, label }) => {
            const active = selectedCategory === key;
            return (
              <button
                key={key}
                data-active={active}
                onClick={() => onCategoryChange(key)}
                style={{ ...S.catPill, ...(active ? S.catPillActive : {}) }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

const S = {
  root: {
    background: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    zIndex: 200,
    boxShadow: '0 1px 24px rgba(0,0,0,0.06)',
  },
  top: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '16px 32px',
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
    alignItems: 'center',
    gap: '24px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
    boxShadow: '0 0 0 3px rgba(37,99,235,0.15)',
  },
  brandName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.5px',
  },
  brandRight: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  tagline: {
    fontSize: '12px',
    color: '#94a3b8',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '0.3px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '14px',
    padding: '10px 16px',
    transition: 'all 0.2s',
  },
  searchBoxFocused: {
    background: '#ffffff',
    borderColor: '#2563eb',
    boxShadow: '0 0 0 4px rgba(37,99,235,0.08)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    color: '#0f172a',
    fontFamily: "'Outfit', sans-serif",
    outline: 'none',
    minWidth: 0,
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
    flexShrink: 0,
    transition: 'color 0.15s',
  },
  catWrap: {
    borderTop: '1px solid #f8fafc',
    background: '#fafbfc',
  },
  catScroll: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '10px 32px',
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  catPill: {
    padding: '6px 16px',
    borderRadius: '999px',
    border: '1.5px solid #e2e8f0',
    background: '#ffffff',
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.18s',
    flexShrink: 0,
  },
  catPillActive: {
    background: '#0f172a',
    border: '1.5px solid #0f172a',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
  },
};

export default Header;