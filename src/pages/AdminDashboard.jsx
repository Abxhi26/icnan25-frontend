import React, { useState, useEffect } from 'react';
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
    "Entry Logs"
];

function AdminDashboard() {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    // Shared states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [barcode, setBarcode] = useState('');
    const [barcodeAssignMsg, setBarcodeAssignMsg] = useState('');

    const [venue, setVenue] = useState('');
    const [entryMsg, setEntryMsg] = useState('');

    const [uploadFile, setUploadFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState('');

    const [allParticipants, setAllParticipants] = useState([]);
    const [allEntries, setAllEntries] = useState([]);
    const [stats, setStats] = useState({});

    useEffect(() => {
        if (activeTab === 3) {
            getAllParticipants().then(res => setAllParticipants(res.data || res)).catch(() => { });
        }
        if (activeTab === 4) {
            getAllEntries().then(res => setAllEntries(res.data || res)).catch(() => { });
            getEntryStats().then(res => setStats(res.data || res)).catch(() => { });
        }
    }, [activeTab]);

    // TAB 1: Search + Assign with card style
    const handleSearch = async () => {
        setSelectedUser(null);
        setBarcodeAssignMsg('');
        try {
            const res = await searchParticipants(searchQuery);
            setSearchResults(res.data || res);
        } catch {
            setSearchResults([]);
        }
    };

    const handleBarcodeAssign = async () => {
        try {
            await assignBarcode(selectedUser.email, barcode);
            setBarcodeAssignMsg('✅ Barcode assigned successfully!');
        } catch (e) {
            setBarcodeAssignMsg('❌ Barcode assignment failed.');
        }
    };

    // TAB 2: Mark entry
    const handleEntryMark = async () => {
        try {
            await markEntry(barcode, venue);
            setEntryMsg('✅ Entry marked successfully!');
        } catch (e) {
            setEntryMsg('❌ Entry marking failed.');
        }
    };

    // TAB 3: Upload participants
    const handleFileUpload = async () => {
        if (!uploadFile) return;
        setUploadMsg('Uploading...');
        try {
            await uploadParticipantsExcel(uploadFile);
            setUploadMsg('✅ Upload successful!');
        } catch (e) {
            setUploadMsg('❌ Upload failed.');
        }
    };

    return (
        <div className="admin-dashboard app-container">
            <div className="header-bar">
                <h2>ICNAN'25 Conference - Admin Dashboard</h2>
                <button className="logout-button" onClick={logout}>Logout</button>
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
                    <h3 style={{ color: "var(--accent)", marginBottom: '1rem' }}>Search & Assign Barcode</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
                        <input
                            type="text"
                            placeholder="Enter email, reference, name or phone"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ flex: '1', minWidth: '300px' }}
                        />
                        <button onClick={handleSearch}>Search</button>
                    </div>

                    {searchResults.length > 0 && searchResults.map(user => (
                        <div
                            key={user.email}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                marginBottom: '1.25rem',
                                borderColor: selectedUser?.email === user.email ? 'var(--accent)' : 'transparent',
                                boxShadow: selectedUser?.email === user.email ? '0 0 20px var(--accent2)' : 'none',
                                backgroundColor: selectedUser?.email === user.email ? 'rgba(231, 72, 72, 0.15)' : 'var(--card-bg)'
                            }}
                            onClick={() => {
                                setSelectedUser(user);
                                setBarcode(user.barcode || '');
                                setBarcodeAssignMsg('');
                            }}
                        >
                            <table style={{ width: '100%', color: 'var(--text-main)', backgroundColor: 'transparent' }}>
                                <tbody>
                                    <tr>
                                        <th>Reference No.</th><td>{user.referenceNo}</td>
                                        <th>Name</th><td>{user.name}</td>
                                    </tr>
                                    <tr>
                                        <th>Email</th><td>{user.email}</td>
                                        <th>Mobile</th><td>{user.mobileNo}</td>
                                    </tr>
                                    <tr>
                                        <th>Institution</th><td>{user.institution}</td>
                                        <th>Designation</th><td>{user.designation}</td>
                                    </tr>
                                    <tr>
                                        <th>Barcode</th><td colSpan={3}>{user.barcode || <span style={{ color: "var(--error)" }}>Not Assigned</span>}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {selectedUser && (
                        <div className="assign-barcode-box">
                            <div style={{ marginBottom: '10px' }}>
                                <strong>Assign/Update Barcode for:</strong> <span style={{ color: 'var(--accent)' }}>{selectedUser.name}</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Enter barcode"
                                value={barcode}
                                onChange={e => setBarcode(e.target.value)}
                                style={{ width: '240px', fontWeight: 'bold' }}
                            />
                            <button style={{ marginLeft: '14px' }} onClick={handleBarcodeAssign}>Assign</button>
                            <div style={{ marginTop: '8px', fontWeight: '600', color: barcodeAssignMsg.includes('❌') ? 'var(--error)' : 'var(--success)' }}>
                                {barcodeAssignMsg}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Mark Entry */}
            {activeTab === 1 && (
                <div className="panel">
                    <h3 style={{ color: "var(--accent)" }}>Mark Entry</h3>
                    <input
                        type="text"
                        placeholder="Enter participant barcode"
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                        style={{ marginBottom: '14px' }}
                    />
                    <input
                        type="text"
                        placeholder="Venue (e.g., Main Hall)"
                        value={venue}
                        onChange={e => setVenue(e.target.value)}
                    />
                    <button onClick={handleEntryMark} style={{ marginTop: '18px' }}>Mark Entry</button>
                    <div style={{ marginTop: '12px', fontWeight: '600', color: entryMsg.includes('❌') ? 'var(--error)' : 'var(--success)' }}>
                        {entryMsg}
                    </div>
                </div>
            )}

            {/* TAB 3: Upload report */}
            {activeTab === 2 && (
                <div className="panel">
                    <h3 style={{ color: "var(--accent)" }}>Upload Registration Excel</h3>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={e => setUploadFile(e.target.files[0])}
                        style={{ marginBottom: '14px' }}
                    />
                    <button onClick={handleFileUpload}>Upload</button>
                    <div style={{ marginTop: '12px', fontWeight: '600', color: uploadMsg.includes('❌') ? 'var(--error)' : 'var(--success)' }}>
                        {uploadMsg}
                    </div>
                </div>
            )}

            {/* TAB 4: All Participants */}
            {activeTab === 3 && (
                <div className="panel table-container">
                    <h3 style={{ color: "var(--accent)", marginBottom: '1rem' }}>All Participants</h3>
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
                                    <td>{p.barcode}</td>
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
                    <h3 style={{ color: "var(--accent)" }}>Entry Logs</h3>
                    <div>
                        <strong>Total Entries:</strong> {stats.totalEntries || 0} <br />
                        <strong>Unique Participants:</strong> {stats.uniqueParticipants || 0}
                    </div>
                    <table style={{ marginTop: 16 }}>
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
