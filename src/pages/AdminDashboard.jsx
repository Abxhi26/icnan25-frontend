import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    searchParticipants,
    getAllParticipants,
    uploadParticipantsExcel,
    assignBarcode,
    markEntry,
    getAllEntries,
    getEntryStats
} from '../services/api';
import './AdminDashboard.css';

const TABS = [
    "Search Participant",
    "Mark Entry",
    "Upload Report",
    "All Participants",
    "Entry Logs",
    "Accomodation"
];

function AdminDashboard() {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    // Shared states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [barcode, setBarcode] = useState('');
    const [barcodeAssignMsg, setBarcodeAssignMsg] = useState({ text: '', type: '' });

    const [venue, setVenue] = useState('');
    const [entryMsg, setEntryMsg] = useState({ text: '', type: '' });

    const [uploadFile, setUploadFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState({ text: '', type: '' });

    const [allParticipants, setAllParticipants] = useState([]);
    const [allEntries, setAllEntries] = useState([]);
    const [stats, setStats] = useState({});

    const barcodeInputRef = useRef(null);
    

    // load participants / entries when tab changes
    useEffect(() => {
        if (activeTab === 3) {
            getAllParticipants().then(res => setAllParticipants(res.data || res)).catch(() => { setAllParticipants([]); });
        }
        if (activeTab === 4) {
            getAllEntries().then(res => setAllEntries(res.data || res)).catch(() => { setAllEntries([]); });
            getEntryStats().then(res => setStats(res.data || res)).catch(() => setStats({}));
        }
    }, [activeTab]);

    // autofocus barcode input when a user is selected
    useEffect(() => {
        if (selectedUser) {
            setBarcode(selectedUser.barcode || '');
            setBarcodeAssignMsg({ text: '', type: '' });
            // small delay helps focus after re-render
            setTimeout(() => {
                if (barcodeInputRef.current) barcodeInputRef.current.focus();
            }, 70);
        }
    }, [selectedUser]);

    // helper to show timed messages
    const showMsg = (setter, text, type = 'success', timeout = 3000) => {
        setter({ text, type });
        if (timeout > 0) {
            setTimeout(() => setter({ text: '', type: '' }), timeout);
        }
    };

    // TAB 1: Search + Assign with card style
    const handleSearch = async () => {
        setSelectedUser(null);
        setBarcodeAssignMsg({ text: '', type: '' });

        const term = (searchQuery || '').trim();
        if (!term) {
            showMsg(setBarcodeAssignMsg, 'Enter a search term (email / name / ref / mobile / barcode)', 'error');
            return;
        }

        try {
            const res = await searchParticipants(term);
            const results = res.data || res;
            setSearchResults(Array.isArray(results) ? results : []);
            if (!results || (Array.isArray(results) && results.length === 0)) {
                showMsg(setBarcodeAssignMsg, 'No participants found', 'error');
            }
        } catch (err) {
            console.error('Search error', err);
            setSearchResults([]);
            showMsg(setBarcodeAssignMsg, 'Search failed', 'error');
        }
    };

    const handleBarcodeAssign = async (e) => {
        if (e) e.preventDefault();
        if (!selectedUser) {
            showMsg(setBarcodeAssignMsg, 'Select a participant first', 'error');
            return;
        }
        const code = (barcode || '').trim();
        if (!code) {
            showMsg(setBarcodeAssignMsg, 'Enter barcode before assigning', 'error');
            if (barcodeInputRef.current) barcodeInputRef.current.focus();
            return;
        }

        try {
            const res = await assignBarcode(selectedUser.email, code);
            // If API returns updated participant use it, else update local UI
            const updated = (res && res.participant) ? res.participant : { ...selectedUser, barcode: code };
            setSelectedUser(updated);
            // also update searchResults list
            setSearchResults(prev => prev.map(p => p.email === updated.email ? { ...p, barcode: updated.barcode } : p));
            showMsg(setBarcodeAssignMsg, 'Barcode assigned successfully', 'success', 3500);
        } catch (err) {
            console.error('Assign error', err);
            showMsg(setBarcodeAssignMsg, (err && err.error) ? err.error : 'Barcode assignment failed', 'error', 4500);
        }
    };

    // allow Enter key to assign in the input (no button click required)
    const onBarcodeKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBarcodeAssign(e);
        }
    };

    // TAB 2: Mark entry
    const handleEntryMark = async () => {
        const code = (barcode || '').trim();
        if (!code || !venue) {
            showMsg(setEntryMsg, 'Provide barcode and venue', 'error');
            return;
        }
        try {
            await markEntry(code, venue);
            showMsg(setEntryMsg, 'Entry marked successfully', 'success');
        } catch (err) {
            console.error('Mark entry error', err);
            showMsg(setEntryMsg, 'Entry marking failed', 'error');
        }
    };

    // TAB 3: Upload participants
    const handleFileUpload = async () => {
        if (!uploadFile) {
            showMsg(setUploadMsg, 'Choose a file before uploading', 'error');
            return;
        }
        showMsg(setUploadMsg, 'Uploading...', 'success', 10000);
        try {
            await uploadParticipantsExcel(uploadFile);
            showMsg(setUploadMsg, 'Upload successful', 'success', 3500);
            setUploadFile(null);
        } catch (err) {
            console.error('Upload error', err);
            showMsg(setUploadMsg, 'Upload failed', 'error', 6000);
        }
    };
    const [refreshing, setRefreshing] = useState(false);

    const refreshLogs = async () => {
        setRefreshing(true);
        try {
            const entriesRes = await getAllEntries();
            const statsRes = await getEntryStats();

            setAllEntries(entriesRes.data || entriesRes);
            setStats(statsRes.data || statsRes);
        } catch (err) {
            console.error("Error refreshing logs", err);
        }
        setTimeout(() => setRefreshing(false), 800);
    };
    


    return (
        <div className="admin-dashboard app-container">
            <div className="header-bar">
                <h1>ICNAN'25 Conference - Admin Dashboard</h1>
                <div className="header-actions">
                    <button className="logout-button" onClick={logout}>Logout</button>
                </div>
            </div>

            <div className="tabs">
                {TABS.map((tab, idx) => (
                    <button
                        key={tab}
                        className={`tab${activeTab === idx ? ' active' : ''}`}
                        onClick={() => setActiveTab(idx)}
                    >{tab}</button>
                ))}
            </div>

            {/* TAB 1: Search Participant */}
            {activeTab === 0 && (
                <div className="panel">
                    <h3 className="panel-title">Search & Assign Barcode</h3>

                    <div className="search-row">
                        <input
                            type="text"
                            placeholder="Enter email, reference, name or phone"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="search-input"
                        />
                        <button className="btn" onClick={handleSearch}>Search</button>
                    </div>

                    <div className="results-area">
                        {searchResults.length === 0 && <div className="muted">No results to show — try searching above.</div>}

                        {searchResults.map(user => {
                            const isSelected = selectedUser && selectedUser.email === user.email;
                            return (
                                <div
                                    key={user.email}
                                    className={`user-row ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setBarcode(user.barcode || '');
                                        setBarcodeAssignMsg({ text: '', type: '' });
                                    }}
                                >
                                    <div className="user-summary">
                                        <div className="u-left">
                                            <div className="u-ref">{user.referenceNo}</div>
                                            <div className="u-name">{user.name}</div>
                                            <div className="u-institution">{user.institution}</div>
                                        </div>
                                        <div className="u-right">
                                            <div className="u-email">{user.email}</div>
                                            <div className="u-phone">{user.mobileNo || '-'}</div>
                                            <div className={`u-barcode ${user.barcode ? 'has' : 'none'}`}>{user.barcode || 'Not assigned'}</div>
                                        </div>
                                    </div>

                                    {/* When selected, show top assign box inside this card */}
                                    {isSelected && (
                                        <div className="assign-section assign-top-inline">
                                            <label className="assign-label">Assign / Update Barcode</label>
                                            <input
                                                ref={barcodeInputRef}
                                                className="assign-input-inline"
                                                value={barcode}
                                                onChange={e => setBarcode(e.target.value)}
                                                onKeyDown={onBarcodeKeyDown}
                                                placeholder="Type barcode and press Enter"
                                            />
                                            <button className="btn-ghost" onClick={handleBarcodeAssign}>Assign</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* global feedback for assign */}
                    {barcodeAssignMsg.text && (
                        <div className={`msg ${barcodeAssignMsg.type === 'error' ? 'msg-error' : 'msg-success'}`}>
                            {barcodeAssignMsg.text}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Mark Entry */}
            {activeTab === 1 && (
                <div className="panel">
                    <h3 className="panel-title">Mark Entry</h3>

                    <div className="field-row">
                        <input
                            type="text"
                            placeholder="Enter participant barcode"
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
                            {/* Customize this list */}
                            <option value="">Select venue...</option>
                            <option value="Main Hall">Main Hall</option>
                            <option value="Registration">Registration</option>
                            <option value="Auditorium A">Auditorium A</option>
                            <option value="Auditorium B">Auditorium B</option>
                            <option value="Exhibition">Exhibition</option>
                            <option value="Food Court">Food Court</option>
                            <option value="VIP Lounge">VIP Lounge</option>
                        </select>

                        <button className="btn" onClick={handleEntryMark} style={{ flex: '0 0 auto' }}>Mark Entry</button>
                    </div>

                    {entryMsg.text && (
                        <div className={`msg ${entryMsg.type === 'error' ? 'msg-error' : 'msg-success'}`}>{entryMsg.text}</div>
                    )}
                </div>
            )}


            {/* TAB 3: Upload report */}
            {activeTab === 2 && (
                <div className="panel">
                    <h3 className="panel-title">Upload Registration Excel</h3>

                    <div className="field-row">
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={e => setUploadFile(e.target.files[0])}
                        />
                    </div>
                    <div className="field-row">
                        <button className="btn" onClick={handleFileUpload}>Upload</button>
                    </div>

                    {uploadMsg.text && (
                        <div className={`msg ${uploadMsg.type === 'error' ? 'msg-error' : 'msg-success'}`}>{uploadMsg.text}</div>
                    )}
                </div>
            )}

            {/* TAB 4: All Participants */}
            {activeTab === 3 && (
                <div className="panel table-container">
                    <h3 className="panel-title">All Participants</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Barcode</th>
                                <th>Institution</th>
                                <th>Reg. Category</th>
                                <th>Mobile No.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allParticipants.map(p => (
                                <tr key={p.email}>
                                    <td>{p.referenceNo}</td>
                                    <td>{p.name}</td>
                                    <td>{p.email}</td>
                                    <td>{p.barcode || '-'}</td>
                                    <td>{p.institution}</td>
                                    <td>{p.registeredCategory}</td>
                                    <td>{p.mobileNo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TAB 5: Entry Logs & Stats */}
            {activeTab === 4 && (
                <div className="panel">
                    <div className="panel-title-row">
                        <h3 className="panel-title">Entry Logs</h3>

                        {/* Refresh Icon */}
                        <span
                            className={`refresh-icon ${refreshing ? 'spin' : ''}`}
                            onClick={refreshLogs}
                            title="Refresh Logs"
                        >
                            🔄
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="stats-box">
                        <strong>Total Entries:</strong> {stats.totalEntries || 0} <br />
                        <strong>Unique Participants:</strong> {stats.uniqueParticipants || 0}
                    </div>

                    {/* Logs Table */}
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Reference</th>
                                <th>Email</th>
                                <th>Barcode</th>
                                <th>Venue</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allEntries.map(entry => (
                                <tr key={entry.id}>
                                    <td>{entry.participant?.name}</td>
                                    <td>{entry.participant?.referenceNo}</td>
                                    <td>{entry.participant?.email}</td>
                                    <td>{entry.participant?.barcode}</td>
                                    <td>{entry.venue}</td>
                                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}

export default AdminDashboard;
