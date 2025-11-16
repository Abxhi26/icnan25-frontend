import React, { useState } from 'react';
import * as api from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [query, setQuery] = useState('');
    const [searchRes, setSearchRes] = useState([]);
    const [statsRes, setStatsRes] = useState(null);

    async function upload(e) {
        e.preventDefault();
        if (!file) return alert('Pick a file');

        try {
            const r = await api.uploadExcel(file);
            setResult(r);
        } catch (err) {
            // handle auth error nicely
            if (err && err.error && err.error === 'Not authenticated') {
                alert('You are not authenticated. Please login again as an Admin.');
                // optionally route to login page
                return;
            }
            setResult(err); }
    }

    async function search() {
        if (!query.trim()) return;
        try {
            const r = await api.searchParticipants(query.trim());
            setSearchRes(r);
        } catch (e) {
            setSearchRes([]);
            alert(e?.error || JSON.stringify(e));
        }
    }

    async function loadStats() {
        try {
            const s = await api.stats();
            setStatsRes(s);
        } catch (e) {
            setStatsRes(null);
            alert(e?.error || JSON.stringify(e));
        }
    }

    return (
        <div className="page admin-page">
            <div className="topbar">
                <h3>Admin Dashboard</h3>
                <div style={{ marginLeft: 'auto' }}><button className="btn small" onClick={loadStats}>Load Stats</button></div>
            </div>

            <section className="card">
                <h4>Upload participants (Excel)</h4>
                <form onSubmit={upload}>
                    <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0])} />
                    <button className="btn">Upload</button>
                </form>
                {result && <pre className="output">{JSON.stringify(result, null, 2)}</pre>}
            </section>

            <section className="card">
                <h4>Search participants</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="email / name / ref / mobile / barcode" />
                    <button className="btn" onClick={search}>Search</button>
                </div>
                <div>
                    {searchRes.map(p => (
                        <div key={p.id} className="participant-row">
                            <div className="meta">{p.name} — {p.email} — {p.referenceNo}</div>
                            <div>Barcode: <strong>{p.barcode || '—'}</strong></div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="card">
                <h4>Stats</h4>
                {statsRes ? <pre className="output">{JSON.stringify(statsRes, null, 2)}</pre> : <div>No stats loaded</div>}
            </section>
        </div>
    );
}
