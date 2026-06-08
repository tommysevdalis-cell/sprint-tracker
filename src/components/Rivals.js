import React, { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { genId, formatTime, getPBs } from '../utils';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

export default function Rivals({ data, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addTimeFor, setAddTimeFor] = useState(null);
  const [name, setName] = useState(''); const [club, setClub] = useState(''); const [notes, setNotes] = useState('');
  const [timeForm, setTimeForm] = useState({ event: '100m', time: '', date: new Date().toISOString().split('T')[0], competition: '' });
  const myPBs = getPBs(data.races);

  const addRival = () => {
    if (!name) return;
    onUpdate({ ...data, rivals: [...data.rivals, { id: genId(), name, club, notes, times: [] }] });
    setShowAdd(false); setName(''); setClub(''); setNotes('');
  };

  const deleteRival = (id) => { if (confirm('Remove rival?')) onUpdate({ ...data, rivals: data.rivals.filter(r => r.id !== id) }); };

  const addTime = (rivalId) => {
    if (!timeForm.time) return;
    const rivals = data.rivals.map(r => r.id === rivalId ? { ...r, times: [...(r.times || []), { ...timeForm, id: genId() }] } : r);
    onUpdate({ ...data, rivals });
    setAddTimeFor(null);
    setTimeForm({ event: '100m', time: '', date: new Date().toISOString().split('T')[0], competition: '' });
  };

  const getRivalPB = (rival, event) => {
    const times = (rival.times || []).filter(t => t.event === event);
    if (!times.length) return null;
    return times.reduce((b, t) => parseFloat(t.time) < parseFloat(b.time) ? t : b);
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div><div className="page-title">Rivals</div><div className="page-sub" style={{ marginBottom: 0 }}>Head-to-head comparisons</div></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><UserPlus size={16} /> Add</button>
      </div>

      {data.rivals.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">👥</div><p>No rivals yet. Add athletes you compete against.</p></div></div>
      ) : data.rivals.map(rival => (
        <div key={rival.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: 800 }}>{rival.name}</div>
              {rival.club && <div style={{ color: 'var(--text2)', fontSize: 13 }}>{rival.club}</div>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => setAddTimeFor(rival)}><Plus size={13} /> Time</button>
              <button className="icon-btn" onClick={() => deleteRival(rival.id)}><Trash2 size={15} /></button>
            </div>
          </div>

          {['100m', '200m', '400m'].map(event => {
            const theirPB = getRivalPB(rival, event);
            const myPB = myPBs[event];
            const gap = theirPB && myPB ? (parseFloat(myPB.time) - parseFloat(theirPB.time)).toFixed(2) : null;
            return (
              <div key={event} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="badge badge-yellow">{event}</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>Them</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 18 }}>{theirPB ? formatTime(theirPB.time) : '—'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>You</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 18 }}>{myPB ? formatTime(myPB.time) : '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {gap ? <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15, color: parseFloat(gap) > 0 ? 'var(--accent2)' : 'var(--accent3)' }}>
                    {parseFloat(gap) > 0 ? '+' : ''}{gap}s
                  </span> : <span style={{ color: 'var(--text2)' }}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {showAdd && (
        <Modal title="Add Rival" onClose={() => setShowAdd(false)}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
          <div className="form-group"><label className="form-label">Club / School</label><input className="form-input" value={club} onChange={e => setClub(e.target.value)} placeholder="e.g. Knox Athletics" /></div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Strengths, race style..." /></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addRival}>Add Rival</button>
          </div>
        </Modal>
      )}

      {addTimeFor && (
        <Modal title={`Log time for ${addTimeFor.name}`} onClose={() => setAddTimeFor(null)}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Event</label>
              <select className="form-select" value={timeForm.event} onChange={e => setTimeForm(f => ({ ...f, event: e.target.value }))}>
                {['100m','200m','400m','relay'].map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Time (s)</label>
              <input type="text" inputMode="decimal" className="form-input" placeholder="11.80" value={timeForm.time} onChange={e => setTimeForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Date</label>
              <input type="date" className="form-input" value={timeForm.date} onChange={e => setTimeForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group"><label className="form-label">Competition</label>
              <input type="text" className="form-input" value={timeForm.competition} onChange={e => setTimeForm(f => ({ ...f, competition: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setAddTimeFor(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => addTime(addTimeFor.id)}>Save Time</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
