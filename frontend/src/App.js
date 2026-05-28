import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import ChatWidget from './components/ChatWidget';
import { getProducts, getCategories } from './services/api';
import './App.css';

function App() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);

  useEffect(() => {
    getCategories().then(data => setCategories(data.categories || []));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts({ search, category, page, limit: 15 });
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Eroare:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleCategory = (val) => { setCategory(val); setPage(1); };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Header
        search={search}
        onSearch={handleSearch}
        categories={categories}
        selectedCategory={category}
        onCategoryChange={handleCategory}
      />
      <main style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <ProductGrid
          products={products}
          loading={loading}
          total={total}
          page={page}
          onPageChange={setPage}
        />
      </main>
      <ChatWidget />
    </div>
  );
}

export default App;