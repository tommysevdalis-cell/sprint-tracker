import React, { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { genId, formatTime, getPBs } from '../utils';

function AddRivalModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [club, setClub] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">Add Rival</div>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Club / School</label>
          <input className="form-input" placeholder="e.g. Knox Athletics" value={club} onChange={e => setClub(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" placeholder="Strengths, race style, etc." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => name && onSave({ id: genId(), name, club, notes, times: [] })}>
            <UserPlus size={14} /> Add Rival
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTimeModal({ rival, onSave, onClose }) {
  const [form, setForm] = useState({ event: '100m', time: '', date: new Date().toISOString().split('T')[0], competition: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">Log time for {rival.name}</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Event</label>
            <select className="form-select" value={form.event} onChange={e => set('event', e.target.value)}>
              {['100m','200m','400m','relay'].map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Time (s)</label>
            <input className="form-input" type="number" step="0.01" placeholder="11.80" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Competition</label>
            <input className="form-input" placeholder="Meet name" value={form.competition} onChange={e => set('competition', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.time && onSave({ ...form, id: genId() })}>
            <Plus size={14} /> Save Time
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Rivals({ data, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addTimeFor, setAddTimeFor] = useState(null);

  const myPBs = getPBs(data.races);

  const addRival = (rival) => {
    onUpdate({ ...data, rivals: [...data.rivals, rival] });
    setShowAdd(false);
  };

  const deleteRival = (id) => {
    if (confirm('Remove this rival?')) {
      onUpdate({ ...data, rivals: data.rivals.filter(r => r.id !== id) });
    }
  };

  const addTime = (rivalId, time) => {
    const rivals = data.rivals.map(r =>
      r.id === rivalId ? { ...r, times: [...(r.times || []), time] } : r
    );
    onUpdate({ ...data, rivals });
    setAddTimeFor(null);
  };

  const getRivalPB = (rival, event) => {
    const times = (rival.times || []).filter(t => t.event === event);
    if (!times.length) return null;
    return times.reduce((best, t) => parseFloat(t.time) < parseFloat(best.time) ? t : best);
  };

  return (
    <div className="page">
      <div className="page-title">Rivals</div>
      <div className="page-sub">Track competitor times and compare head-to-head</div>

      <div className="section-header">
        <span />
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <UserPlus size={14} /> Add Rival
        </button>
      </div>

      {data.rivals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No rivals added yet. Add athletes you compete against to compare times.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.rivals.map(rival => (
            <div key={rival.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: 800 }}>{rival.name}</div>
                  {rival.club && <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{rival.club}</div>}
                  {rival.notes && <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>{rival.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setAddTimeFor(rival)}>
                    <Plus size={12} /> Log Time
                  </button>
                  <button onClick={() => deleteRival(rival.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 6 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Comparison table */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Their PB</th>
                    <th>Your PB</th>
                    <th>Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {['100m', '200m', '400m'].map(event => {
                    const theirPB = getRivalPB(rival, event);
                    const myPB = myPBs[event];
                    const gap = theirPB && myPB
                      ? (parseFloat(myPB.time) - parseFloat(theirPB.time)).toFixed(2)
                      : null;
                    return (
                      <tr key={event}>
                        <td><span className="badge badge-yellow">{event}</span></td>
                        <td style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700 }}>
                          {theirPB ? formatTime(theirPB.time) : '—'}
                        </td>
                        <td style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700 }}>
                          {myPB ? formatTime(myPB.time) : '—'}
                        </td>
                        <td>
                          {gap ? (
                            <span style={{
                              fontFamily: 'Barlow Condensed', fontWeight: 700,
                              color: parseFloat(gap) > 0 ? 'var(--accent2)' : 'var(--accent3)'
                            }}>
                              {parseFloat(gap) > 0 ? '+' : ''}{gap}s {parseFloat(gap) > 0 ? '(behind)' : '(ahead)'}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Recent times for this rival */}
              {rival.times && rival.times.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div className="card-title">All Logged Times</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[...rival.times].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                      <div key={t.id} style={{
                        background: 'var(--bg3)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '6px 12px', fontSize: 12
                      }}>
                        <span className="badge badge-yellow" style={{ marginRight: 6 }}>{t.event}</span>
                        <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15 }}>{formatTime(t.time)}</span>
                        <span style={{ color: 'var(--text2)', marginLeft: 6 }}>
                          {new Date(t.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })}
                          {t.competition ? ` · ${t.competition}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddRivalModal onSave={addRival} onClose={() => setShowAdd(false)} />}
      {addTimeFor && <AddTimeModal rival={addTimeFor} onSave={(time) => addTime(addTimeFor.id, time)} onClose={() => setAddTimeFor(null)} />}
    </div>
  );
}
