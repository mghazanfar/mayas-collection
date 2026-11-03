// Usage: npm run admin:hash
// Prints ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET values for your env vars.
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl._writeToOutput = (s) => {
  if (!rl._muted) process.stdout.write(s);
};

rl.question("Admin password (min 12 chars, hidden): ", (password) => {
  rl.close();
  process.stdout.write("\n");
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  console.log("\nADMIN_PASSWORD_HASH=scrypt:" + salt.toString("hex") + ":" + hash.toString("hex"));
  console.log("ADMIN_SESSION_SECRET=" + randomBytes(32).toString("hex"));
  console.log("\nAlso set ADMIN_EMAIL. Put all three in Netlify env vars (tick 'Contains secret values').");
});
rl._muted = true;
