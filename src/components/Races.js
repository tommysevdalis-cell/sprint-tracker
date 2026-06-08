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
    if ((k === 'time' || k === 'wind') && (updated.event === '100m' || updated.event === '200m') && updated.time && !f._splitsManual) {
      const est = estimateSplits(updated.time, updated.wind, updated.event);
      updated.split1 = est.split1; updated.split2 = est.split2; updated._splitsAuto = true;
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
        <div className="modal-handle" />
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
            <label className="form-label">Time (s)</label>
            <input type="text" inputMode="decimal" className="form-input" placeholder="11.90" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Wind (m/s)</label>
            <input type="text" inputMode="decimal" className="form-input" placeholder="0.5" value={form.wind} onChange={e => set('wind', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Competition</label>
          <input type="text" className="form-input" placeholder="e.g. AVSL Round 5" value={form.competition} onChange={e => set('competition', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Track / Venue</label>
            <input type="text" className="form-input" placeholder="e.g. Lakeside" value={form.track} onChange={e => set('track', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Placement</label>
            <input type="text" className="form-input" placeholder="1st" value={form.placement} onChange={e => set('placement', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Shoes</label>
          <input type="text" className="form-input" placeholder="e.g. Nike Maxflys" value={form.shoe} onChange={e => set('shoe', e.target.value)} />
        </div>

        {(form.event === '100m' || form.event === '200m') && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>Splits</label>
              {form._splitsAuto && !form._splitsManual && <span className="badge badge-blue" style={{ fontSize: 10 }}>Auto</span>}
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
          <textarea className="form-textarea" placeholder="How you felt, conditions..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (!form.time) return alert('Time is required'); onSave(form); }}>
            {isEdit ? 'Save Changes' : 'Save Race'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Races({ data, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editRace, setEditRace] = useState(null);
  const [filterEvent, setFilterEvent] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const pbs = useMemo(() => getPBs(data.races), [data.races]);

  const handleAdd = (race) => { onUpdate({ ...data, races: [...data.races, { ...race, id: genId() }] }); setShowModal(false); };
  const handleEdit = (updated) => { onUpdate({ ...data, races: data.races.map(r => r.id === updated.id ? updated : r) }); setEditRace(null); };
  const handleDelete = (id) => { if (confirm('Delete this race?')) onUpdate({ ...data, races: data.races.filter(r => r.id !== id) }); };

  const filtered = useMemo(() => {
    let races = filterEvent === 'all' ? data.races : data.races.filter(r => r.event === filterEvent);
    if (sortBy === 'date') return sortByDate(races);
    return [...races].sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
  }, [data.races, filterEvent, sortBy]);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="page-title">Races</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>{data.races.length} logged</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Log</button>
      </div>

      <div className="filter-row">
        {['all', '100m', '200m', '400m', 'relay'].map(e => (
          <button key={e} className={`btn btn-sm ${filterEvent === e ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }} onClick={() => setFilterEvent(e)}>
            {e === 'all' ? 'All' : e}
          </button>
        ))}
        <button className={`btn btn-sm ${sortBy === 'time' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ whiteSpace: 'nowrap', marginLeft: 'auto' }}
          onClick={() => setSortBy(s => s === 'date' ? 'time' : 'date')}>
          {sortBy === 'date' ? '↓ Date' : '↓ Time'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><p>No races logged yet</p></div></div>
      ) : filtered.map(race => {
        const adj = windAdjustedTime(race.time, race.wind, race.event);
        const isPB = pbs[race.event]?.id === race.id;
        return (
          <div key={race.id} className="race-card">
            <div className="race-card-header">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="badge badge-yellow">{race.event}</span>
                {isPB && <span className="pb-tag">PB</span>}
              </div>
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <span style={{ color: 'var(--text2)', fontSize: 12, marginRight: 4 }}>
                  {race.date ? new Date(race.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                </span>
                <button className="icon-btn" onClick={() => setEditRace(race)}><Pencil size={15} /></button>
                <button className="icon-btn" onClick={() => handleDelete(race.id)}><Trash2 size={15} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <span className="race-card-time">{formatTime(race.time)}</span>
              {race.wind && race.wind !== 'Unknown' && (
                <span className={`wind-chip ${windStatus(race.wind, race.event)}`}>{parseFloat(race.wind) > 0 ? '+' : ''}{race.wind} m/s</span>
              )}
              {adj && race.wind && race.wind !== '0' && race.wind !== 'Unknown' && (
                <span style={{ color: 'var(--text2)', fontSize: 12, fontFamily: 'Barlow Condensed' }}>({adj} adj)</span>
              )}
            </div>

            <div className="race-card-meta">
              {race.competition && <div>🏆 {race.competition}</div>}
              {race.track && <div>📍 {race.track}</div>}
              {race.placement && <div>🥇 {race.placement}</div>}
              {race.shoe && <div>👟 {race.shoe}</div>}
              {race.split1 && race.split2 && <div>⚡ {race.split1} / {race.split2}</div>}
            </div>

            {race.notes && <div className="race-card-note">{race.notes}</div>}
          </div>
        );
      })}

      {showModal && <RaceModal onSave={handleAdd} onClose={() => setShowModal(false)} />}
      {editRace && <RaceModal initial={editRace} onSave={handleEdit} onClose={() => setEditRace(null)} />}
    </div>
  );
}
