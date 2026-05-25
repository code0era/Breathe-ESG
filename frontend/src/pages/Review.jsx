import React, { useState, useEffect } from 'react';
import { records } from '../api';
import { Check, X, Flag, Edit3, ShieldAlert, Filter, Calendar, MapPin, Clipboard } from 'lucide-react';

const Review = () => {
  const [dataRecords, setDataRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filtering states
  const [scopeFilter, setScopeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Active Modals
  const [editRecord, setEditRecord] = useState(null);
  const [rejectRecord, setRejectRecord] = useState(null);
  const [flagRecord, setFlagRecord] = useState(null);
  
  // Modal forms
  const [rejectComment, setRejectComment] = useState('');
  const [flagReason, setFlagReason] = useState('');
  
  // Edit Form Fields
  const [editValue, setEditValue] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editScope, setEditScope] = useState('Scope 1');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const filters = {
        scope: scopeFilter,
        status: statusFilter,
        location: locationFilter
      };
      const list = await records.getList(filters);
      setDataRecords(list);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [scopeFilter, statusFilter, locationFilter]);

  const handleApprove = async (id) => {
    try {
      await records.approve(id);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectRecord) return;
    
    try {
      await records.reject(rejectRecord.id, rejectComment);
      setRejectRecord(null);
      setRejectComment('');
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Rejection failed.');
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagRecord) return;

    try {
      await records.flag(flagRecord.id, flagReason);
      setFlagRecord(null);
      setFlagReason('');
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Flagging failed.');
    }
  };

  const openEditModal = (rec) => {
    setEditRecord(rec);
    setEditValue(rec.original_value);
    setEditUnit(rec.original_unit);
    setEditLocation(rec.location || '');
    setEditDate(rec.date);
    setEditCategory(rec.category);
    setEditScope(rec.scope);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editRecord) return;

    try {
      await records.update(editRecord.id, {
        original_value: parseFloat(editValue),
        original_unit: editUnit,
        location: editLocation,
        date: editDate,
        category: editCategory,
        scope: editScope
      });
      setEditRecord(null);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update record. Please verify fields.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
          Data Review Workspace
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Review, edit, flag, or approve activity data before locking for compliance auditor trails
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '32px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 600 }}>
          <Filter size={18} />
          <span>Filters</span>
        </div>

        {/* Scope Filter */}
        <div style={{ flex: 1, minWidth: '150px' }}>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="input-field"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Scopes</option>
            <option value="Scope 1">Scope 1 - Direct</option>
            <option value="Scope 2">Scope 2 - Indirect</option>
            <option value="Scope 3">Scope 3 - Value Chain</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ flex: 1, minWidth: '150px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved & Locked</option>
            <option value="rejected">Rejected</option>
            <option value="suspicious">Flagged Suspicious</option>
          </select>
        </div>

        {/* Location Filter */}
        <div style={{ flex: 1.5, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search location (e.g. US, Berlin, DEL)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="input-field"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Main Records review Grid */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div className="spinner"></div>
        </div>
      ) : dataRecords.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Clipboard size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3>No records found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting filters to view activity records.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Scope</th>
                <th>Category</th>
                <th>Location</th>
                <th>Activity Data</th>
                <th>Emissions (CO₂e)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dataRecords.map((rec) => (
                <tr key={rec.id}>
                  {/* Date */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span>{new Date(rec.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </td>
                  
                  {/* Scope Badge */}
                  <td>
                    <span className={`badge badge-scope${rec.scope.replace('Scope ', '')}`} style={{ fontSize: '0.65rem' }}>
                      {rec.scope}
                    </span>
                  </td>

                  {/* Category & Description */}
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>{rec.category}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rec.description}>
                        {rec.description}
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--text-muted)" />
                      <span>{rec.location || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Activity Quantity */}
                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {parseFloat(rec.original_value).toLocaleString(undefined, { maximumFractionDigits: 2 })} {rec.original_unit}
                    </span>
                  </td>

                  {/* Emissions CO2 */}
                  <td>
                    <strong style={{ fontSize: '0.95rem' }}>
                      {rec.co2e_kg >= 1000 ? 
                        `${(rec.co2e_kg / 1000).toFixed(2)} t` : 
                        `${parseFloat(rec.co2e_kg).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`
                      }
                    </strong>
                  </td>

                  {/* Status Badge & Flag comment if any */}
                  <td>
                    <div>
                      <span className={`badge badge-${rec.review_status}`} style={{ fontSize: '0.65rem' }}>
                        {rec.review_status === 'suspicious' ? 'Flagged' : rec.review_status}
                      </span>
                      {rec.review_status === 'suspicious' && rec.suspicious_reason && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-suspicious)', marginTop: '4px', fontSize: '0.7rem' }} title={rec.suspicious_reason}>
                          <ShieldAlert size={12} />
                          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rec.suspicious_reason}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {rec.review_status !== 'approved' ? (
                        <>
                          <button
                            onClick={() => openEditModal(rec)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '6px' }}
                            title="Edit Record Values"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleApprove(rec.id)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '6px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: 'none' }}
                            title="Approve & Lock Row"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setRejectRecord(rec)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '6px', color: 'var(--status-rejected)' }}
                            title="Reject Row"
                          >
                            <X size={14} />
                          </button>
                          {rec.review_status !== 'suspicious' && (
                            <button
                              onClick={() => setFlagRecord(rec)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px', borderRadius: '6px', color: 'var(--status-suspicious)' }}
                              title="Flag as Suspicious"
                            >
                              <Flag size={14} />
                            </button>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} color="var(--primary)" /> Locked
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL 1: EDIT Normalized Record --- */}
      {editRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', position: 'relative' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Edit Record Activity Data</h3>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Date</label>
                  <input type="date" required value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input-field" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Location / Grid Code</label>
                  <input type="text" placeholder="e.g. US, IN, DE" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="input-field" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Scope</label>
                  <select value={editScope} onChange={(e) => setEditScope(e.target.value)} className="input-field" style={{ background: 'var(--bg-primary)' }}>
                    <option value="Scope 1">Scope 1 - Direct</option>
                    <option value="Scope 2">Scope 2 - Indirect</option>
                    <option value="Scope 3">Scope 3 - Value Chain</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Category</label>
                  <input type="text" required value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="input-field" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Activity Quantity</label>
                  <input type="number" step="any" required value={editValue} onChange={(e) => setEditValue(e.target.value)} className="input-field" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Unit</label>
                  <input type="text" required value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="input-field" />
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                🚨 <strong>Calculation Note:</strong> Saving will trigger automatic carbon recalculations based on standard emission factors. Edit logs will be generated.
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditRecord(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Recalculate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: REJECT WITH COMMENT --- */}
      {rejectRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--status-rejected)' }}>Reject Activity Record</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>Detail why this record is being rejected before audit trail lock</p>
            
            <form onSubmit={handleRejectSubmit}>
              <div className="input-group">
                <label className="input-label">Rejection Comment</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Malformed units, cost center mismatch, duplicate entry..."
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="input-field"
                  style={{ resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setRejectRecord(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-danger">Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: FLAG SUSPICIOUS --- */}
      {flagRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--status-suspicious)' }}>Flag as Suspicious</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>Provide details/warnings requesting further info on this record</p>
            
            <form onSubmit={handleFlagSubmit}>
              <div className="input-group">
                <label className="input-label">Flagging Reason</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Unusually high consumption spike on meter, airport distance mismatch..."
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="input-field"
                  style={{ resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setFlagRecord(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--status-suspicious)' }}>Flag Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Review;
