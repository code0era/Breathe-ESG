import React, { useState, useEffect } from 'react';
import { ingestion } from '../api';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, ShieldAlert } from 'lucide-react';

const Ingest = () => {
  const [sources, setSources] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [file, setFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const srcData = await ingestion.getSources();
      setSources(srcData);
      if (srcData.length > 0) {
        setSelectedSource(srcData[0].id);
      }
      
      const uploadHistory = await ingestion.getUploads();
      setUploads(uploadHistory);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load ingest data sources or history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedSource) {
      setErrorMsg('Please select both a data source and a valid CSV file.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await ingestion.uploadFile(selectedSource, file);
      setSuccessMsg(`Ingestion success! Parsed ${response.rows_parsed} rows of activity data into normalized emissions records.`);
      setFile(null);
      // Reset input element
      document.getElementById('csv-file-picker').value = '';
      
      // Refresh upload history
      const freshUploads = await ingestion.getUploads();
      setUploads(freshUploads);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Ingestion parsing failed. Please verify file schema/headers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
          Data Ingestion Portal
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Upload ERP exports, utility portal CSVs, or travel logs to trigger automatic emissions parsing
        </p>
      </div>

      {/* Grid: Uploader + Guidelines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginBottom: '40px' }}>
        
        {/* Upload Form Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Upload Activity File</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a source and drag your export file</p>
          </div>

          {successMsg && (
            <div className="badge badge-approved" style={{ width: '100%', padding: '12px', borderRadius: '8px', textTransform: 'none', justifyContent: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="badge badge-rejected" style={{ width: '100%', padding: '12px', borderRadius: '8px', textTransform: 'none', justifyContent: 'flex-start', gap: '8px' }}>
              <ShieldAlert size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="datasource-select">Target Data Source Configuration</label>
              <select
                id="datasource-select"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="input-field"
                style={{ background: 'var(--bg-primary)' }}
              >
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.name} ({src.source_type_display})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="csv-file-picker">Choose CSV File</label>
              <div 
                style={{ 
                  border: '2px dashed var(--glass-border)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '30px', 
                  textAlign: 'center', 
                  background: 'rgba(255,255,255,0.01)',
                  transition: 'var(--transition-smooth)',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('csv-file-picker').click()}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <UploadCloud size={32} color="var(--primary)" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px' }}>
                  {file ? file.name : 'Click to select CSV export file'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Only standard system CSV exports supported'}
                </p>
                <input
                  id="csv-file-picker"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {loading ? 'Processing & Normalizing...' : 'Upload and Parse Data'}
            </button>
          </form>
        </div>

        {/* Guidelines Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Ingestion Schemas</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Verify headers to ensure flawless parsing</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* SAP */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileSpreadsheet size={16} color="var(--scope-1)" />
                <strong style={{ fontSize: '0.85rem' }}>SAP Fuel & Procurement (Scope 1)</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Expects headers: <code style={{ color: '#fff' }}>WERKS, MATNR, MENGE, MEINS, BUDAT, BWART</code>
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Plant codes (WERKS) and material numbers (MATNR) map to facilities & fuel types. Dates are YYYYMMDD.
              </p>
            </div>

            {/* Utility */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileSpreadsheet size={16} color="var(--scope-2)" />
                <strong style={{ fontSize: '0.85rem' }}>Utility Electricity (Scope 2)</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Expects headers: <code style={{ color: '#fff' }}>account_number, meter_id, billing_start, billing_end, consumption_kwh, location_code</code>
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Performs proportional calendar-month splits if billing periods span multiple months.
              </p>
            </div>

            {/* Travel */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileSpreadsheet size={16} color="var(--scope-3)" />
                <strong style={{ fontSize: '0.85rem' }}>Corporate travel (Scope 3)</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Expects headers: <code style={{ color: '#fff' }}>trip_id, traveler_name, travel_date, expense_type, origin, destination, quantity, unit</code>
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Automatically computes Great Circle distance using IATA airport coordinates for flight legs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ingestion Upload History */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Ingestion Pipeline Logs</h3>

        {historyLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
            Retrieving pipeline status logs...
          </p>
        ) : uploads.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
            No uploads processed yet.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Source Config</th>
                  <th>Status</th>
                  <th>Uploaded By</th>
                  <th>Date & Time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((up) => (
                  <tr key={up.id}>
                    <td style={{ fontWeight: 600 }}>{up.file_name}</td>
                    <td>{up.data_source_name}</td>
                    <td>
                      <span className={`badge badge-${
                        up.status === 'success' ? 'approved' : 
                        up.status === 'failed' ? 'rejected' : 
                        'pending'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {up.status_display}
                      </span>
                    </td>
                    <td>{up.uploaded_by?.email || 'System'}</td>
                    <td>{new Date(up.uploaded_at).toLocaleString()}</td>
                    <td>
                      {up.status === 'failed' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-rejected)' }} title={up.error_message}>
                          <AlertTriangle size={14} />
                          <span style={{ fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {up.error_message}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Processed successfully</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ingest;
