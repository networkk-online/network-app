import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const count = Math.min(Math.max(Number(process.env.COUNT || "100"), 1), 1000);
const prefix = process.env.PREFIX || "loadtest";

if (!url || !serviceRoleKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const users = [];
for (let i = 1; i <= count; i++) {
  const username = `${prefix}_${String(i).padStart(4, "0")}`;
  const email = `${username}@test.networkk.local`;
  const password = `${crypto.randomUUID().replaceAll("-", "")}A1!`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `Networkk Test ${i}`,
      username,
      is_test_account: true,
      test_batch: prefix
    }
  });
  if (error) {
    console.error(`Failed ${username}: ${error.message}`);
    continue;
  }
  users.push({ id: data.user.id, username, email, password });
}
fs.writeFileSync("test-users.json", JSON.stringify({ generated_at: new Date().toISOString(), count: users.length, users }, null, 2));
console.log(`Created ${users.length}/${count} test users.`);
