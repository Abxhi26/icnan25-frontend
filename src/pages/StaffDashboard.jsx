import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    searchParticipants,
    assignBarcode,
    deassignBarcode,
    markEntry,
    getEntryHistory,
} from '../services/api';
import './StaffDashboard.css';

function StaffDashboard() {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    // Search and assign barcode
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [barcode, setBarcode] = useState('');
    const [barcodeMsg, setBarcodeMsg] = useState({ text: '', type: '' });

    // Entry marking
    const [venue, setVenue] = useState('');
    const [entryMsg, setEntryMsg] = useState({ text: '', type: '' });
    const [history, setHistory] = useState([]);

    const searchRef = useRef(null);
    const barcodeRef = useRef(null);

    const showMsg = (setter, text, type = 'success', timeout = 3500) => {
        setter({ text, type });
        if (timeout) setTimeout(() => setter({ text: '', type: '' }), timeout);
    };

    // search
    const handleSearch = async () => {
        setSelectedUser(null);
        setBarcodeMsg({ text: '', type: '' });
        const term = (searchQuery || '').trim();
        if (!term) {
            showMsg(setBarcodeMsg, 'Enter search term (email/ref/name/phone)', 'error');
            return;
        }
        try {
            const res = await searchParticipants(term);
            const results = res.data || res;
            setSearchResults(Array.isArray(results) ? results : []);
            if (!results || (Array.isArray(results) && results.length === 0)) {
                showMsg(setBarcodeMsg, 'No participants found', 'error');
            }
        } catch (err) {
            console.error('search error', err);
            setSearchResults([]);
            showMsg(setBarcodeMsg, 'Search failed', 'error');
        }
    };

    // focus barcode when user selected
    useEffect(() => {
        if (selectedUser) {
            setBarcode(selectedUser.barcode || '');
            setTimeout(() => barcodeRef.current && barcodeRef.current.focus(), 70);
        }
    }, [selectedUser]);

    const handleBarcodeAssign = async (e) => {
        if (e) e.preventDefault();
        if (!selectedUser) {
            showMsg(setBarcodeMsg, 'Select a participant first', 'error');
            return;
        }
        const code = (barcode || '').trim();
        if (!code) {
            showMsg(setBarcodeMsg, 'Enter barcode', 'error');
            barcodeRef.current && barcodeRef.current.focus();
            return;
        }
        try {
            const res = await assignBarcode(selectedUser.email, code);
            const updated = (res && res.participant)
                ? { ...selectedUser, ...res.participant }
                : { ...selectedUser, barcode: code };
            setSelectedUser(updated);
            setSearchResults(prev =>
                prev.map(p => p.email === updated.email ? { ...p, barcode: updated.barcode } : p)
            );
            showMsg(setBarcodeMsg, 'Barcode assigned', 'success');
        } catch (err) {
            console.error('assign error', err);
            const msg = err?.response?.data?.error || 'Assignment failed';
            showMsg(setBarcodeMsg, msg, 'error');
        }
    };

    const handleBarcodeDeassign = async () => {
        if (!selectedUser) {
            showMsg(setBarcodeMsg, 'Select a participant first', 'error');
            return;
        }
        try {
            await deassignBarcode(selectedUser.email);
            const updated = { ...selectedUser, barcode: null };
            setSelectedUser(updated);
            setBarcode('');
            setSearchResults(prev =>
                prev.map(p => p.email === updated.email ? { ...p, barcode: null } : p)
            );
            showMsg(setBarcodeMsg, 'Barcode removed', 'success');
        } catch (err) {
            console.error('deassign error', err);
            const msg = err?.response?.data?.error || 'Failed to remove barcode';
            showMsg(setBarcodeMsg, msg, 'error');
        }
    };

    const onBarcodeKeyDown = (e) => {
        if (e.key === 'Enter') handleBarcodeAssign(e);
    };

    const handleMarkEntry = async () => {
        const code = (barcode || '').trim();
        if (!code || !venue) {
            showMsg(setEntryMsg, 'Provide barcode and venue', 'error');
            return;
        }
        try {
            await markEntry(code, venue);
            showMsg(setEntryMsg, 'Entry marked', 'success');
            const hist = await getEntryHistory(code);
            setHistory(hist.data?.entries || []);
        } catch (err) {
            console.error('mark entry err', err);
            const msg = err?.response?.data?.error || 'Error marking entry';
            showMsg(setEntryMsg, msg, 'error');
        }
    };

    return (
        <div className="staff-dashboard app-container">
            <div className="admin-nav">
                <h2>Staff Dashboard</h2>
                <button className="logout-button" onClick={logout}>Logout</button>
            </div>

            <div className="tabs">
                <button className={activeTab === 0 ? 'tab active' : 'tab'} onClick={() => setActiveTab(0)}>
                    Search & Assign
                </button>
                <button className={activeTab === 1 ? 'tab active' : 'tab'} onClick={() => setActiveTab(1)}>
                    Mark Entry
                </button>
            </div>

            {/* Tab 1: Search/Assign */}
            {activeTab === 0 && (
                <div className="panel">
                    <h3 className="panel-title">Search Participant & Assign Barcode</h3>

                    <div className="search-row">
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Email, ref, name, phone (press Enter to search)"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="search-input"
                        />
                        <button className="btn" onClick={handleSearch}>Search</button>
                    </div>

                    <div className="results-area">
                        {searchResults.length === 0 && (
                            <div className="muted">No results — try searching.</div>
                        )}

                        {searchResults.map(user => {
                            const isSelected = selectedUser && selectedUser.email === user.email;
                            return (
                                <div
                                    key={user.email}
                                    className={`user-row ${isSelected ? 'selected' : ''}`}
                                >
                                    <div className="user-top" onClick={() => { setSelectedUser(user); }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: 15 }}>{user.name}</div>
                                                <div style={{ color: 'var(--muted)' }}>{user.institution}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 800 }}>{user.referenceNo}</div>
                                                <div style={{ color: 'var(--muted)' }}>{user.mobileNo || '-'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="user-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Email: </span>
                                            <span className="detail-value">{user.email}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Registered Category: </span>
                                            <span className="detail-value">{user.registeredCategory || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Paper ID: </span>
                                            <span className="detail-value">{user.paperId || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Amount Paid: </span>
                                            <span className="detail-value">{user.amountPaid ?? '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Invoice:- </span>
                                            <span className="detail-value">{user.invoiceNo || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Barcode:- </span>
                                            <span className="detail-value">
                                                {user.barcode || <span style={{ color: 'var(--error)' }}>Not assigned</span>}
                                            </span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="assign-section assign-top-inline" style={{ marginTop: 10 }}>
                                            <label className="assign-label">Assign / Update Barcode</label>
                                            <input
                                                ref={barcodeRef}
                                                className="assign-input-inline"
                                                value={barcode}
                                                onChange={e => setBarcode(e.target.value)}
                                                onKeyDown={onBarcodeKeyDown}
                                                placeholder="Type barcode and press Enter"
                                            />
                                            <button className="btn-ghost" onClick={handleBarcodeAssign}>Assign</button>
                                            {selectedUser?.barcode && (
                                                <button
                                                    type="button"
                                                    className="btn-ghost danger"
                                                    onClick={handleBarcodeDeassign}
                                                >
                                                    Deassign
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {barcodeMsg.text && (
                        <div className={`msg ${barcodeMsg.type === 'error' ? 'msg-error' : 'msg-success'}`}>
                            {barcodeMsg.text}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Mark Entry */}
            {activeTab === 1 && (
                <div className="panel">
                    <h3 className="panel-title">Mark Entry</h3>

                    <div className="field-row">
                        <input
                            type="text"
                            placeholder="Enter participant barcode (or select from search)"
                            value={barcode}
                            onChange={e => setBarcode(e.target.value)}
                            className="wide-input"
                        />
                    </div>

                    <div className="field-row" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <select
                            value={venue}
                            onChange={(e) => setVenue(e.target.value)}
                            className="venue-select"
                            aria-label="Select venue"
                        >
                            <option value="">Select venue...</option>
                            <option value="Main Hall">Ambedkar Auditoriuml (TT018)</option>
                            <option value="Registration">Shakespeare Gallery (TT028)</option>
                            <option value="Auditorium A">Smart classroom (TT312)</option>
                            <option value="Auditorium B">Smart classroom (TT311)</option>
                        </select>

                        <button className="btn" onClick={handleMarkEntry} style={{ flex: '0 0 auto' }}>
                            Mark Entry
                        </button>
                    </div>

                    {entryMsg.text && (
                        <div className={`msg ${entryMsg.type === 'error' ? 'msg-error' : 'msg-success'}`}>
                            {entryMsg.text}
                        </div>
                    )}

                    <div style={{ marginTop: 16 }}>
                        <b>Entry History (recent):</b>
                        <ul>
                            {history.map(entry => (
                                <li key={entry.id}>
                                    {entry.venue} - {new Date(entry.timestamp).toLocaleString()}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffDashboard;
