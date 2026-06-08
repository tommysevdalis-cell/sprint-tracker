import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPBs, calcImprovement } from '../utils';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || 'var(--text)' }}>{p.name}: {p.value}</div>)}
    </div>
  );
  return null;
};

export default function Stats({ data }) {
  const { races } = data;
  const pbs = useMemo(() => getPBs(races), [races]);

  const improvements = useMemo(() => ['100m', '200m', '400m'].map(e => ({
    event: e, improvement: calcImprovement(races, e), raceCount: races.filter(r => r.event === e).length,
  })), [races]);

  const windAnalysis = useMemo(() => {
    const r100 = races.filter(r => r.event === '100m' && r.time && r.wind && r.wind !== 'Unknown' && !isNaN(parseFloat(r.wind)));
    const legal = r100.filter(r => parseFloat(r.wind) <= 2.0);
    const illegal = r100.filter(r => parseFloat(r.wind) > 2.0);
    return {
      legalBest: legal.length ? Math.min(...legal.map(r => parseFloat(r.time))).toFixed(2) : null,
      illegalBest: illegal.length ? Math.min(...illegal.map(r => parseFloat(r.time))).toFixed(2) : null,
      legalCount: legal.length, illegalCount: illegal.length,
    };
  }, [races]);

  const monthlyVolume = useMemo(() => {
    const map = {};
    races.forEach(r => {
      const key = new Date(r.date).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([month, count]) => ({ month, count })).slice(-10);
  }, [races]);

  const shoeStats = useMemo(() => {
    const map = {};
    races.forEach(r => {
      if (!r.shoe || !r.time) return;
      if (!map[r.shoe]) map[r.shoe] = { shoe: r.shoe, count: 0, times: {} };
      map[r.shoe].count++;
      if (!map[r.shoe].times[r.event]) map[r.shoe].times[r.event] = [];
      map[r.shoe].times[r.event].push(parseFloat(r.time));
    });
    return Object.values(map).map(s => ({
      ...s,
      best100: s.times['100m'] ? Math.min(...s.times['100m']).toFixed(2) : null,
      best200: s.times['200m'] ? Math.min(...s.times['200m']).toFixed(2) : null,
    }));
  }, [races]);

  if (races.length === 0) return (
    <div className="page"><div className="page-title">Stats</div>
      <div className="card"><div className="empty-state"><div className="empty-state-icon">📊</div><p>Log some races to see stats</p></div></div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-title">Stats</div>
      <div className="page-sub">Performance analysis</div>

      <div className="section-title">Improvement (first → latest)</div>
      <div className="stat-row" style={{ marginBottom: 16 }}>
        {improvements.map(({ event, improvement, raceCount }) => (
          <div key={event} className="pb-card">
            <div className="pb-event">{event}</div>
            {improvement !== null ? (
              <><div className="pb-time" style={{ color: 'var(--accent3)', fontSize: 26 }}>{improvement}s</div>
              <div className="pb-meta">{raceCount} races</div></>
            ) : (
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>{raceCount < 2 ? 'Need 2+' : '—'}</div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title">100m Wind Split</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Legal (≤+2.0)</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 800, color: '#00d264' }}>{windAnalysis.legalBest || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{windAnalysis.legalCount} races</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Wind-assisted</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 800, color: 'var(--accent2)' }}>{windAnalysis.illegalBest || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{windAnalysis.illegalCount} races</div>
          </div>
        </div>
      </div>

      {monthlyVolume.length > 0 && (
        <div className="card">
          <div className="section-title">Races per Month</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={monthlyVolume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#e8ff47" radius={[4, 4, 0, 0]} name="Races" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {shoeStats.length > 0 && (
        <div className="card">
          <div className="section-title">Shoe Performance</div>
          <table className="data-table">
            <thead><tr><th>Shoe</th><th>Races</th><th>100m</th><th>200m</th></tr></thead>
            <tbody>
              {shoeStats.map(s => (
                <tr key={s.shoe}>
                  <td style={{ fontWeight: 500 }}>{s.shoe}</td>
                  <td style={{ color: 'var(--text2)' }}>{s.count}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{s.best100 || '—'}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{s.best200 || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
