import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ListOrdered, Users, BarChart2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Races from './components/Races';
import Rivals from './components/Rivals';
import Stats from './components/Stats';
import './styles.css';

const DEFAULT_DATA = { races: [], rivals: [], shoes: [] };

const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'races', icon: ListOrdered, label: 'Races' },
  { id: 'rivals', icon: Users, label: 'Rivals' },
  { id: 'stats', icon: BarChart2, label: 'Stats' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(d => { setData(d || DEFAULT_DATA); setLoaded(true); })
      .catch(() => setLoaded(true));

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const handleUpdate = (newData) => {
    setData(newData);
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    }).catch(console.error);
  };

  if (!loaded) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <div style={{ fontFamily: 'Barlow Condensed', color: '#e8ff47', fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>
          SPRINT TRACKER
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-logo">ST</div>
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`nav-btn ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}
          >
            <Icon size={18} />
            <span className="tooltip">{label}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        {page === 'dashboard' && <Dashboard data={data} />}
        {page === 'races' && <Races data={data} onUpdate={handleUpdate} />}
        {page === 'rivals' && <Rivals data={data} onUpdate={handleUpdate} />}
        {page === 'stats' && <Stats data={data} />}
      </main>
    </div>
  );
}
