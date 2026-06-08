import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPBs, predict400m, windAdjustedTime, formatTime, windStatus, sortByDate } from '../utils';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700, color: payload[0].color }}>{payload[0].value}s</div>
      </div>
    );
  }
  return null;
};

function PBCard({ event, race }) {
  return (
    <div className="pb-card">
      <div className="pb-event">{event}</div>
      {race ? (
        <>
          <div className="pb-time">{formatTime(race.time)}</div>
          <div className="pb-meta">{race.competition || ''}</div>
          {race.wind && race.wind !== 'Unknown' && (
            <div className={`wind-chip ${windStatus(race.wind, event)}`} style={{ fontSize: 11, marginTop: 4 }}>
              {parseFloat(race.wind) > 0 ? '+' : ''}{race.wind} m/s
            </div>
          )}
        </>
      ) : (
        <div className="pb-time" style={{ color: 'var(--text2)', fontSize: 20 }}>—</div>
      )}
    </div>
  );
}

export default function Dashboard({ data }) {
  const { races } = data;
  const pbs = useMemo(() => getPBs(races), [races]);

  const predicted400 = useMemo(() => {
    if (pbs['400m']) return null;
    return predict400m(pbs['100m']?.time, pbs['200m']?.time);
  }, [pbs]);

  const chartData100 = useMemo(() => races.filter(r => r.event === '100m').sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-10).map(r => ({
    date: new Date(r.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    time: parseFloat(r.time),
  })), [races]);

  const chartData200 = useMemo(() => races.filter(r => r.event === '200m').sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-10).map(r => ({
    date: new Date(r.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    time: parseFloat(r.time),
  })), [races]);

  const recent = useMemo(() => sortByDate(races).slice(0, 5), [races]);

  return (
    <div className="page">
      <div className="page-title">Dashboard</div>
      <div className="page-sub">{races.length} races logged</div>

      <div className="section-title">Personal Bests</div>
      <div className="stat-row">
        <PBCard event="100m" race={pbs['100m']} />
        <PBCard event="200m" race={pbs['200m']} />
        <PBCard event="400m" race={pbs['400m']} />
      </div>

      {predicted400 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 6 }}>Predicted 400m</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 800, color: 'var(--accent3)' }}>{predicted400}s</div>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 4 }}>Based on your 100m & 200m PBs</div>
        </div>
      )}

      {chartData100.length >= 2 && (
        <div className="card">
          <div className="section-title">100m Progression</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData100}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="time" stroke="#e8ff47" strokeWidth={2} dot={{ fill: '#e8ff47', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData200.length >= 2 && (
        <div className="card">
          <div className="section-title">200m Progression</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData200}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="time" stroke="#00d2ff" strokeWidth={2} dot={{ fill: '#00d2ff', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="section-title" style={{ marginTop: 4 }}>Recent Races</div>
      {recent.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">🏃</div><p>No races yet</p></div></div>
      ) : recent.map(race => {
        const isPB = pbs[race.event]?.id === race.id;
        return (
          <div key={race.id} className="race-card">
            <div className="race-card-header">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="badge badge-yellow">{race.event}</span>
                {isPB && <span className="pb-tag">PB</span>}
              </div>
              <span style={{ color: 'var(--text2)', fontSize: 12 }}>
                {race.date ? new Date(race.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: 36, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{formatTime(race.time)}</span>
              {race.wind && race.wind !== 'Unknown' && (
                <span className={`wind-chip ${windStatus(race.wind, race.event)}`}>{parseFloat(race.wind) > 0 ? '+' : ''}{race.wind} m/s</span>
              )}
            </div>
            {race.competition && <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>{race.competition}{race.placement ? ` · ${race.placement}` : ''}</div>}
          </div>
        );
      })}
    </div>
  );
}
