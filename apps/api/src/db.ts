import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import crypto from 'crypto';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const SQL = await initSqlJs({
  locateFile: (file: string) => pathToFileURL(path.join(__dirname, '..', '..', '..', 'node_modules', 'sql.js', 'dist', file)).toString()
});

const dbData = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
const db = dbData ? new SQL.Database(new Uint8Array(dbData)) : new SQL.Database();

const schema = `
CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  coverage TEXT NOT NULL,
  rating REAL NOT NULL DEFAULT 0,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS service_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  service_type TEXT NOT NULL,
  preferred_date TEXT,
  preferred_time TEXT,
  details TEXT NOT NULL,
  status TEXT NOT NULL,
  received_at TEXT NOT NULL,
  partner_id TEXT,
  FOREIGN KEY(partner_id) REFERENCES partners(id)
);
`;

db.run(schema);

const existingRequestColumns = db.exec('PRAGMA table_info(service_requests)');
const requestColumnNames = existingRequestColumns.length ? existingRequestColumns[0].values.map((row: any) => row[1]) : [];

if (!requestColumnNames.includes('email')) {
  db.run('ALTER TABLE service_requests ADD COLUMN email TEXT NOT NULL DEFAULT ""');
}
if (!requestColumnNames.includes('service_type')) {
  db.run('ALTER TABLE service_requests ADD COLUMN service_type TEXT NOT NULL DEFAULT ""');
}
if (!requestColumnNames.includes('preferred_date')) {
  db.run('ALTER TABLE service_requests ADD COLUMN preferred_date TEXT');
}
if (!requestColumnNames.includes('preferred_time')) {
  db.run('ALTER TABLE service_requests ADD COLUMN preferred_time TEXT');
}

function saveDatabase() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  coverage: string;
  rating: number;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  preferredDate: string | null;
  preferredTime: string | null;
  details: string;
  status: string;
  receivedAt: string;
  partner_id: string | null;
}

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function runSelect<T>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  const rows: T[] = [];

  stmt.bind(params);
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();

  return rows;
}

function runGet<T>(sql: string, params: any[] = []): T | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const result = stmt.step() ? (stmt.getAsObject() as T) : null;
  stmt.free();

  return result;
}

export function getAllPartners(): Partner[] {
  return runSelect<Partner>('SELECT id, name, email, phone, coverage, rating, created_at FROM partners ORDER BY created_at DESC');
}

interface PartnerAuthRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  coverage: string;
  rating: number;
  password_hash: string;
  created_at: string;
}

function getPartnerAuthByEmail(email: string): PartnerAuthRecord | null {
  return runGet<PartnerAuthRecord>(
    'SELECT id, name, email, phone, coverage, rating, password_hash, created_at FROM partners WHERE email = ?',
    [email]
  );
}

export function getPartnerByEmail(email: string) {
  const partner = getPartnerAuthByEmail(email);
  if (!partner) return null;
  const { password_hash, ...publicPartner } = partner;
  return publicPartner;
}

export function validatePartnerCredentials(email: string, password: string): boolean {
  const partner = getPartnerAuthByEmail(email);
  if (!partner) return false;
  return partner.password_hash === hashPassword(password);
}

export function getRequestsByPartnerId(partnerId: string): ServiceRequest[] {
  return runSelect<ServiceRequest>(
    'SELECT id, name, email, phone, address, service_type AS serviceType, preferred_date AS preferredDate, preferred_time AS preferredTime, details, status, received_at AS receivedAt, partner_id FROM service_requests WHERE partner_id = ? ORDER BY received_at DESC',
    [partnerId]
  );
}

export function createPartner(params: {
  name: string;
  email: string;
  phone: string;
  coverage: string;
  password: string;
}): Partner {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const password_hash = hashPassword(params.password);

  const stmt = db.prepare(
    'INSERT INTO partners (id, name, email, phone, coverage, rating, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run([id, params.name, params.email, params.phone, params.coverage, 0, password_hash, created_at]);
  stmt.free();
  saveDatabase();

  return {
    id,
    name: params.name,
    email: params.email,
    phone: params.phone,
    coverage: params.coverage,
    rating: 0,
    created_at,
  };
}

export function getAllRequests(): ServiceRequest[] {
  return runSelect<ServiceRequest>(
    'SELECT id, name, email, phone, address, service_type AS serviceType, preferred_date AS preferredDate, preferred_time AS preferredTime, details, status, received_at AS receivedAt, partner_id FROM service_requests ORDER BY received_at DESC'
  );
}

export function getRequestById(id: string): ServiceRequest | null {
  return runGet<ServiceRequest>(
    'SELECT id, name, email, phone, address, service_type AS serviceType, preferred_date AS preferredDate, preferred_time AS preferredTime, details, status, received_at AS receivedAt, partner_id FROM service_requests WHERE id = ?',
    [id]
  );
}

export function updateRequestStatus(id: string, status: string): ServiceRequest | null {
  const stmt = db.prepare('UPDATE service_requests SET status = ? WHERE id = ?');
  const result = stmt.run([status, id]);
  stmt.free();

  if (result.changes === 0) {
    return null;
  }

  saveDatabase();
  return getRequestById(id);
}

export function createRequest(params: {
  name: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  details: string;
  partner_id?: string | null;
}): ServiceRequest {
  const id = crypto.randomUUID();
  const received_at = new Date().toISOString();
  const status = 'pendente';
  const partner_id = params.partner_id ?? null;

  const stmt = db.prepare(
    'INSERT INTO service_requests (id, name, email, phone, address, service_type, preferred_date, preferred_time, details, status, received_at, partner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run([
    id,
    params.name,
    params.email,
    params.phone,
    params.address,
    params.serviceType,
    params.preferredDate ?? null,
    params.preferredTime ?? null,
    params.details,
    status,
    received_at,
    partner_id
  ]);
  stmt.free();
  saveDatabase();

  return {
    id,
    name: params.name,
    email: params.email,
    phone: params.phone,
    address: params.address,
    serviceType: params.serviceType,
    preferredDate: params.preferredDate ?? null,
    preferredTime: params.preferredTime ?? null,
    details: params.details,
    status,
    receivedAt: received_at,
    partner_id,
  };
}
