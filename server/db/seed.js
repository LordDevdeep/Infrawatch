import { initDb, getDb } from './connection.js';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Must initialize the async sql.js database before using it
await initDb();
const db = getDb();

// Clear existing data (disable FK checks, drop and recreate)
db.pragma('foreign_keys = OFF');
db.exec(`
  DROP TABLE IF EXISTS activity_logs;
  DROP TABLE IF EXISTS ai_case_reviews;
  DROP TABLE IF EXISTS image_analyses;
  DROP TABLE IF EXISTS notes;
  DROP TABLE IF EXISTS notices;
  DROP TABLE IF EXISTS notice_templates;
  DROP TABLE IF EXISTS otp_tokens;
  DROP TABLE IF EXISTS violations;
  DROP TABLE IF EXISTS settings;
  DROP TABLE IF EXISTS users;
`);
db.pragma('foreign_keys = ON');

// Recreate schema
const __dirname2 = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(__dirname2, 'schema.sql'), 'utf-8');
db.exec(schema);

// ── CONSTANTS (from original) ────────────────────────────────────────────────
const WARDS = ["Koramangala","Whitefield","HSR Layout","Jayanagar","Hebbal","Indiranagar","Rajajinagar","Yelahanka","Banashankari","Marathahalli","BTM Layout","JP Nagar","Malleswaram","Sadashivanagar","Electronic City"];
const VTYPES = ["Unauthorized Floor Addition","No Building Permit","Encroachment on Public Land","Commercial Use in Residential Zone","Setback Violation","Illegal Basement Construction"];
const ADDRS = ["6/7, Dr Rajkumar Road, Rajajinagar 1st Block, Bengaluru 560010","14/2, 4th Cross, Koramangala 5th Block, Bengaluru 560095","11, Outer Ring Road Service Lane, Marathahalli, Bengaluru 560037","112, 9th Main, Jayanagar 4th Block, Bengaluru 560011","13, Margosa Road, Malleswaram, Bengaluru 560003","91, 15th B Cross, Yelahanka Satellite Town, Bengaluru 560064","18, ITPL Back Gate Road, Whitefield, Bengaluru 560048","Survey No. 47, Whitefield Main Road, Bengaluru 560066","No. 8, 100 Feet Road, HSR Layout Sector 3, Bengaluru 560102","Plot 88, 3rd Cross, Banashankari 3rd Stage, Bengaluru 560085","No. 67, Marathahalli Bridge Road, Bengaluru 560037","Site No. 23, 5th Main, BTM 2nd Stage, Bengaluru 560076","No. 12, 18th Main, JP Nagar 6th Phase, Bengaluru 560078","No. 3, Palace Road, Sadashivanagar, Bengaluru 560080","Survey No. 89, Hosur Main Road, Electronic City, Bengaluru 560100"];
const PENALTIES = [2.4,8.7,15.2,3.1,22.8,11.4,6.9,18.3,4.7,31.2,9.8,14.6,7.3,19.1,5.6];
const OWNERS = ["Ramesh Babu Naidu","Surekha Patel","Mohan Krishnamurthy","Anita Desai","Venkat Raju","Lakshmi Bai","Arun Hegde","Sangeetha Rao"];
const ZONES = ["Residential (R2)","Residential (R1)","Mixed Use (MU-1)","Commercial (C-1)","Residential (R3)"];
const APPROVED_YEARS = [2019,2018,2020,2016,2021,2017,2022];

// Ward center coordinates (lat, lng) for Bengaluru
const WARD_COORDS = {
  "Koramangala":    [12.9352, 77.6245],
  "Whitefield":     [12.9698, 77.7500],
  "HSR Layout":     [12.9116, 77.6389],
  "Jayanagar":      [12.9250, 77.5838],
  "Hebbal":         [13.0358, 77.5970],
  "Indiranagar":    [12.9784, 77.6408],
  "Rajajinagar":    [12.9886, 77.5523],
  "Yelahanka":      [13.1007, 77.5963],
  "Banashankari":   [12.9255, 77.5468],
  "Marathahalli":   [12.9591, 77.7019],
  "BTM Layout":     [12.9166, 77.6101],
  "JP Nagar":       [12.9063, 77.5857],
  "Malleswaram":    [13.0035, 77.5708],
  "Sadashivanagar": [13.0070, 77.5820],
  "Electronic City":[12.8399, 77.6770],
};

// ── SEED USERS ───────────────────────────────────────────────────────────────
const passwordHash = bcrypt.hashSync('infrawatch123', 10);

const insertUser = db.prepare(`
  INSERT INTO users (name, email, phone, password_hash, role, ward_access, status, last_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
`);

const users = [
  { name: "Priya Menon",      email: "priya.menon@bbmp.gov.in",    phone: "+91-9876543210", role: "inspector",     wards: '["Koramangala","HSR Layout"]',  status: "active",   ago: "-1 hours" },
  { name: "Rahul Sharma IAS", email: "rahul.sharma@bbmp.gov.in",   phone: "+91-9876543211", role: "commissioner",  wards: '"all"',                         status: "active",   ago: "-3 hours" },
  { name: "Deepak Nair",      email: "deepak.nair@bbmp.gov.in",    phone: "+91-9876543212", role: "field_officer", wards: '["Whitefield","Hebbal"]',       status: "inactive", ago: "-2 days" },
  { name: "Kavitha Reddy",    email: "kavitha.reddy@bbmp.gov.in",  phone: "+91-9876543213", role: "inspector",     wards: '["Jayanagar","JP Nagar"]',      status: "active",   ago: "-6 hours" },
  { name: "Suresh Kumar",     email: "suresh.kumar@bbmp.gov.in",   phone: "+91-9876543214", role: "field_officer", wards: '["Electronic City"]',           status: "active",   ago: "-1 days" },
  { name: "Admin User",       email: "admin@infrawatch.gov.in",    phone: "+91-9000000000", role: "admin",         wards: '"all"',                         status: "active",   ago: "-0 hours" },
];

const userIds = {};
for (const u of users) {
  const info = insertUser.run(u.name, u.email, u.phone, passwordHash, u.role, u.wards, u.status, u.ago);
  userIds[u.name] = info.lastInsertRowid;
}

const OFFICERS = ["Priya Menon","Rahul Sharma IAS","Deepak Nair","Kavitha Reddy","Suresh Kumar"];

// ── SEED VIOLATIONS ──────────────────────────────────────────────────────────
const TODAY = new Date("2026-04-11T09:00:00+05:30");

const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const insertViolation = db.prepare(`
  INSERT INTO violations (id, address, ward, ward_no, type, detected_date, confidence, status, officer_id, penalty, area, height_delta, survey_no, owner_name, zone, last_approved_year, lat, lng, city)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bengaluru')
`);

const insertNote = db.prepare(`
  INSERT INTO notes (violation_id, officer_id, officer_name, text, created_at)
  VALUES (?, ?, ?, ?, datetime('now'))
`);

// Insert violations directly (no transaction wrapper - sql.js handles saves per-statement)
for (let i = 0; i < 214; i++) {
  const ageDays = i % 120;
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() - ageDays);

  const status = i < 56 ? "NEW" : i < 104 ? "UNDER REVIEW" : i < 146 ? "NOTICE SENT" : i < 191 ? "RESOLVED" : "DISMISSED";
  const ward = WARDS[i % WARDS.length];
  const officerName = OFFICERS[i % OFFICERS.length];
  const officerId = userIds[officerName] || 1;
  const id = `#IW-${2847 + i}`;

  // Generate lat/lng with small random offset within ward
  const [baseLat, baseLng] = WARD_COORDS[ward];
  const lat = baseLat + (((i * 7 + 3) % 100) - 50) * 0.0003;
  const lng = baseLng + (((i * 13 + 7) % 100) - 50) * 0.0003;

  insertViolation.run(
    id,
    ADDRS[i % ADDRS.length],
    ward,
    `Ward ${68 + (i % 15)}`,
    VTYPES[i % VTYPES.length],
    fmtDate(dt),
    71 + ((i * 7) % 29),
    status,
    officerId,
    PENALTIES[i % PENALTIES.length],
    180 + ((i * 37) % 540),
    parseFloat((2.1 + ((i * 9) % 31) / 10).toFixed(1)),
    `${47 + (i % 153)}/${1 + (i % 4)}`,
    OWNERS[i % OWNERS.length],
    ZONES[i % 5],
    APPROVED_YEARS[i % 7],
    lat,
    lng
  );

  // First violation gets a note
  if (i === 0) {
    insertNote.run(id, officerId, officerName, "Satellite imagery shows 3rd floor unauthorized addition. Owner yet to respond.");
  }
}

// ── SEED NOTICE TEMPLATES ────────────────────────────────────────────────────
const insertTemplate = db.prepare(`INSERT INTO notice_templates (name, body) VALUES (?, ?)`);

insertTemplate.run("Ward Level Notice", `NOTICE OF ILLEGAL CONSTRUCTION

Ref No.: {violation_id}
Date: {date}

To: {owner_name}
{address}

You are hereby directed to halt all unauthorized construction and submit valid permits within 7 days.

Penalty under BBMP Act Sec 321 may be imposed.

— Issued by BBMP Ward Office`);

insertTemplate.run("Commissioner Escalation", `ESCALATION TO COMMISSIONER

Ref: {violation_id} | Date: {date}

Re: Unresolved violation at {address}
Owner: {owner_name}

Despite Ward Notice, structure remains in violation. Commissioner intervention requested.

Prepared by: {officer_name}`);

insertTemplate.run("Court Filing Draft", `COURT FILING DRAFT

Case No.: {violation_id}
Date: {date}

Before: District Magistrate

Complainant: BBMP
vs.
Respondent: {owner_name}
{address}

Petition under Section 321, BBMP Act for demolition and recovery.`);

// ── SEED SETTINGS ────────────────────────────────────────────────────────────
const insertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);

insertSetting.run('satellite_source', 'ISRO Bhuvan');
insertSetting.run('scan_frequency', 'Bi-weekly');
insertSetting.run('confidence_threshold', '85');
insertSetting.run('active_wards', JSON.stringify(WARDS.slice(0, 10)));
insertSetting.run('active_city', 'Bengaluru');

// ── SEED ACTIVITY LOGS ──────────────────────────────────────────────────────
const insertLog = db.prepare(`INSERT INTO activity_logs (message, type, user_id, violation_id, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))`);

const logs = [
  { m: "Satellite pass complete — Ward 68, 71, 72", ty: "info", ago: "-14 minutes" },
  { m: "Notice #IW-2851 generated — Koramangala", ty: "success", ago: "-18 minutes" },
  { m: "New violation flagged — HSR Layout Sector 3", ty: "warn", ago: "-23 minutes" },
  { m: "Officer Priya Menon reviewed #IW-2847", ty: "info", ago: "-30 minutes" },
  { m: "Permit DB sync complete — 2,841 records", ty: "success", ago: "-47 minutes" },
  { m: "Auto-flagged #IW-2863 — Whitefield 94%", ty: "warn", ago: "-56 minutes" },
  { m: "Commissioner escalation — Banashankari", ty: "warn", ago: "-67 minutes" },
  { m: "Field inspection assigned — Priya Menon", ty: "info", ago: "-77 minutes" },
  { m: "System boot — all modules operational", ty: "success", ago: "-2 hours" },
  { m: "Ward 72–76 scan queued", ty: "info", ago: "-3 hours" },
];

for (const l of logs) {
  insertLog.run(l.m, l.ty, 1, null, l.ago);
}

// ── SEED INTEGRATIONS (as settings) ─────────────────────────────────────────
insertSetting.run('integrations', JSON.stringify([
  { name: "BBMP Permit Database", status: "LIVE", lastSync: "2 hours ago", records: "2,841" },
  { name: "Revenue Dept API", status: "LIVE", lastSync: "4 hours ago", records: "12,487" },
  { name: "Email SMTP Gateway", status: "LIVE", lastSync: "6 min ago", records: "—" },
  { name: "Webhook Endpoint", status: "ERROR", lastSync: "6 hours ago", records: "—" },
]));

console.log('✓ Database seeded successfully');
console.log(`  - ${users.length} officers`);
console.log('  - 214 violations');
console.log('  - 3 notice templates');
console.log(`  - ${logs.length} activity logs`);
console.log('  - Settings configured');
console.log('');
console.log('Login credentials:');
console.log('  Email: admin@infrawatch.gov.in');
console.log('  Password: infrawatch123');
console.log('  (Or use OTP — code will print to server console)');

process.exit(0);
