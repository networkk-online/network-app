import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const count = Math.min(Math.max(Number(process.env.COUNT || "1000"), 1), 10000);
const prefix = process.env.PREFIX || "networkk";
const concurrency = Math.min(Math.max(Number(process.env.CONCURRENCY || "20"), 1), 50);

if (!url || !serviceRoleKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const firstNames = [
  "Ali","Omar","Ahmed","Hassan","Hussein","Mohammed","Mustafa","Youssef","Zaid","Kareem",
  "Adam","Rayan","Sami","Laith","Haider","Mahdi","Murtadha","Salem","Yasin","Ammar",
  "Noor","Sara","Mariam","Lina","Layla","Dana","Huda","Aya","Maya","Zahra",
  "Fatima","Maryam","Rana","Reem","Jana","Nour","Leen","Malak","Farah","Dalia"
];

const lastNames = [
  "Hassan","Mohammed","Ali","Mahmoud","Khalil","Saeed","Salem","Nasser","Jaber","Yasin",
  "Mustafa","Hussein","Karim","Abbas","Fahad","Othman","Ibrahim","Saleh","Mansour","Hamid"
];

const countries = [
  "Iraq","Saudi Arabia","United Arab Emirates","Jordan","Kuwait","Qatar","Bahrain",
  "Egypt","Lebanon","Turkey","United Kingdom","Germany","Canada","United States"
];

const bios = [
  "Just sharing moments ✨",
  "Creator | Music | Travel",
  "Digital creator",
  "Coffee, tech & good vibes ☕",
  "Living life one post at a time",
  "Photography & daily moments 📸",
  "Building something new",
  "Music lover 🎧",
  "Travel • Food • Life",
  "Here for the community"
];

function pick(list, i, offset = 0) {
  return list[(i * 17 + offset * 7) % list.length];
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function makeProfile(i) {
  const first = pick(firstNames, i);
  const last = pick(lastNames, i, 1);
  const username = `${slug(first)}.${slug(last)}${String(i).padStart(2, "0")}`;
  return {
    username,
    full_name: `${first} ${last}`,
    bio: pick(bios, i, 2),
    country: pick(countries, i, 3)
  };
}

async function createOne(i) {
  const profile = makeProfile(i);
  const email = `${prefix}_${String(i).padStart(5, "0")}@test.networkk.local`;
  const password = `${crypto.randomUUID().replaceAll("-", "")}A1!`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      ...profile,
      is_test_account: true,
      test_batch: prefix,
      test_index: i
    }
  });

  if (error) {
    console.error(`Failed ${profile.username}: ${error.message}`);
    return null;
  }

  return {
    id: data.user.id,
    username: profile.username,
    full_name: profile.full_name,
    email,
    password,
    country: profile.country,
    is_test_account: true
  };
}

const users = [];
for (let start = 1; start <= count; start += concurrency) {
  const end = Math.min(start + concurrency - 1, count);
  const batch = await Promise.all(Array.from({ length: end - start + 1 }, (_, n) => createOne(start + n)));
  users.push(...batch.filter(Boolean));
  console.log(`Progress: ${users.length}/${count}`);
}

fs.writeFileSync(
  "test-users.json",
  JSON.stringify(
    { generated_at: new Date().toISOString(), count: users.length, users },
    null,
    2
  )
);

console.log(`Created ${users.length}/${count} realistic Networkk test users.`);
