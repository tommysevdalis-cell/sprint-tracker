import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPBs, predict400m, windAdjustedTime, formatTime, windStatus, sortByDate } from '../utils';

const EVENTS = ['100m', '200m', '400m'];

function PBCard({ event, race, target }) {
  return (
    <div className="pb-card">
      <div className="pb-event">{event}</div>
      {race ? (
        <>
          <div className="pb-time">{formatTime(race.time)}</div>
          <div className="pb-meta">
            {race.date ? new Date(race.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            {race.competition ? ` · ${race.competition}` : ''}
          </div>
          {race.wind && (
            <div className={`wind-chip ${windStatus(race.wind, event)}`} style={{ marginTop: 6 }}>
              {parseFloat(race.wind) > 0 ? '+' : ''}{race.wind} m/s wind
              {windStatus(race.wind, event) === 'illegal' ? ' (illegal)' : ''}
            </div>
          )}
          {target && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text2)' }}>
              Target: <span style={{ color: 'var(--accent)', fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{target}</span>
              {' '}· Gap: <span style={{ color: parseFloat(race.time) - parseFloat(target) > 0 ? 'var(--accent2)' : 'var(--accent3)', fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
                {((parseFloat(race.time) - parseFloat(target)) > 0 ? '+' : '') + (parseFloat(race.time) - parseFloat(target)).toFixed(2)}s
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="pb-time" style={{ color: 'var(--text2)', fontSize: 24 }}>No races yet</div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700, color: p.color }}>
            {p.value}s
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ data }) {
  const { races } = data;
  const pbs = useMemo(() => getPBs(races), [races]);

  // Predicted 400m
  const predicted400 = useMemo(() => {
    if (pbs['400m']) return null; // already have real 400m
    return predict400m(pbs['100m']?.time, pbs['200m']?.time);
  }, [pbs]);

  // Chart data - last 10 races for 100m and 200m
  const chartData100 = useMemo(() => {
    return races
      .filter(r => r.event === '100m')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12)
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
        time: parseFloat(r.time),
        comp: r.competition,
      }));
  }, [races]);

  const chartData200 = useMemo(() => {
    return races
      .filter(r => r.event === '200m')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12)
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
        time: parseFloat(r.time),
      }));
  }, [races]);

  const recentRaces = useMemo(() => sortByDate(races).slice(0, 6), [races]);

  const totalRaces = races.length;
  const seasonRaces = races.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === new Date().getFullYear();
  }).length;

  return (
    <div className="page">
      <div className="page-title">Dashboard</div>
      <div className="page-sub">{totalRaces} races logged · {seasonRaces} this season</div>

      {/* PB Row */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <PBCard event="100m" race={pbs['100m']} target="11.60" />
        <PBCard event="200m" race={pbs['200m']} />
        <PBCard event="400m" race={pbs['400m']} />
      </div>

      {/* Predicted 400m */}
      {predicted400 && (
        <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div className="card-title">Predicted 400m</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 800, color: 'var(--accent3)' }}>{predicted400}s</div>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 12, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
            Calculated from your 100m and 200m PBs.<br />
            Log a real 400m to replace this estimate.
          </div>
        </div>
      )}

      {/* Charts */}
      {chartData100.length >= 2 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">100m Progression</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData100}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="time" stroke="#e8ff47" strokeWidth={2} dot={{ fill: '#e8ff47', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData200.length >= 2 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">200m Progression</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData200}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="time" stroke="#00d2ff" strokeWidth={2} dot={{ fill: '#00d2ff', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent races */}
      <div className="card">
        <div className="card-title">Recent Races</div>
        {recentRaces.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏃</div>
            <p>No races logged yet. Add your first race to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Time</th>
                <th>Wind</th>
                <th>Competition</th>
                <th>Place</th>
              </tr>
            </thead>
            <tbody>
              {recentRaces.map(race => (
                <tr key={race.id}>
                  <td style={{ color: 'var(--text2)' }}>
                    {new Date(race.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td>
                    <span className="badge badge-yellow">{race.event}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 16 }}>{formatTime(race.time)}</span>
                    {pbs[race.event]?.id === race.id && <span className="pb-tag" style={{ marginLeft: 6 }}>PB</span>}
                  </td>
                  <td>
                    {race.wind ? (
                      <span className={`wind-chip ${windStatus(race.wind, race.event)}`}>
                        {parseFloat(race.wind) > 0 ? '+' : ''}{race.wind}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{race.competition || '—'}</td>
                  <td style={{ color: 'var(--text2)' }}>{race.placement || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
