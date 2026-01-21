const fs = require('fs');
const path = require('path');

const DB_FILE = path.resolve(__dirname, '../../../../data/off_chain_db.json');

// Ensure directory exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Load DB
function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        return { records: {}, patients: {} };
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading DB file, initializing empty.", err);
        return { records: {}, patients: {} };
    }
}

// Save DB
function saveDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing DB file", err);
    }
}

// Accessors
function getRecord(id) {
    const db = loadDB();
    return db.records[id];
}

function saveRecord(id, data) {
    const db = loadDB();
    db.records[id] = data;
    saveDB(db);
}

function getPatient(uid) {
    const db = loadDB();
    return db.patients[uid];
}

function savePatient(uid, data) {
    const db = loadDB();
    db.patients[uid] = data;
    saveDB(db);
}

module.exports = {
    getRecord,
    saveRecord,
    getPatient,
    savePatient
};
