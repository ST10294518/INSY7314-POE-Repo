// Documentation references added during final review (9 November 2026).
// FS: https://nodejs.org/api/fs.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

let users = [];
let nextId = 1;

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

function loadFromDisk() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    users = JSON.parse(raw);
    nextId = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  } catch (err) {
    users = [];
    nextId = 1;
  }
}

function persistToDisk() {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

loadFromDisk();

function findByEmail(email) {
  const normalised = String(email).trim().toLowerCase();
  return users.find((u) => u.email === normalised);
}

function findById(id) {
  return users.find((u) => u.id === id);
}

function createUser({ email, passwordHash, role }) {
  const user = {
    id: nextId++,
    email: String(email).trim().toLowerCase(),
    passwordHash,
    role: role || 'client',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  persistToDisk();
  return user;
}

function toSafeUser(user) {
  if (!user) return null;
  const { id, email, role, createdAt } = user;
  return { id, email, role, createdAt };
}

module.exports = { findByEmail, findById, createUser, toSafeUser };