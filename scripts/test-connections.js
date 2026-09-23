const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };

async function main() {
  console.log("=== SUPABASE & DATABASE CONNECTIVITY CHECK ===");

  // 1. Prisma / Postgres DB check
  console.log("\n[1] Testing Database (Supabase PostgreSQL via Prisma)...");
  const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("  ✗ DATABASE_URL is missing in .env / .env.local!");
  } else {
    const masked = dbUrl.replace(/:([^@]+)@/, ":****@");
    console.log("  Endpoint:", masked);
  }

  const prisma = new PrismaClient();
  try {
    const start = Date.now();
    const probe = await prisma.$queryRawUnsafe("SELECT current_database() as db, current_user as user, version() as ver;");
    const latency = Date.now() - start;
    console.log(`  ✓ Database Connected Successfully! (latency: ${latency}ms)`);
    console.log("  Probe details:", probe[0]?.db, "| User:", probe[0]?.user);

    const [users, questions, tests] = await Promise.all([
      prisma.user.count(),
      prisma.question.count(),
      prisma.test.count(),
    ]);
    console.log(`  Database Contents: ${users} users, ${questions} questions, ${tests} test records.`);
  } catch (err) {
    console.error("  ✗ Database Connection FAILED:", err.message);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Supabase Storage check
  console.log("\n[2] Testing Supabase Storage & API...");
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = env.SUPABASE_PDF_BUCKET || "pdfs";

  console.log("  Supabase URL:", supabaseUrl || "(missing)");
  if (!supabaseUrl || !serviceKey) {
    console.error("  ✗ Supabase URL or Service/Anon Key is missing!");
  } else {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        console.error("  ✗ Supabase Storage API error:", error.message);
      } else {
        console.log("  ✓ Supabase Storage Connected Successfully!");
        const bucketNames = (buckets || []).map((b) => b.name);
        console.log("  Available Buckets:", bucketNames.length ? bucketNames.join(", ") : "(no buckets)");
        const exists = bucketNames.includes(bucketName);
        if (!exists) {
          console.log(`  Attempting to create bucket '${bucketName}' using service role key...`);
          const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 26214400, // 25 MB
            allowedMimeTypes: ["application/pdf"],
          });
          if (createError) {
            console.log(`  ✗ Could not auto-create bucket: ${createError.message}`);
          } else {
            console.log(`  ✓ Successfully created public storage bucket '${bucketName}'!`);
          }
        } else {
          console.log(`  PDF Bucket ('${bucketName}'): EXISTS ✓`);
        }
      }
    } catch (err) {
      console.error("  ✗ Supabase Storage Exception:", err.message);
    }
  }

  console.log("\n==============================================");
}

main();
