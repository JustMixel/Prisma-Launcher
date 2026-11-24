import crypto from 'node:crypto';

const MF_APP_ID = 41629;
const API_BASE = 'https://www.mediafire.com/api/1.5';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function signature(...parts) {
  return crypto.createHash('sha1').update(parts.join('')).digest('hex');
}

async function mf(path, params = {}, options = {}) {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  url.searchParams.set('response_format', 'json');
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: { 'User-Agent': UA, ...(options.headers || {}) },
    body: options.body,
  });
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`MediaFire devolvió HTML o texto inválido (${response.status}): ${text.slice(0, 160)}`); }
  const result = json.response;
  if (result?.result !== 'Success' && !options.allowError) {
    throw new Error(`${path}: ${result?.message || 'error desconocido'} (código ${result?.error})`);
  }
  return result;
}

function credentials() {
  const email = process.env.MF_EMAIL;
  const password = process.env.MF_PASSWORD;
  if (!email || !password) throw new Error('Faltan MF_EMAIL o MF_PASSWORD');
  return { email, password };
}

async function sessionToken() {
  const { email, password } = credentials();
  const result = await mf('user/get_session_token.php', {
    application_id: MF_APP_ID,
    signature: signature(email, password, String(MF_APP_ID)),
    email,
    password,
    token_version: 1,
  });
  return result.session_token;
}

async function main() {
  const command = process.argv[2];
  if (command === 'token') {
    console.log(await sessionToken());
    return;
  }
  if (command === 'info') {
    const token = process.env.MF_TOKEN || await sessionToken();
    const info = await mf('user/get_info.php', { session_token: token });
    console.log(JSON.stringify({
      email: info.email,
      first_name: info.first_name,
      last_name: info.last_name,
      storage_limit: info.storage_limit,
      storage_used: info.storage_used,
      root_folder_key: info.root_folder_key,
    }, null, 2));
    return;
  }
  if (command === 'folder') {
    const token = process.env.MF_TOKEN || await sessionToken();
    const result = await mf('folder/create.php', {
      session_token: token,
      folder_name: process.argv[3] || 'PrismaMods',
    });
    console.log(JSON.stringify({ folder_key: result.folder_key, name: result.name }, null, 2));
    return;
  }
  if (command === 'check') {
    const token = process.env.MF_TOKEN || await sessionToken();
    const result = await mf('upload/check.php', {
      session_token: token,
      file_name: process.argv[3],
      file_size: process.argv[4],
      file_hash: process.argv[5],
      hash_type: 'sha256',
      folder_key: process.env.MF_FOLDER || 'myfiles',
    }, { allowError: true });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === 'upload') {
    const [, , , filePath, hash] = process.argv;
    const fs = await import('node:fs');
    const stat = fs.statSync(filePath);
    const token = process.env.MF_TOKEN || await sessionToken();
    const upload = await mf('upload/simple.php', {
      session_token: token,
      file_name: process.argv[4] ? require('node:path').basename(process.argv[4]) : undefined,
    }, { allowError: true });
    console.log(JSON.stringify(upload, null, 2));
    return;
  }
  if (command === 'test-token') {
    const token = process.argv[3];
    const info = await mf('user/get_info.php', { session_token: token }, { allowError: true });
    console.log(JSON.stringify(info, null, 2));
    return;
  }
  throw new Error(`Comando desconocido: ${command}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
