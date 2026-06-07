import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { getPBs, formatTime, windAdjustedTime, calcImprovement } from '../utils';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color || 'var(--text)' }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Stats({ data }) {
  const { races } = data;
  const pbs = useMemo(() => getPBs(races), [races]);

  // Shoe performance
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

  // Track performance
  const trackStats = useMemo(() => {
    const map = {};
    races.forEach(r => {
      const key = r.track || 'Unknown';
      if (!map[key]) map[key] = { track: key, count: 0, times_100: [], times_200: [] };
      map[key].count++;
      if (r.event === '100m' && r.time) map[key].times_100.push(parseFloat(r.time));
      if (r.event === '200m' && r.time) map[key].times_200.push(parseFloat(r.time));
    });
    return Object.values(map).map(t => ({
      ...t,
      best100: t.times_100.length ? Math.min(...t.times_100).toFixed(2) : null,
      best200: t.times_200.length ? Math.min(...t.times_200).toFixed(2) : null,
    }));
  }, [races]);

  // Monthly volume
  const monthlyVolume = useMemo(() => {
    const map = {};
    races.forEach(r => {
      const d = new Date(r.date);
      const key = d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([month, count]) => ({ month, count })).slice(-12);
  }, [races]);

  // Improvement stats
  const improvements = useMemo(() => ['100m', '200m', '400m'].map(e => ({
    event: e,
    improvement: calcImprovement(races, e),
    raceCount: races.filter(r => r.event === e).length,
  })), [races]);

  // Wind analysis - legal vs illegal times for 100m
  const windAnalysis = useMemo(() => {
    const r100 = races.filter(r => r.event === '100m' && r.time && r.wind !== undefined && r.wind !== '');
    const legal = r100.filter(r => parseFloat(r.wind) <= 2.0);
    const illegal = r100.filter(r => parseFloat(r.wind) > 2.0);
    return {
      legalBest: legal.length ? Math.min(...legal.map(r => parseFloat(r.time))).toFixed(2) : null,
      illegalBest: illegal.length ? Math.min(...illegal.map(r => parseFloat(r.time))).toFixed(2) : null,
      legalCount: legal.length,
      illegalCount: illegal.length,
    };
  }, [races]);

  return (
    <div className="page">
      <div className="page-title">Stats</div>
      <div className="page-sub">Performance analysis and trends</div>

      {/* Improvement */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {improvements.map(({ event, improvement, raceCount }) => (
          <div key={event} className="card">
            <div className="card-title">{event} Improvement</div>
            {improvement !== null ? (
              <>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 800, color: 'var(--accent3)' }}>
                  {improvement}s
                </div>
                <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 4 }}>
                  across {raceCount} races · first → latest
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>
                {raceCount < 2 ? `Need 2+ ${event} races` : 'No data'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Wind analysis */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">100m Wind Analysis</div>
        <div style={{ display: 'flex', gap: 32 }}>
          <div>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Legal wind (≤+2.0 m/s)</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 800, color: '#00d264' }}>
              {windAnalysis.legalBest || '—'}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 12 }}>{windAnalysis.legalCount} races</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 32 }}>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Wind-assisted (&gt;+2.0 m/s)</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 800, color: 'var(--accent2)' }}>
              {windAnalysis.illegalBest || '—'}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 12 }}>{windAnalysis.illegalCount} races</div>
          </div>
        </div>
      </div>

      {/* Monthly volume */}
      {monthlyVolume.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Races per Month</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyVolume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#e8ff47" radius={[4, 4, 0, 0]} name="Races" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Shoe breakdown */}
      {shoeStats.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Shoe Performance</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Shoe</th>
                <th>Races</th>
                <th>Best 100m</th>
                <th>Best 200m</th>
              </tr>
            </thead>
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

      {/* Track breakdown */}
      {trackStats.length > 0 && (
        <div className="card">
          <div className="card-title">Track Performance</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Venue</th>
                <th>Races</th>
                <th>Best 100m</th>
                <th>Best 200m</th>
              </tr>
            </thead>
            <tbody>
              {trackStats.map(t => (
                <tr key={t.track}>
                  <td style={{ fontWeight: 500 }}>{t.track}</td>
                  <td style={{ color: 'var(--text2)' }}>{t.count}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{t.best100 || '—'}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{t.best200 || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {races.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p>Log some races to see your stats.</p>
          </div>
        </div>
      )}
    </div>
  );
}
