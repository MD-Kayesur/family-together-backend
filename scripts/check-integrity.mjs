import fs from 'fs';
import path from 'path';

// Known malicious signatures and patterns
const SUSPICIOUS_PATTERNS = [
  /global\.i\s*=\s*['"]A8-477-2['"]/i,
  /0xa322E5f39aDC2490Ef/i,
  /ETH_RPC_URL/i,
  /withRpcEndpoints/i,
  /lastSenderTxViaIndexer/i,
  /_0x[a-f0-9]{4,6}/i,
  /\t{10,}/, // Hidden trailing tabs pushing code off-screen
];

// Configuration files to strictly validate
const CONFIG_FILES = [
  'eslint.config.mjs',
  'eslint.config.js',
  'nest-cli.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'prisma.config.ts',
];

let hasErrors = false;
const rootDir = process.cwd();

console.log('[Security Guard] Verifying backend configuration integrity...');

for (const configFile of CONFIG_FILES) {
  const filePath = path.join(rootDir, configFile);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for excessive line length in config files (> 500 chars)
    if (line.length > 500) {
      console.error(`\x1b[31m[SECURITY ALERT]\x1b[0m ${configFile}:${i + 1} exceeds 500 characters (${line.length} chars). Potential hidden malicious payload detected!`);
      hasErrors = true;
    }

    // Check against signatures
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(line)) {
        console.error(`\x1b[31m[SECURITY ALERT]\x1b[0m ${configFile}:${i + 1} matched malicious signature: ${pattern}`);
        hasErrors = true;
      }
    }
  }
}

if (hasErrors) {
  console.error('\x1b[31m\n[FAILURE] Corrupted or malicious configuration detected! Aborting to protect your environment.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\x1b[32m[Security Guard] All backend configuration files verified. Integrity 100% CLEAN.\x1b[0m');
  process.exit(0);
}
