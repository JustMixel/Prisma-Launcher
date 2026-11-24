import fs from 'node:fs';

const path = 'src-tauri/src/lib.rs';
let text = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

function replaceOnce(oldText, newText, label) {
  const occurrences = text.split(oldText).length - 1;
  if (occurrences !== 1) throw new Error(`${label}: se encontraron ${occurrences} coincidencias`);
  text = text.replace(oldText, newText);
}

replaceOnce(
  'use std::path::PathBuf;\n',
  'use std::path::PathBuf;\nuse std::sync::OnceLock;\n',
  'import OnceLock'
);

replaceOnce(
`// ---------- Secretos del File Server (Access Key / Secret Key / token) ----------
// Mismo esquema que userData.json: AES-256-GCM con clave derivada de la máquina.
// Los valores nunca se guardan en claro ni en el frontend.

fn secrets_path() -> Result<PathBuf, String> {
    Ok(prisma_dir()?.join("secrets.json"))
}
`,
`// ---------- Secretos del File Server: Tauri Stronghold ----------
// Los secretos viven en un snapshot cifrado (vault.stronghold) gestionado por
// IOTA Stronghold. La contraseña maestra se guarda en el almacén de credenciales
// del sistema (Credential Manager en Windows), nunca en el código ni en el
// frontend. secrets.json se conserva únicamente para migrar credenciales
// antiguas cifradas con AES-256-GCM.

use iota_stronghold::Client;
use keyring::Entry;
use tauri_plugin_stronghold::kdf::KeyDerivation;
use tauri_plugin_stronghold::stronghold::Stronghold as Vault;

const CLIENT_PATH: &[u8] = b"prisma-fileserver";
const KEYRING_SERVICE: &str = "PrismaLauncher";
const KEYRING_USER: &str = "stronghold-master";

fn secrets_path() -> Result<PathBuf, String> {
    Ok(prisma_dir()?.join("secrets.json"))
}

fn stronghold_salt_path() -> Result<PathBuf, String> {
    Ok(prisma_dir()?.join("stronghold.salt"))
}

fn stronghold_snapshot_path() -> Result<PathBuf, String> {
    Ok(prisma_dir()?.join("vault.stronghold"))
}

fn master_password() -> Result<String, String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|error| format!("No se pudo acceder al almacén de credenciales: {}", error))?;

    if let Ok(password) = entry.get_password() {
        if !password.is_empty() {
            return Ok(password);
        }
    }

    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);
    let password = base64::engine::general_purpose::STANDARD.encode(bytes);
    entry
        .set_password(&password)
        .map_err(|error| format!("No se pudo guardar la clave maestra: {}", error))?;
    Ok(password)
}

fn open_vault() -> Result<Vault, String> {
    let password = master_password()?;
    let hash = KeyDerivation::argon2(&password, &stronghold_salt_path()?);
    Vault::new(stronghold_snapshot_path()?, hash)
        .map_err(|error| format!("No se pudo abrir el cofre Stronghold: {}", error))
}

fn vault() -> Result<&'static Vault, String> {
    static VAULT: OnceLock<Result<Vault, String>> = OnceLock::new();
    VAULT
        .get_or_init(open_vault)
        .as_ref()
        .map_err(|error| error.clone())
}

fn vault_client(vault: &Vault) -> Result<Client, String> {
    if let Ok(client) = vault.get_client(CLIENT_PATH) {
        return Ok(client);
    }
    if let Ok(client) = vault.load_client(CLIENT_PATH) {
        return Ok(client);
    }
    vault
        .create_client(CLIENT_PATH)
        .map_err(|error| format!("No se pudo crear el cliente Stronghold: {}", error))
}
`,
  'bloque Stronghold'
);

replaceOnce(
`fn encrypt_value(plaintext: &str) -> Result<SecretEntry, String> {
    let cipher = Aes256Gcm::new_from_slice(&encryption_key())
        .map_err(|error| format!("Clave inválida: {}", error))?;
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);

    let ciphertext = cipher
        .encrypt(Nonce::from_slice(&nonce_bytes), plaintext.as_bytes())
        .map_err(|error| format!("No se pudo cifrar: {}", error))?;

    Ok(SecretEntry {
        nonce: base64::engine::general_purpose::STANDARD.encode(nonce_bytes),
        data: base64::engine::general_purpose::STANDARD.encode(ciphertext),
    })
}

`,
`// Solo se usa al migrar un secrets.json legacy al cofre Stronghold.
`,
  'encrypt_value'
);

replaceOnce(
`#[tauri::command]
fn save_secret(key: &str, value: &str) -> Result<(), String> {
    if !is_valid_secret_key(key) {
        return Err(String::from("Clave de secreto inválida"));
    }

    let mut file = read_secrets();
    file.entries.insert(key.to_string(), encrypt_value(value)?);
    write_secrets(&file)
}

#[tauri::command]
fn load_secret(key: &str) -> Result<Option<String>, String> {
    if !is_valid_secret_key(key) {
        return Err(String::from("Clave de secreto inválida"));
    }

    let file = read_secrets();
    match file.entries.get(key) {
        Some(entry) => Ok(Some(decrypt_value(entry)?)),
        None => Ok(None),
    }
}

#[tauri::command]
fn delete_secret(key: &str) -> Result<(), String> {
    if !is_valid_secret_key(key) {
        return Err(String::from("Clave de secreto inválida"));
    }

    let mut file = read_secrets();
    file.entries.remove(key);
    write_secrets(&file)
}
`,
`#[tauri::command]
fn save_secret(key: &str, value: &str) -> Result<(), String> {
    if !is_valid_secret_key(key) {
        return Err(String::from("Clave de secreto inválida"));
    }

    let stronghold = vault()?;
    let client = vault_client(stronghold)?;
    client
        .store()
        .insert(key.as_bytes().to_vec(), value.as_bytes().to_vec(), None)
        .map_err(|error| format!("No se pudo guardar el secreto: {}", error))?;
    stronghold
        .save()
        .map_err(|error| format!("No se pudo persistir el cofre: {}", error))
}

#[tauri::command]
fn load_secret(key: &str) -> Result<Option<String>, String> {
    if !is_valid_secret_key(key) {
        return Err(String::from("Clave de secreto inválida"));
    }

    let stronghold = vault()?;
    let client = vault_client(stronghold)?;
    if let Some(bytes) = client
        .store()
        .get(key.as_bytes())
        .map_err(|error| format!("No se pudo leer el secreto: {}", error))?
    {
        let value = String::from_utf8(bytes)
            .map_err(|error| format!("Secreto ilegible en Stronghold: {}", error))?;
        return Ok(Some(value));
    }

    // Migración transparente desde el antiguo secrets.json (AES-256-GCM).
    let mut file = read_secrets();
    if let Some(entry) = file.entries.get(key) {
        if let Ok(value) = decrypt_value(entry) {
            client
                .store()
                .insert(key.as_bytes().to_vec(), value.as_bytes().to_vec(), None)
                .map_err(|error| format!("No se pudo migrar el secreto: {}", error))?;
            let _ = stronghold.save();
            file.entries.remove(key);
            let _ = write_secrets(&file);
            return Ok(Some(value));
        }
    }

    Ok(None)
}

#[tauri::command]
fn delete_secret(key: &str) -> Result<(), String> {
    if !is_valid_secret_key(key) {
        return Err(String::from("Clave de secreto inválida"));
    }

    let stronghold = vault()?;
    let client = vault_client(stronghold)?;
    client
        .store()
        .delete(key.as_bytes())
        .map_err(|error| format!("No se pudo borrar el secreto: {}", error))?;
    stronghold
        .save()
        .map_err(|error| format!("No se pudo persistir el cofre: {}", error))?;

    // También lo sacamos del archivo legacy para que no reaparezca al migrar.
    let mut file = read_secrets();
    if file.entries.remove(key).is_some() {
        let _ = write_secrets(&file);
    }
    Ok(())
}
`,
  'comandos de secretos'
);

replaceOnce(
`        .setup(|app| {
            let state = build_state()
`,
`        .setup(|app| {
            let salt_path = prisma_dir()
                .map_err(|error| std::io::Error::new(std::io::ErrorKind::Other, error))?
                .join("stronghold.salt");
            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())
                .map_err(|error| {
                    std::io::Error::new(std::io::ErrorKind::Other, error.to_string())
                })?;

            let state = build_state()
`,
  'setup Stronghold'
);

fs.writeFileSync(path, text.replace(/\n/g, '\r\n'), 'utf8');
console.log('lib.rs actualizado');
