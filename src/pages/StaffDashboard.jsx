import React, { useState } from 'react';
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
    const [barcodeMsg, setBarcodeMsg] = useState('');

    // Entry marking
    const [venue, setVenue] = useState('');
    const [entryMsg, setEntryMsg] = useState('');
    const [history, setHistory] = useState([]);

    const handleSearch = async () => {
        setSelectedUser(null);
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
            setBarcodeMsg('Assigned!');
        } catch {
            setBarcodeMsg('Failed.');
        }
    };

    const handleMarkEntry = async () => {
        try {
            await markEntry(barcode, venue);
            setEntryMsg('Entry marked!');
            const hist = await getEntryHistory(barcode);
            setHistory(hist.data.entries || []);
        } catch {
            setEntryMsg('Error marking entry.');
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
                    <h3>Search Participant & Assign Barcode</h3>
                    <input
                        type="text"
                        placeholder="Email, ref, name, phone"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleSearch}>Search</button>
                    <div style={{ marginTop: 12 }}>
                        {searchResults.map(user => (
                            <div
                                key={user.email}
                                className="user-row"
                                onClick={() => setSelectedUser(user)}
                                style={{ cursor: 'pointer', padding: '12px 0' }}
                            >
                                <span>{user.name}</span>
                                <span>Barcode: <b>{user.barcode || '-'}</b></span>
                            </div>
                        ))}
                    </div>
                    {selectedUser && (
                        <div style={{ marginTop: 12 }}>
                            <div>Assign Barcode to: {selectedUser.name} ({selectedUser.email})</div>
                            <input
                                type="text"
                                placeholder="Barcode"
                                value={barcode}
                                onChange={e => setBarcode(e.target.value)}
                            />
                            <button onClick={handleBarcodeAssign}>Assign</button>
                            <div>{barcodeMsg}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Mark Entry */}
            {activeTab === 1 && (
                <div className="panel">
                    <h3>Mark Entry</h3>
                    <input
                        type="text"
                        placeholder="Participant Barcode"
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Venue"
                        value={venue}
                        onChange={e => setVenue(e.target.value)}
                    />
                    <button onClick={handleMarkEntry}>Mark Entry</button>
                    <div>{entryMsg}</div>
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
