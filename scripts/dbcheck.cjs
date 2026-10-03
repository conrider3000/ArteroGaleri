const fs = require('fs');
const { neon } = require('@neondatabase/serverless');
const url = fs.readFileSync('.env.local', 'utf8').match(/DATABASE_URL="?([^"\r\n]+)"?/)[1];
const sql = neon(url);

async function main() {
  const p = await sql`SELECT id, user_id, provider, display_name, scope,
      CASE WHEN encrypted_refresh_token IS NULL THEN 'NULL' ELSE 'ok' END as refresh
    FROM cloud_providers`;
  console.log('PROVEDORES:', JSON.stringify(p, null, 2));

  const g = await sql`SELECT count(*)::int as c FROM galleries`;
  console.log('GALERIAS:', g[0].c);
}
main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });