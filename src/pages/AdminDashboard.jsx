import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    searchParticipants,
    getAllParticipants,
    uploadParticipantsExcel,
    assignBarcode,
    deassignBarcode,
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

    // States shared across tabs
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // Barcode
    const [barcode, setBarcode] = useState('');
    const [barcodeAssignMsg, setBarcodeAssignMsg] = useState('');

    // Mark entry
    const [venue, setVenue] = useState('');
    const [entryMsg, setEntryMsg] = useState('');

    // Upload
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState('');

    // All participants
    const [allParticipants, setAllParticipants] = useState([]);

    // Entry logs/statistics
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

    // TAB 1: Search and assign barcode
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
            const result = await assignBarcode(selectedUser.email, barcode);
            setBarcodeAssignMsg('Barcode assigned successfully!');
        } catch (e) {
            setBarcodeAssignMsg('Barcode assignment failed.');
        }
    };

    // TAB 2: Mark entry
    const handleEntryMark = async () => {
        try {
            await markEntry(barcode, venue);
            setEntryMsg('Entry marked successfully!');
        } catch (e) {
            setEntryMsg('Entry marking failed.');
        }
    };

    // TAB 3: Upload participants
    const handleFileUpload = async () => {
        if (!uploadFile) return;
        setUploadMsg('Uploading...');
        try {
            await uploadParticipantsExcel(uploadFile);
            setUploadMsg('Upload successful!');
        } catch (e) {
            setUploadMsg('Upload failed.');
        }
    };

    return (
        <div className="admin-dashboard app-container">
            <div className="admin-nav">
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
                    <h3>Search & Assign Barcode</h3>
                    <input
                        type="text"
                        placeholder="Enter email, reference, name or phone"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleSearch}>Search</button>
                    <div style={{ marginTop: 14 }}>
                        {searchResults.map(user => (
                            <div
                                key={user.email}
                                className="user-row"
                                onClick={() => setSelectedUser(user)}
                                style={{ cursor: 'pointer', padding: '12px 0' }}
                            >
                                <span>{user.name}</span> <span style={{ opacity: 0.7 }}>{user.email}</span>
                                <span>Barcode: <b>{user.barcode || '-'}</b></span>
                            </div>
                        ))}
                    </div>
                    {selectedUser && (
                        <div className="assign-section" style={{ marginTop: 16 }}>
                            <div>
                                <b>Assign Barcode to:</b> {selectedUser.name} ({selectedUser.email})
                            </div>
                            <input
                                type="text"
                                placeholder="Enter barcode"
                                value={barcode}
                                onChange={e => setBarcode(e.target.value)}
                            />
                            <button onClick={handleBarcodeAssign}>Assign</button>
                            <div>{barcodeAssignMsg}</div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Mark entry */}
            {activeTab === 1 && (
                <div className="panel">
                    <h3>Mark Entry</h3>
                    <input
                        type="text"
                        placeholder="Enter participant barcode"
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Venue (e.g., Main Hall)"
                        value={venue}
                        onChange={e => setVenue(e.target.value)}
                    />
                    <button onClick={handleEntryMark}>Mark Entry</button>
                    <div>{entryMsg}</div>
                </div>
            )}

            {/* TAB 3: Upload report */}
            {activeTab === 2 && (
                <div className="panel">
                    <h3>Upload Registration Excel</h3>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={e => setUploadFile(e.target.files[0])}
                    />
                    <button onClick={handleFileUpload}>Upload</button>
                    <div>{uploadMsg}</div>
                </div>
            )}

            {/* TAB 4: All Participants */}
            {activeTab === 3 && (
                <div className="panel table-container">
                    <h3>All Participants</h3>
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
                    <h3>Entry Logs</h3>
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
