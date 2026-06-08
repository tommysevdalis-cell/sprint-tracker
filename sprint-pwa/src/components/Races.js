import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { getPBs, formatTime, windStatus, windAdjustedTime, genId, sortByDate, estimateSplits } from '../utils';

const EVENTS = ['100m', '200m', '400m', 'relay'];
const SURFACES = ['Synthetic', 'Track (rubber)', 'Grass', 'Other'];

function RaceModal({ initial, onSave, onClose }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial || {
    date: new Date().toISOString().split('T')[0],
    event: '100m', time: '', wind: '', competition: '', track: '',
    surface: 'Synthetic', placement: '', shoe: '', split1: '', split2: '', notes: '',
  });

  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    if ((k === 'time' || k === 'wind') && (updated.event === '100m' || updated.event === '200m')) {
      if (updated.time && !f._splitsManual) {
        const est = estimateSplits(updated.time, updated.wind, updated.event);
        updated.split1 = est.split1; updated.split2 = est.split2; updated._splitsAuto = true;
      }
    }
    if (k === 'event' && (v === '100m' || v === '200m') && updated.time) {
      const est = estimateSplits(updated.time, updated.wind, v);
      updated.split1 = est.split1; updated.split2 = est.split2; updated._splitsAuto = true; updated._splitsManual = false;
    }
    return updated;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{isEdit ? 'Edit Race' : 'Log Race'}</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Event</label>
            <select className="form-select" value={form.event} onChange={e => set('event', e.target.value)}>
              {EVENTS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Time (seconds)</label>
            <input type="text" inputMode="decimal" className="form-input" placeholder="11.90" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Wind (m/s)</label>
            <input type="text" inputMode="decimal" className="form-input" placeholder="0.5 or -1.2" value={form.wind} onChange={e => set('wind', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Competition</label>
          <input type="text" className="form-input" placeholder="e.g. State Champs, School Athletics" value={form.competition} onChange={e => set('competition', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Track / Venue</label>
            <input type="text" className="form-input" placeholder="e.g. MSAC, Albert Park" value={form.track} onChange={e => set('track', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Surface</label>
            <select className="form-select" value={form.surface} onChange={e => set('surface', e.target.value)}>
              {SURFACES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Placement</label>
            <input type="text" className="form-input" placeholder="1st, 2nd, 3..." value={form.placement} onChange={e => set('placement', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Shoes</label>
            <input type="text" className="form-input" placeholder="e.g. Nike Zoom, Puma evoSPEED" value={form.shoe} onChange={e => set('shoe', e.target.value)} />
          </div>
        </div>
        {(form.event === '100m' || form.event === '200m') && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="card-title" style={{ margin: 0 }}>Splits</span>
              {form._splitsAuto && !form._splitsManual && <span className="badge badge-blue" style={{ fontSize: 10 }}>Auto-estimated</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{form.event === '100m' ? '0–60m' : '0–100m'}</label>
                <input type="text" inputMode="decimal" className="form-input" value={form.split1}
                  onChange={e => setForm(f => ({ ...f, split1: e.target.value, _splitsManual: true, _splitsAuto: false }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{form.event === '100m' ? '60–100m' : '100–200m'}</label>
                <input type="text" inputMode="decimal" className="form-input" value={form.split2}
                  onChange={e => setForm(f => ({ ...f, split2: e.target.value, _splitsManual: true, _splitsAuto: false }))} />
              </div>
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" placeholder="Conditions, how you felt, technique notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (!form.time) return alert('Time is required'); onSave(form); }}>
            {isEdit ? <><Pencil size={14} /> Save Changes</> : <><Plus size={14} /> Save Race</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function RaceCard({ race, isPB, pbs, onEdit, onDelete }) {
  const adj = windAdjustedTime(race.time, race.wind, race.event);
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-yellow">{race.event}</span>
          {isPB && <span className="pb-tag">PB</span>}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => onEdit(race)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 6 }}><Pencil size={15} /></button>
          <button onClick={() => onDelete(race.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 6 }}><Trash2 size={15} /></button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 38, color: 'var(--accent)', lineHeight: 1 }}>{formatTime(race.time)}</span>
        {race.wind && race.wind !== 'Unknown' && (
          <span className={`wind-chip ${windStatus(race.wind, race.event)}`}>{parseFloat(race.wind) > 0 ? '+' : ''}{race.wind} m/s</span>
        )}
        {adj && race.wind && race.wind !== '0' && race.wind !== 'Unknown' && (
          <span style={{ color: 'var(--text2)', fontSize: 12, fontFamily: 'Barlow Condensed' }}>({adj} adj)</span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13, color: 'var(--text2)' }}>
        {race.date && <div>📅 {new Date(race.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })}</div>}
        {race.competition && <div>🏆 {race.competition}</div>}
        {race.track && <div>📍 {race.track}</div>}
        {race.placement && <div>🥇 {race.placement}</div>}
        {race.shoe && <div>👟 {race.shoe}</div>}
        {race.split1 && race.split2 && <div>⚡ {race.split1} / {race.split2}</div>}
      </div>
      {race.notes && (
        <div style={{ marginTop: 10, color: 'var(--text2)', fontSize: 12, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          {race.notes}
        </div>
      )}
    </div>
  );
}

export default function Races({ data, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editRace, setEditRace] = useState(null);
  const [filterEvent, setFilterEvent] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const pbs = useMemo(() => getPBs(data.races), [data.races]);

  const handleAddRace = (race) => { onUpdate({ ...data, races: [...data.races, { ...race, id: genId() }] }); setShowModal(false); };
  const handleEditRace = (updated) => { onUpdate({ ...data, races: data.races.map(r => r.id === updated.id ? updated : r) }); setEditRace(null); };
  const handleDelete = (id) => { if (confirm('Delete this race?')) onUpdate({ ...data, races: data.races.filter(r => r.id !== id) }); };

  const filtered = useMemo(() => {
    let races = filterEvent === 'all' ? data.races : data.races.filter(r => r.event === filterEvent);
    if (sortBy === 'date') return sortByDate(races);
    if (sortBy === 'time') return [...races].sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
    return races;
  }, [data.races, filterEvent, sortBy]);

  return (
    <div className="page">
      <div className="page-title">Race Log</div>
      <div className="page-sub">{data.races.length} races logged</div>

      <div className="section-header">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', '100m', '200m', '400m', 'relay'].map(e => (
            <button key={e} className={`btn ${filterEvent === e ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setFilterEvent(e)}>
              {e === 'all' ? 'All' : e}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">Sort: Date</option>
            <option value="time">Sort: Time</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> Log Race</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><p>No races logged yet.</p></div></div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card desktop-only">
            <table className="data-table">
              <thead><tr>
                <th>Date</th><th>Event</th><th>Time</th><th>Wind</th><th>Wind-adj</th>
                <th>Competition</th><th>Track</th><th>Place</th><th>Shoes</th><th>Splits</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(race => {
                  const adj = windAdjustedTime(race.time, race.wind, race.event);
                  const isPB = pbs[race.event]?.id === race.id;
                  return (
                    <tr key={race.id}>
                      <td style={{ color: 'var(--text2)', whiteSpace: 'nowrap' }}>{race.date ? new Date(race.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                      <td><span className="badge badge-yellow">{race.event}</span></td>
                      <td><span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 16 }}>{formatTime(race.time)}</span>{isPB && <span className="pb-tag" style={{ marginLeft: 6 }}>PB</span>}</td>
                      <td>{race.wind ? <span className={`wind-chip ${windStatus(race.wind, race.event)}`}>{parseFloat(race.wind) > 0 ? '+' : ''}{race.wind}</span> : '—'}</td>
                      <td style={{ color: 'var(--text2)', fontFamily: 'Barlow Condensed' }}>{adj && race.wind && race.wind !== '0' ? adj : '—'}</td>
                      <td style={{ color: 'var(--text2)' }}>{race.competition || '—'}</td>
                      <td style={{ color: 'var(--text2)' }}>{race.track || '—'}</td>
                      <td style={{ color: 'var(--text2)' }}>{race.placement || '—'}</td>
                      <td style={{ color: 'var(--text2)' }}>{race.shoe || '—'}</td>
                      <td style={{ color: 'var(--text2)', fontFamily: 'Barlow Condensed', fontSize: 12 }}>{race.split1 && race.split2 ? `${race.split1} / ${race.split2}` : '—'}</td>
                      <td><div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setEditRace(race)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4 }}><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(race.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(race => (
              <RaceCard key={race.id} race={race} isPB={pbs[race.event]?.id === race.id}
                onEdit={setEditRace} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}

      {showModal && <RaceModal onSave={handleAddRace} onClose={() => setShowModal(false)} />}
      {editRace && <RaceModal initial={editRace} onSave={handleEditRace} onClose={() => setEditRace(null)} />}
    </div>
  );
}
