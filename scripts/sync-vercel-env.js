/**
 * Copies environment variables from the local `.env` into a Vercel project.
 *
 *   node scripts/sync-vercel-env.js <project-name> [VAR ...]
 *   node scripts/sync-vercel-env.js iti-jhansi DATABASE_URL DIRECT_URL
 *
 * Why this exists: values in `.env` are written with surrounding quotes
 * (`DATABASE_URL="postgresql://..."`). Pasting one into the Vercel dashboard
 * with the quotes attached stores them literally, and Prisma then rejects the
 * value with "the URL must start with the protocol postgresql://". This strips
 * the quotes before sending.
 *
 * Values are piped straight to the Vercel CLI and are never printed; the script
 * reports only the shape of what it sent (protocol, length) so a bad value can
 * be spotted without exposing the credential.
 */
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const [projectName, ...requested] = process.argv.slice(2);

if (!projectName) {
  console.error("usage: node scripts/sync-vercel-env.js <project-name> [VAR ...]");
  process.exit(1);
}

const VARS = requested.length > 0 ? requested : ["DATABASE_URL", "DIRECT_URL"];

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // The whole point: drop wrapping quotes so they are not stored literally.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** Describe a value without revealing it. */
function shape(value) {
  const protocol = value.includes("://") ? value.split("://")[0] : "(none)";
  return `len=${value.length} protocol=${protocol}`;
}

function vercel(args, input) {
  return execFileSync("npx", ["vercel", ...args], {
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 60_000,
    shell: process.platform === "win32",
  });
}

const env = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };

console.log(`Linking to Vercel project "${projectName}"…`);
try {
  vercel(["link", "--project", projectName, "--yes"]);
} catch (error) {
  console.error("  could not link:", String(error.stderr || error.message).slice(0, 200));
  process.exit(1);
}

let failures = 0;
for (const name of VARS) {
  const value = env[name];
  if (!value) {
    console.error(`  ${name}: not found in .env / .env.local, skipped`);
    failures += 1;
    continue;
  }

  // Removing first is required: `vercel env add` will not overwrite.
  try {
    vercel(["env", "rm", name, "production", "--yes"]);
  } catch {
    // Not set yet, which is fine.
  }

  try {
    vercel(["env", "add", name, "production"], value);
    console.log(`  ${name}: set (${shape(value)})`);
  } catch (error) {
    console.error(`  ${name}: FAILED ${String(error.stderr || error.message).slice(0, 160)}`);
    failures += 1;
  }
}

console.log(
  failures === 0
    ? "\nDone. Redeploy for the new values to take effect:\n  npx vercel deploy --prod --yes --archive=tgz"
    : `\n${failures} variable(s) failed. Fix those before redeploying.`,
);
process.exit(failures === 0 ? 0 : 1);
