import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    searchParticipants,
    assignBarcode,
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

    // keyboard shortcuts: / focuses search, b focuses barcode (when selected)
    useEffect(() => {
        function onKey(e) {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                searchRef.current && searchRef.current.focus();
            }
            if (e.key.toLowerCase() === 'b' && selectedUser && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                barcodeRef.current && barcodeRef.current.focus();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedUser]);

    const showMsg = (setter, text, type = 'success', timeout = 3500) => {
        setter({ text, type });
        if (timeout) setTimeout(() => setter({ text: '', type: '' }), timeout);
    };

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

    // when user selected, set barcode and focus input
    useEffect(() => {
        if (selectedUser) {
            setBarcode(selectedUser.barcode || '');
            setTimeout(() => barcodeRef.current && barcodeRef.current.focus(), 80);
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
            const updated = (res && res.participant) ? res.participant : { ...selectedUser, barcode: code };
            setSelectedUser(updated);
            setSearchResults(prev => prev.map(p => p.email === updated.email ? { ...p, barcode: updated.barcode } : p));
            showMsg(setBarcodeMsg, 'Barcode assigned', 'success');
        } catch (err) {
            console.error('assign error', err);
            showMsg(setBarcodeMsg, (err && err.error) ? err.error : 'Assignment failed', 'error');
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
            showMsg(setEntryMsg, 'Error marking entry', 'error');
        }
    };

    return (
        <div className="staff-dashboard app-container">
            <div className="admin-nav">
                <h2>Staff Dashboard</h2>
                <button className="logout-button" onClick={logout}>Logout</button>
            </div>

            <div className="tabs">
                <button className={activeTab === 0 ? 'tab active' : 'tab'} onClick={() => setActiveTab(0)}>Search & Assign</button>
                <button className={activeTab === 1 ? 'tab active' : 'tab'} onClick={() => setActiveTab(1)}>Mark Entry</button>
            </div>

            {/* Tab 1: Search/Assign */}
            {activeTab === 0 && (
                <div className="panel">
                    <h3 className="panel-title">Search Participant & Assign Barcode</h3>

                    <div className="search-row">
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Email, ref, name, phone (press / to focus)"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="search-input"
                        />
                        <button className="btn" onClick={handleSearch}>Search</button>
                    </div>

                    <div className="results-area">
                        {searchResults.map(user => {
                            const isSelected = selectedUser && selectedUser.email === user.email;
                            return (
                                <div
                                    key={user.email}
                                    className={`user-row ${isSelected ? 'selected' : ''}`}
                                >
                                    <div onClick={() => { setSelectedUser(user); setBarcode(user.barcode || ''); }}>
                                        <div className="row-top">
                                            <div className="name">{user.name}</div>
                                            <div className="email">{user.email}</div>
                                        </div>
                                        <div className="row-bottom">
                                            <div className="ref">{user.referenceNo}</div>
                                            <div className={`barcode-label ${user.barcode ? 'has' : ''}`}>{user.barcode || 'Not assigned'}</div>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="assign-inline">
                                            <input
                                                ref={barcodeRef}
                                                className="assign-input"
                                                value={barcode}
                                                onChange={e => setBarcode(e.target.value)}
                                                onKeyDown={onBarcodeKeyDown}
                                                placeholder="Type barcode and press Enter (or press 'b')"
                                            />
                                            <button className="btn-ghost" onClick={handleBarcodeAssign}>Assign</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {searchResults.length === 0 && <div className="muted">No results — try searching.</div>}
                    </div>

                    {barcodeMsg.text && <div className={`msg ${barcodeMsg.type === 'error' ? 'msg-error' : 'msg-success'}`}>{barcodeMsg.text}</div>}
                </div>
            )}

            {/* Tab 2: Mark Entry */}
            {activeTab === 1 && (
                <div className="panel">
                    <h3 className="panel-title">Mark Entry</h3>

                    <div className="field-row">
                        <input
                            type="text"
                            placeholder="Enter participant barcode (press b to focus)"
                            value={barcode}
                            ref={barcodeRef}
                            onChange={e => setBarcode(e.target.value)}
                            className="wide-input"
                        />
                    </div>

                    <div className="field-row">
                        <input
                            type="text"
                            placeholder="Venue (e.g., Main Hall)"
                            value={venue}
                            onChange={e => setVenue(e.target.value)}
                            className="wide-input"
                        />
                    </div>

                    <div className="field-row">
                        <button className="btn" onClick={handleMarkEntry}>Mark Entry</button>
                    </div>

                    {entryMsg.text && <div className={`msg ${entryMsg.type === 'error' ? 'msg-error' : 'msg-success'}`}>{entryMsg.text}</div>}

                    <div style={{ marginTop: 16 }}>
                        <b>Entry History (recent):</b>
                        <ul>
                            {history.map(entry => (
                                <li key={entry.id}>{entry.venue} - {new Date(entry.timestamp).toLocaleString()}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffDashboard;
