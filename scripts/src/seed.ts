/**
 * Seed script — populates the livestock_management database with demo data.
 * Run with:  pnpm --filter @workspace/scripts run seed
 *
 * Reads DATABASE_URL from:
 *   1. lib/db/.env
 *   2. artifacts/api-server/.env
 *   3. System environment
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  usersTable,
  animalsTable,
  milkEntriesTable,
  vaccinationsTable,
  notificationsTable,
} from "@workspace/db";

// ── Load .env ────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv(...paths: string[]) {
  for (const p of paths) {
    try {
      for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const i = t.indexOf("=");
        if (i === -1) continue;
        const k = t.slice(0, i).trim();
        const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
        if (k && !process.env[k]) process.env[k] = v;
      }
      return;
    } catch { /* not found */ }
  }
}

loadEnv(
  path.join(__dirname, "../../lib/db/.env"),
  path.join(__dirname, "../../artifacts/api-server/.env"),
);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL not set. Create lib/db/.env with DATABASE_URL=postgresql://...");
  process.exit(1);
}

// ── Connect ───────────────────────────────────────────────────────────────────
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
const db = drizzle(client);

console.log("✅  Connected to database");

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ── 1. Users ──────────────────────────────────────────────────────────────────
console.log("\n📋  Seeding users...");

const passwordHash = await bcrypt.hash("demo1234", 10);

const [ramesh] = await db.insert(usersTable).values({
  name: "Ramesh Kumar",
  email: "ramesh@krishipashu.com",
  passwordHash,
  role: "farmer",
  phone: "+91 9876543210",
}).returning();

const [sunita] = await db.insert(usersTable).values({
  name: "Sunita Devi",
  email: "sunita@krishipashu.com",
  passwordHash,
  role: "farmer",
  phone: "+91 9823456780",
}).returning();

console.log(`   ✔  Created 2 demo farmers (password for both: demo1234)`);

// ── 2. Animals ────────────────────────────────────────────────────────────────
console.log("\n🐄  Seeding animals...");

const animalsData = [
  // Ramesh's animals
  { animalId: "RAM-001", name: "Lakshmi",  species: "Cow",     breed: "Gir",         age: 4,   healthStatus: "healthy",  userId: ramesh.id, notes: "Best milk producer on the farm" },
  { animalId: "RAM-002", name: "Nandi",    species: "Bull",    breed: "Sahiwal",     age: 6,   healthStatus: "healthy",  userId: ramesh.id, notes: "Used for farming work" },
  { animalId: "RAM-003", name: "Gauri",    species: "Cow",     breed: "Sahiwal",     age: 3,   healthStatus: "sick",     userId: ramesh.id, notes: "Showing signs of fever — vet called" },
  { animalId: "RAM-004", name: "Meena",    species: "Goat",    breed: "Boer",        age: 2,   healthStatus: "healthy",  userId: ramesh.id, notes: "Very active" },
  { animalId: "RAM-005", name: "Chotu",    species: "Goat",    breed: "Sirohi",      age: 1,   healthStatus: "healthy",  userId: ramesh.id, notes: "Young kid" },
  { animalId: "RAM-006", name: "Bhuri",    species: "Buffalo", breed: "Murrah",      age: 5,   healthStatus: "healthy",  userId: ramesh.id, notes: "Good fat content in milk" },
  // Sunita's animals
  { animalId: "SUN-001", name: "Kamdhenu", species: "Cow",     breed: "Holstein",    age: 4,   healthStatus: "healthy",  userId: sunita.id, notes: "Imported breed, high yield" },
  { animalId: "SUN-002", name: "Rani",     species: "Buffalo", breed: "Surti",       age: 3,   healthStatus: "healthy",  userId: sunita.id, notes: "Calm temperament" },
  { animalId: "SUN-003", name: "Badal",    species: "Bull",    breed: "Tharparkar",  age: 7,   healthStatus: "under_treatment", userId: sunita.id, notes: "Leg injury — recovering" },
];

const insertedAnimals = await db.insert(animalsTable).values(animalsData).returning();
console.log(`   ✔  Created ${insertedAnimals.length} animals`);

const animalMap = Object.fromEntries(insertedAnimals.map(a => [a.animalId, a]));

// ── 3. Milk entries (last 30 days) ────────────────────────────────────────────
console.log("\n🥛  Seeding 30 days of milk entries...");

const milkAnimals = [
  { id: animalMap["RAM-001"].id, userId: ramesh.id, base: 12, variance: 2 },  // Lakshmi — Gir cow
  { id: animalMap["RAM-006"].id, userId: ramesh.id, base: 9,  variance: 1.5 }, // Bhuri — Buffalo
  { id: animalMap["RAM-004"].id, userId: ramesh.id, base: 1.5,variance: 0.3 }, // Meena — Goat
  { id: animalMap["SUN-001"].id, userId: sunita.id, base: 18, variance: 2 },  // Kamdhenu — Holstein
  { id: animalMap["SUN-002"].id, userId: sunita.id, base: 8,  variance: 1 },  // Rani — Surti buffalo
];

const milkRows = [];
for (let day = 30; day >= 0; day--) {
  const date = daysAgo(day);
  for (const animal of milkAnimals) {
    // Morning session
    const morningQty = Math.max(0.5, animal.base * 0.6 + (Math.random() - 0.5) * animal.variance);
    milkRows.push({ animalId: animal.id, userId: animal.userId, date, session: "morning", quantityLiters: parseFloat(morningQty.toFixed(1)) });
    // Evening session
    const eveningQty = Math.max(0.3, animal.base * 0.4 + (Math.random() - 0.5) * animal.variance);
    milkRows.push({ animalId: animal.id, userId: animal.userId, date, session: "evening", quantityLiters: parseFloat(eveningQty.toFixed(1)) });
  }
}

await db.insert(milkEntriesTable).values(milkRows);
console.log(`   ✔  Created ${milkRows.length} milk entries (30 days × 5 animals × 2 sessions)`);

// ── 4. Vaccinations ───────────────────────────────────────────────────────────
console.log("\n💉  Seeding vaccinations...");

const vaccinations = [
  // Ramesh
  { animalId: animalMap["RAM-001"].id, userId: ramesh.id, vaccineName: "FMD (Foot & Mouth Disease)", dateAdministered: daysAgo(90), nextDueDate: daysFromNow(90), administeredBy: "Dr. Sharma", notes: "Annual dose, reacting well" },
  { animalId: animalMap["RAM-001"].id, userId: ramesh.id, vaccineName: "Brucellosis", dateAdministered: daysAgo(180), nextDueDate: daysFromNow(185), administeredBy: "Dr. Sharma", notes: "" },
  { animalId: animalMap["RAM-002"].id, userId: ramesh.id, vaccineName: "FMD (Foot & Mouth Disease)", dateAdministered: daysAgo(60), nextDueDate: daysFromNow(120), administeredBy: "Dr. Sharma", notes: "" },
  { animalId: animalMap["RAM-003"].id, userId: ramesh.id, vaccineName: "Theileriosis", dateAdministered: daysAgo(10), nextDueDate: daysFromNow(355), administeredBy: "Dr. Patel", notes: "Given during treatment" },
  { animalId: animalMap["RAM-004"].id, userId: ramesh.id, vaccineName: "PPR (Goat Plague)", dateAdministered: daysAgo(30), nextDueDate: daysFromNow(335), administeredBy: "Dr. Sharma", notes: "" },
  { animalId: animalMap["RAM-005"].id, userId: ramesh.id, vaccineName: "PPR (Goat Plague)", dateAdministered: daysAgo(15), nextDueDate: daysFromNow(350), administeredBy: "Dr. Patel", notes: "" },
  { animalId: animalMap["RAM-006"].id, userId: ramesh.id, vaccineName: "FMD (Foot & Mouth Disease)", dateAdministered: daysAgo(45), nextDueDate: daysFromNow(5), administeredBy: "Dr. Sharma", notes: "Due soon!" },
  // Sunita
  { animalId: animalMap["SUN-001"].id, userId: sunita.id, vaccineName: "FMD (Foot & Mouth Disease)", dateAdministered: daysAgo(120), nextDueDate: daysFromNow(3), administeredBy: "Dr. Mehta", notes: "Booster due very soon" },
  { animalId: animalMap["SUN-001"].id, userId: sunita.id, vaccineName: "Mastitis Prevention", dateAdministered: daysAgo(60), nextDueDate: daysFromNow(120), administeredBy: "Dr. Mehta", notes: "High-yield cow, monitor closely" },
  { animalId: animalMap["SUN-002"].id, userId: sunita.id, vaccineName: "Haemorrhagic Septicaemia", dateAdministered: daysAgo(200), nextDueDate: daysFromNow(7), administeredBy: "Dr. Mehta", notes: "Annual — overdue soon" },
  { animalId: animalMap["SUN-003"].id, userId: sunita.id, vaccineName: "FMD (Foot & Mouth Disease)", dateAdministered: daysAgo(80), nextDueDate: daysFromNow(100), administeredBy: "Dr. Mehta", notes: "Given before injury" },
];

await db.insert(vaccinationsTable).values(vaccinations);
console.log(`   ✔  Created ${vaccinations.length} vaccination records`);

// ── 5. Notifications ──────────────────────────────────────────────────────────
console.log("\n🔔  Seeding notifications...");

const notifications = [
  { userId: ramesh.id,  type: "vaccination", title: "Vaccination Due — Bhuri",     message: "Bhuri's FMD vaccination is due in 5 days. Contact your vet to schedule.", link: "/vaccinations", isRead: false },
  { userId: ramesh.id,  type: "health",      title: "Gauri needs attention",        message: "Gauri is marked as sick. Monitor temperature and consult Dr. Patel.", link: "/animals", isRead: false },
  { userId: ramesh.id,  type: "milk",        title: "Milk log reminder",            message: "Don't forget to log today's morning and evening milk production.", link: "/milk", isRead: true },
  { userId: ramesh.id,  type: "general",     title: "Welcome to KrishiPashu!",      message: "Your farm is set up. Start by exploring the dashboard.", link: "/dashboard", isRead: true },
  { userId: sunita.id,  type: "vaccination", title: "Vaccination Due — Kamdhenu",   message: "Kamdhenu's FMD booster is due in 3 days. Book your vet appointment.", link: "/vaccinations", isRead: false },
  { userId: sunita.id,  type: "vaccination", title: "Vaccination Due — Rani",       message: "Rani's Haemorrhagic Septicaemia shot is due in 7 days.", link: "/vaccinations", isRead: false },
  { userId: sunita.id,  type: "health",      title: "Badal under treatment",        message: "Badal has a leg injury and is under treatment. Ensure rest and medication.", link: "/animals", isRead: false },
  { userId: sunita.id,  type: "general",     title: "Welcome to KrishiPashu!",      message: "Your farm is set up. Start exploring the dashboard.", link: "/dashboard", isRead: true },
];

await db.insert(notificationsTable).values(notifications);
console.log(`   ✔  Created ${notifications.length} notifications`);

// ── Done ──────────────────────────────────────────────────────────────────────
await client.end();

console.log(`
╔══════════════════════════════════════════════════════╗
║             🌾  Seed complete!                       ║
╠══════════════════════════════════════════════════════╣
║  Demo login credentials (both accounts):            ║
║                                                      ║
║  Farmer 1 — Ramesh Kumar                             ║
║    Email   : ramesh@krishipashu.com                  ║
║    Password: demo1234                                ║
║    Animals : 6  (Cow, Bull, Goats, Buffalo)         ║
║                                                      ║
║  Farmer 2 — Sunita Devi                              ║
║    Email   : sunita@krishipashu.com                  ║
║    Password: demo1234                                ║
║    Animals : 3  (Cow, Buffalo, Bull)                 ║
║                                                      ║
║  Both have 30 days of milk data, vaccinations,       ║
║  and notifications pre-loaded.                       ║
╚══════════════════════════════════════════════════════╝
`);
