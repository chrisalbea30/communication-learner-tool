// Creates (or updates) the admin account so you can log in and reach /admin.
//
//   node scripts/seed-admin.mjs
//
// Reads .env.local. Username comes from ADMIN_USERNAME (default "admin").
// Password comes from ADMIN_PASSWORD env if set, otherwise defaults to "Admin123".
// Requires the schema migration (0001_init.sql) to have been applied first.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const env = {};
  try {
    const text = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    // ignore — fall back to process.env
  }
  return env;
}

const fileEnv = loadEnvLocal();
const get = (key, fallback) => process.env[key] ?? fileEnv[key] ?? fallback;

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");
const domain = get("AUTH_EMAIL_DOMAIN", "users.english-learner.app");
const username = get("ADMIN_USERNAME", "admin").toLowerCase();
const password = get("ADMIN_PASSWORD", "Admin123");

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const email = `${username}@${domain}`;
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const metadata = { username, display_username: "Admin" };

const { data: list, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) {
  console.error("Could not list users:", listError.message);
  process.exit(1);
}

const existing = list.users.find((u) => u.email === email);

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    user_metadata: metadata,
  });
  if (error) {
    console.error("Update failed:", error.message);
    process.exit(1);
  }
  console.log(`Updated existing admin account (${email}) and reset its password.`);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) {
    console.error("Create failed:", error.message);
    process.exit(1);
  }
  console.log(`Created admin account (${email}).`);
}

console.log(`\nLog in with username "${username}" and your chosen password.`);
console.log("Then open /admin.");
