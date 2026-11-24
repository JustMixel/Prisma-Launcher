use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use base64::Engine;
use rand_core::{OsRng, RngCore};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub extension: String,
}

#[derive(Serialize)]
pub struct DriveEntry {
    pub name: String,
    pub path: String,
}

#[derive(Serialize)]
pub struct SpecialFolder {
    pub label: String,
    pub path: String,
    pub icon: String,
}

#[derive(Serialize)]
pub struct LauncherState {
    pub data_dir: String,
    pub assets_dir: String,
    pub needs_setup: bool,
    pub user_name: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct UserData {
    name: String,
}

#[derive(Serialize, Deserialize)]
struct UserDataFile {
    version: u32,
    nonce: String,
    data: String,
}

fn prisma_dir() -> Result<PathBuf, String> {
    let base = std::env::var("APPDATA")
        .or_else(|_| std::env::var("LOCALAPPDATA"))
        .unwrap_or_else(|_| {
            std::env::var("USERPROFILE").unwrap_or_else(|_| String::from("C:\\Users\\User"))
        });

    let root = PathBuf::from(base).join(".prisma");
    std::fs::create_dir_all(root.join("assets"))
        .map_err(|error| format!("No se pudo crear .prisma: {}", error))?;

    Ok(root)
}

fn user_data_path() -> Result<PathBuf, String> {
    Ok(prisma_dir()?.join("userData.json"))
}

fn encryption_key() -> [u8; 32] {
    let username = std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .unwrap_or_default();
    let computer = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_default();

    let material = format!("prisma-launcher::{}::{}::v1", username, computer);
    let digest = Sha256::digest(material.as_bytes());
    let mut key = [0u8; 32];
    key.copy_from_slice(&digest);
    key
}

fn is_valid_name(name: &str) -> bool {
    let trimmed = name.trim();
    trimmed.chars().count() > 2 && trimmed.chars().any(|value| value.is_alphabetic())
}

fn read_user_name() -> Option<String> {
    let bytes = std::fs::read(user_data_path().ok()?).ok()?;
    let file: UserDataFile = serde_json::from_slice(&bytes).ok()?;

    if file.version != 1 {
        return None;
    }

    let nonce_bytes = base64::engine::general_purpose::STANDARD.decode(file.nonce).ok()?;
    if nonce_bytes.len() != 12 {
        return None;
    }

    let ciphertext = base64::engine::general_purpose::STANDARD.decode(file.data).ok()?;
    let cipher = Aes256Gcm::new_from_slice(&encryption_key()).ok()?;
    let plaintext = cipher
        .decrypt(Nonce::from_slice(&nonce_bytes), ciphertext.as_slice())
        .ok()?;
    let user_data: UserData = serde_json::from_slice(&plaintext).ok()?;

    if !is_valid_name(&user_data.name) {
        return None;
    }

    Some(user_data.name.trim().to_string())
}

fn build_state() -> Result<LauncherState, String> {
    let root = prisma_dir()?;
    let name = read_user_name();

    Ok(LauncherState {
        data_dir: root.to_string_lossy().into_owned(),
        assets_dir: root.join("assets").to_string_lossy().into_owned(),
        needs_setup: name.is_none(),
        user_name: name,
    })
}

#[tauri::command]
fn initialize_launcher() -> Result<LauncherState, String> {
    build_state()
}

#[tauri::command]
fn save_user_name(name: &str) -> Result<LauncherState, String> {
    let trimmed = name.trim();
    if !is_valid_name(trimmed) {
        return Err(String::from("El nombre debe tener más de 2 caracteres y al menos una letra."));
    }

    let plaintext = serde_json::to_vec(&UserData { name: trimmed.to_string() })
        .map_err(|error| format!("No se pudo preparar userData: {}", error))?;

    let cipher = Aes256Gcm::new_from_slice(&encryption_key())
        .map_err(|error| format!("No se pudo crear el cifrado: {}", error))?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_slice())
        .map_err(|error| format!("No se pudo cifrar userData: {}", error))?;

    let file = UserDataFile {
        version: 1,
        nonce: base64::engine::general_purpose::STANDARD.encode(nonce_bytes),
        data: base64::engine::general_purpose::STANDARD.encode(ciphertext),
    };

    let json = serde_json::to_vec_pretty(&file)
        .map_err(|error| format!("No se pudo serializar userData: {}", error))?;

    std::fs::write(user_data_path()?, json)
        .map_err(|error| format!("No se pudo guardar userData: {}", error))?;

    build_state()
}

#[tauri::command]
fn get_window_label(window: tauri::Window) -> String {
    window.label().to_string()
}

#[tauri::command]
fn start_window_drag(window: tauri::Window) {
    let _ = window.start_dragging();
}

#[tauri::command]
fn complete_setup(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(setup) = app.get_webview_window("setup") {
        setup.close().map_err(|error| format!("No se pudo cerrar setup: {}", error))?;
    }

    if let Some(main) = app.get_webview_window("main") {
        main.show().map_err(|error| format!("No se pudo mostrar el launcher: {}", error))?;
        main.set_focus().map_err(|error| format!("No se pudo enfocar el launcher: {}", error))?;
    }

    app.emit("prisma-setup-complete", ())
        .map_err(|error| format!("No se pudo notificar el setup: {}", error))?;

    Ok(())
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn list_directory(path: &str) -> Result<Vec<FileEntry>, String> {
    let entries = std::fs::read_dir(path)
        .map_err(|error| format!("No se pudo leer el directorio: {}", error))?;

    let mut result: Vec<FileEntry> = Vec::new();

    for entry in entries.flatten() {
        let file_type = match entry.file_type() {
            Ok(value) => value,
            Err(_) => continue,
        };

        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }

        let is_dir = file_type.is_dir();
        let extension = if is_dir {
            String::new()
        } else {
            entry.path()
                .extension()
                .map(|value| value.to_string_lossy().to_lowercase())
                .unwrap_or_default()
        };

        result.push(FileEntry {
            name,
            path: entry.path().to_string_lossy().into_owned(),
            is_dir,
            extension,
        });
    }

    result.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            return b.is_dir.cmp(&a.is_dir);
        }
        a.name.to_lowercase().cmp(&b.name.to_lowercase())
    });

    Ok(result)
}

#[tauri::command]
fn get_drives() -> Vec<DriveEntry> {
    let mut drives = Vec::new();

    for letter in b'A'..=b'Z' {
        let path = format!("{}:\\", letter as char);
        if std::path::Path::new(&path).exists() {
            drives.push(DriveEntry {
                name: format!("{}:", letter as char),
                path,
            });
        }
    }

    drives
}

#[tauri::command]
fn get_special_folders() -> Vec<SpecialFolder> {
    let home = std::env::var("USERPROFILE").unwrap_or_else(|_| String::from("C:\\Users\\User"));

    let mut folders = vec![
        SpecialFolder { label: String::from("Escritorio"), path: format!("{}\\Desktop", home), icon: String::from("desktop") },
        SpecialFolder { label: String::from("Documentos"), path: format!("{}\\Documents", home), icon: String::from("documents") },
        SpecialFolder { label: String::from("Descargas"), path: format!("{}\\Downloads", home), icon: String::from("downloads") },
        SpecialFolder { label: String::from("Imágenes"), path: format!("{}\\Pictures", home), icon: String::from("pictures") },
        SpecialFolder { label: String::from("Música"), path: format!("{}\\Music", home), icon: String::from("music") },
        SpecialFolder { label: String::from("Videos"), path: format!("{}\\Videos", home), icon: String::from("videos") },
    ];

    folders.retain(|folder| std::path::Path::new(&folder.path).exists());
    folders
}

#[tauri::command]
fn path_exists(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

#[tauri::command]
fn read_file_as_data_url(path: &str) -> Result<String, String> {
    use base64::Engine;

    let bytes = std::fs::read(path)
        .map_err(|error| format!("No se pudo leer la imagen: {}", error))?;

    let extension = std::path::Path::new(path)
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_lowercase();

    let mime = match extension.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => "application/octet-stream",
    };

    let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);
    Ok(format!("data:{};base64,{}", mime, encoded))
}

// ---------- Secretos del File Server: Tauri Stronghold ----------
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

fn is_valid_secret_key(key: &str) -> bool {
    !key.is_empty()
        && key.len() <= 64
        && key
            .chars()
            .all(|character| character.is_ascii_lowercase() || character.is_ascii_digit() || matches!(character, '.' | '_' | '-'))
}

#[derive(Serialize, Deserialize)]
struct SecretEntry {
    nonce: String,
    data: String,
}

#[derive(Serialize, Deserialize)]
struct SecretsFile {
    version: u32,
    entries: std::collections::BTreeMap<String, SecretEntry>,
}

fn read_secrets() -> SecretsFile {
    std::fs::read(secrets_path().unwrap_or_default())
        .ok()
        .and_then(|bytes| serde_json::from_slice::<SecretsFile>(&bytes).ok())
        .filter(|file| file.version == 1)
        .unwrap_or_else(|| SecretsFile {
            version: 1,
            entries: std::collections::BTreeMap::new(),
        })
}

fn write_secrets(file: &SecretsFile) -> Result<(), String> {
    let bytes = serde_json::to_vec(file).map_err(|error| format!("No se pudieron serializar los secretos: {}", error))?;
    std::fs::write(secrets_path()?, bytes).map_err(|error| format!("No se pudo guardar el secreto: {}", error))
}

// Solo se usa al migrar un secrets.json legacy al cofre Stronghold.
fn decrypt_value(entry: &SecretEntry) -> Result<String, String> {
    let nonce_bytes = base64::engine::general_purpose::STANDARD
        .decode(&entry.nonce)
        .map_err(|error| format!("Nonce inválido: {}", error))?;
    if nonce_bytes.len() != 12 {
        return Err(String::from("Nonce inválido"));
    }

    let ciphertext = base64::engine::general_purpose::STANDARD
        .decode(&entry.data)
        .map_err(|error| format!("Dato inválido: {}", error))?;
    let cipher = Aes256Gcm::new_from_slice(&encryption_key())
        .map_err(|error| format!("Clave inválida: {}", error))?;

    let plaintext = cipher
        .decrypt(Nonce::from_slice(&nonce_bytes), ciphertext.as_slice())
        .map_err(|error| format!("No se pudo descifrar: {}", error))?;

    String::from_utf8(plaintext).map_err(|error| format!("Secreto ilegible: {}", error))
}

#[tauri::command]
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

// Lee un tramo de un archivo en base64 (para subir paquetes grandes por partes
// sin cargar el archivo completo en memoria).
#[tauri::command]
fn read_file_chunk(path: &str, offset: u64, len: u64) -> Result<String, String> {
    use base64::Engine;
    use std::io::{Read, Seek, SeekFrom};

    const MAX_CHUNK: u64 = 8 * 1024 * 1024; // 8 MiB por invocación

    let mut file =
        std::fs::File::open(path).map_err(|error| format!("No se pudo abrir el archivo: {}", error))?;
    file.seek(SeekFrom::Start(offset))
        .map_err(|error| format!("No se pudo posicionar: {}", error))?;

    let size = len.min(MAX_CHUNK) as usize;
    let mut buffer = vec![0u8; size];
    let read = file
        .read(&mut buffer)
        .map_err(|error| format!("No se pudo leer: {}", error))?;
    buffer.truncate(read);

    Ok(base64::engine::general_purpose::STANDARD.encode(buffer))
}

#[tauri::command]
fn get_file_size(path: &str) -> Result<u64, String> {
    let metadata = std::fs::metadata(path)
        .map_err(|error| format!("No se pudo leer el archivo: {}", error))?;
    if !metadata.is_file() {
        return Err(String::from("La ruta no es un archivo"));
    }
    Ok(metadata.len())
}

fn safe_mod_folder_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|character| {
            if matches!(character, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*')
                || character.is_control()
            {
                '_'
            } else {
                character
            }
        })
        .collect();

    let trimmed = cleaned.trim().trim_matches('.');
    if trimmed.is_empty() {
        String::from("mod")
    } else {
        trimmed.to_string()
    }
}

#[tauri::command]
fn save_background_image(path: &str) -> Result<String, String> {
    let source = std::path::Path::new(path);
    if !source.exists() {
        return Err(String::from("El archivo de imagen no existe"));
    }

    let extension = source
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("png");

    let background_dir = prisma_dir()?.join("backgrounds");
    std::fs::create_dir_all(&background_dir)
        .map_err(|error| format!("No se pudo crear la carpeta de fondos: {}", error))?;

    let destination = background_dir.join(format!("background.{}", extension));
    
    std::fs::copy(source, &destination)
        .map_err(|error| format!("No se pudo copiar la imagen: {}", error))?;

    Ok(destination.to_string_lossy().to_string())
}

#[tauri::command]
fn save_installed_mod(installed_mod: Value) -> Result<Value, String> {
    let name = installed_mod
        .get("name")
        .and_then(|value| value.as_str())
        .ok_or_else(|| String::from("El mod no tiene nombre"))?;

    let folder_name = safe_mod_folder_name(name);
    let folder = prisma_dir()?.join("assets").join(folder_name);
    std::fs::create_dir_all(&folder)
        .map_err(|error| format!("No se pudo crear la carpeta del mod: {}", error))?;

    let folder_path = folder.to_string_lossy().to_string();
    let mut stored = installed_mod;
    if let Some(map) = stored.as_object_mut() {
        map.insert(String::from("folder"), json!(folder_path));
    }

    let manifest = serde_json::to_string_pretty(&stored)
        .map_err(|error| format!("No se pudo serializar el mod: {}", error))?;
    std::fs::write(folder.join("mod.json"), manifest)
        .map_err(|error| format!("No se pudo guardar el mod: {}", error))?;

    Ok(stored)
}

#[tauri::command]
fn get_installed_mods() -> Result<Vec<Value>, String> {
    let assets_dir = prisma_dir()?.join("assets");
    let entries = std::fs::read_dir(&assets_dir)
        .map_err(|error| format!("No se pudo leer la carpeta de assets: {}", error))?;
    let mut mods = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let manifest_path = path.join("mod.json");
        if !manifest_path.exists() {
            continue;
        }

        let content = match std::fs::read_to_string(&manifest_path) {
            Ok(content) => content,
            Err(_) => continue,
        };

        let mut value: Value = match serde_json::from_str(&content) {
            Ok(value) => value,
            Err(_) => continue,
        };

        if let Some(map) = value.as_object_mut() {
            if !map.contains_key("folder") {
                map.insert(
                    String::from("folder"),
                    json!(path.to_string_lossy().to_string()),
                );
            }
        }

        mods.push(value);
    }

    mods.sort_by(|left, right| {
        right
            .get("installedAt")
            .and_then(Value::as_str)
            .cmp(&left.get("installedAt").and_then(Value::as_str))
    });

    Ok(mods)
}

#[tauri::command]
fn launch_executable(path: &str) -> Result<(), String> {
    let executable = PathBuf::from(path);
    if !executable.exists() {
        return Err(String::from("El ejecutable no existe"));
    }

    let working_directory = executable
        .parent()
        .map(|parent| parent.to_path_buf())
        .unwrap_or_else(|| PathBuf::from("C:\\"));

    std::process::Command::new(&executable)
        .current_dir(working_directory)
        .spawn()
        .map_err(|error| format!("No se pudo ejecutar el mod: {}", error))?;

    Ok(())
}

#[tauri::command]
fn create_mod_shortcut(installed_mod: Value) -> Result<String, String> {
    let name = installed_mod
        .get("name")
        .and_then(Value::as_str)
        .unwrap_or("mod");
    let executable = installed_mod
        .get("executablePath")
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty());
    let link = installed_mod
        .get("link")
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty());

    let shortcuts_dir = prisma_dir()?.join("shortcuts");
    std::fs::create_dir_all(&shortcuts_dir)
        .map_err(|error| format!("No se pudo crear la carpeta de accesos directos: {}", error))?;

    let base_name = safe_mod_folder_name(name);

    if let Some(target) = executable {
        let target_path = PathBuf::from(target);
        if !target_path.exists() {
            return Err(String::from(
                "El ejecutable del mod no existe; no se puede crear el acceso directo",
            ));
        }

        let shortcut = shortcuts_dir.join(format!("{}.lnk", base_name));
        let working_directory = target_path
            .parent()
            .map(|parent| parent.to_string_lossy().to_string())
            .unwrap_or_default();

        let script = format!(
            "$shell = New-Object -ComObject WScript.Shell; \
             $shortcut = $shell.CreateShortcut({}); \
             $shortcut.TargetPath = {}; \
             $shortcut.WorkingDirectory = {}; \
             $shortcut.Save()",
            powershell_quote(&shortcut.to_string_lossy()),
            powershell_quote(&target_path.to_string_lossy()),
            powershell_quote(&working_directory)
        );

        let output = std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .output()
            .map_err(|error| format!("No se pudo ejecutar PowerShell: {}", error))?;

        if !output.status.success() || !shortcut.exists() {
            let detail = String::from_utf8_lossy(&output.stderr);
            return Err(format!(
                "No se pudo crear el acceso directo: {}",
                detail.trim()
            ));
        }

        return Ok(shortcut.to_string_lossy().to_string());
    }

    if let Some(url) = link {
        let shortcut = shortcuts_dir.join(format!("{}.url", base_name));
        let content = format!("[InternetShortcut]\r\nURL={}\r\n", url.trim());
        std::fs::write(&shortcut, content)
            .map_err(|error| format!("No se pudo crear el acceso al enlace: {}", error))?;
        return Ok(shortcut.to_string_lossy().to_string());
    }

    Err(String::from("El mod no tiene ejecutable ni enlace para crear un acceso directo"))
}

fn powershell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "''"))
}

#[tauri::command]
fn uninstall_mod(mod_id: String) -> Result<String, String> {
    if mod_id.trim().is_empty() {
        return Err(String::from("El mod no tiene identificador"));
    }

    let assets_dir = prisma_dir()?.join("assets");
    let entries = std::fs::read_dir(&assets_dir)
        .map_err(|error| format!("No se pudo leer la carpeta de assets: {}", error))?;

    let mut target_folder: Option<PathBuf> = None;
    let mut mod_name: Option<String> = None;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let manifest_path = path.join("mod.json");
        let content = match std::fs::read_to_string(&manifest_path) {
            Ok(content) => content,
            Err(_) => continue,
        };

        let value: Value = match serde_json::from_str(&content) {
            Ok(value) => value,
            Err(_) => continue,
        };

        let stored_id = match value.get("id") {
            Some(Value::String(text)) => text.clone(),
            Some(other) => other.to_string(),
            None => continue,
        };

        if stored_id != mod_id {
            continue;
        }

        mod_name = value
            .get("name")
            .and_then(Value::as_str)
            .map(|name| name.to_string());
        target_folder = Some(path);
        break;
    }

    let folder = target_folder.ok_or_else(|| String::from("No se encontró el mod instalado"))?;
    std::fs::remove_dir_all(&folder)
        .map_err(|error| format!("No se pudo borrar la carpeta del mod: {}", error))?;

    if let Some(name) = mod_name {
        let base_name = safe_mod_folder_name(&name);
        if let Ok(shortcuts_dir) = prisma_dir().map(|dir| dir.join("shortcuts")) {
            for extension in ["lnk", "url"] {
                let shortcut = shortcuts_dir.join(format!("{}.{}", base_name, extension));
                if shortcut.exists() {
                    let _ = std::fs::remove_file(shortcut);
                }
            }
        }
    }

    Ok(folder.to_string_lossy().to_string())
}

#[derive(Serialize)]
pub struct TestCheck {
    pub id: String,
    pub label: String,
    pub ok: bool,
    pub detail: String,
}

#[derive(Serialize)]
pub struct TestValidation {
    pub ok: bool,
    pub checks: Vec<TestCheck>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TestLogPayload {
    session_id: String,
    stream: String,
    line: String,
    timestamp: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TestExitPayload {
    session_id: String,
    code: Option<i32>,
}

fn now_millis() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

fn build_check(checks: &mut Vec<TestCheck>, id: &str, label: &str, ok: bool, detail: String) {
    checks.push(TestCheck {
        id: id.to_string(),
        label: label.to_string(),
        ok,
        detail,
    });
}

fn validate_project(executable_path: &str, ini_path: &str) -> TestValidation {
    let mut checks: Vec<TestCheck> = Vec::new();
    let exe_trimmed = executable_path.trim();
    let ini_trimmed = ini_path.trim();

    let exe_defined = !exe_trimmed.is_empty();
    build_check(
        &mut checks,
        "exe-defined",
        "Ruta del ejecutable definida",
        exe_defined,
        if exe_defined {
            exe_trimmed.to_string()
        } else {
            String::from("Falta cargar la ruta del ejecutable en el proyecto.")
        },
    );

    let exe_path = std::path::Path::new(exe_trimmed);
    let exe_exists = exe_defined && exe_path.exists();
    build_check(
        &mut checks,
        "exe-exists",
        "El ejecutable existe en disco",
        exe_exists,
        if exe_exists {
            String::from("Encontrado.")
        } else if exe_defined {
            String::from("No se encontró el archivo en la ruta indicada.")
        } else {
            String::from("Sin ruta para comprobar.")
        },
    );

    let extension = exe_path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_lowercase();
    let valid_extension = matches!(extension.as_str(), "exe" | "bat" | "cmd" | "com");
    build_check(
        &mut checks,
        "exe-extension",
        "Extensión ejecutable válida (.exe / .bat / .cmd / .com)",
        exe_exists && exe_path.is_file() && valid_extension,
        if extension.is_empty() {
            String::from("El archivo no tiene extensión.")
        } else {
            format!(".{}", extension)
        },
    );

    let working_dir_ok = exe_exists
        && exe_path
            .parent()
            .map(|parent| parent.exists())
            .unwrap_or(false);
    build_check(
        &mut checks,
        "exe-dir",
        "Carpeta de trabajo accesible",
        working_dir_ok,
        match exe_path.parent() {
            Some(parent) if working_dir_ok => parent.to_string_lossy().to_string(),
            _ => String::from("No se pudo resolver la carpeta del ejecutable."),
        },
    );

    if ini_trimmed.is_empty() {
        build_check(
            &mut checks,
            "ini",
            "Archivo .ini de estadísticas (opcional)",
            true,
            String::from("No definido; la prueba se ejecuta sin lectura de estadísticas."),
        );
    } else {
        let ini_path = std::path::Path::new(ini_trimmed);
        let ini_extension = ini_path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("")
            .to_lowercase();
        let ini_exists = ini_path.exists() && ini_path.is_file();
        let ini_ok = ini_exists && ini_extension == "ini";
        build_check(
            &mut checks,
            "ini",
            "Archivo .ini de estadísticas válido",
            ini_ok,
            if !ini_exists {
                String::from("No se encontró el archivo .ini indicado.")
            } else if ini_extension != "ini" {
                String::from("El archivo debe tener extensión .ini.")
            } else {
                String::from("Encontrado.")
            },
        );
    }

    let ok = checks.iter().all(|check| check.ok);
    TestValidation { ok, checks }
}

#[tauri::command]
fn validate_test_project(executable_path: String, ini_path: String) -> TestValidation {
    validate_project(&executable_path, &ini_path)
}

fn spawn_output_reader<R: std::io::Read + Send + 'static>(
    app: tauri::AppHandle,
    session_id: String,
    stream: &'static str,
    reader: R,
) {
    std::thread::spawn(move || {
        use std::io::BufRead;

        let mut reader = std::io::BufReader::new(reader);
        let mut buffer: Vec<u8> = Vec::new();

        loop {
            buffer.clear();
            match reader.read_until(b'\n', &mut buffer) {
                Ok(0) => break,
                Ok(_) => {
                    let line = String::from_utf8_lossy(&buffer)
                        .trim_end_matches(['\r', '\n'])
                        .to_string();
                    if line.is_empty() {
                        continue;
                    }
                    let _ = app.emit(
                        "prisma-test-log",
                        TestLogPayload {
                            session_id: session_id.clone(),
                            stream: stream.to_string(),
                            line,
                            timestamp: now_millis(),
                        },
                    );
                }
                Err(_) => break,
            }
        }
    });
}

#[tauri::command]
fn run_test_session(
    app: tauri::AppHandle,
    executable_path: String,
    ini_path: String,
    session_id: String,
) -> Result<u32, String> {
    let validation = validate_project(&executable_path, &ini_path);
    if !validation.ok {
        let failures: Vec<String> = validation
            .checks
            .iter()
            .filter(|check| !check.ok)
            .map(|check| format!("{} — {}", check.label, check.detail))
            .collect();
        return Err(format!("Validación fallida. {}", failures.join(" · ")));
    }

    let executable = PathBuf::from(executable_path.trim());
    let working_directory = executable
        .parent()
        .map(|parent| parent.to_path_buf())
        .unwrap_or_else(|| PathBuf::from("C:\\"));

    let mut command = std::process::Command::new(&executable);
    command
        .current_dir(working_directory)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = command
        .spawn()
        .map_err(|error| format!("No se pudo iniciar el mod: {}", error))?;
    let pid = child.id();

    let _ = app.emit(
        "prisma-test-log",
        TestLogPayload {
            session_id: session_id.clone(),
            stream: String::from("info"),
            line: format!("Proceso iniciado con PID {}.", pid),
            timestamp: now_millis(),
        },
    );

    if let Some(stdout) = child.stdout.take() {
        spawn_output_reader(app.clone(), session_id.clone(), "stdout", stdout);
    }
    if let Some(stderr) = child.stderr.take() {
        spawn_output_reader(app.clone(), session_id.clone(), "stderr", stderr);
    }

    let exit_app = app.clone();
    let exit_session = session_id;
    std::thread::spawn(move || {
        let code = child.wait().ok().and_then(|status| status.code());
        let _ = exit_app.emit(
            "prisma-test-exit",
            TestExitPayload {
                session_id: exit_session,
                code,
            },
        );
    });

    Ok(pid)
}

#[tauri::command]
fn stop_test_process(pid: u32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let status = std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .map_err(|error| format!("No se pudo detener el proceso: {}", error))?;

        if !status.success() {
            return Err(String::from("El proceso ya no está en ejecución."));
        }

        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        let status = std::process::Command::new("kill")
            .args(["-TERM", &pid.to_string()])
            .status()
            .map_err(|error| format!("No se pudo detener el proceso: {}", error))?;

        if !status.success() {
            return Err(String::from("El proceso ya no está en ejecución."));
        }

        Ok(())
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn install_mod(name: &str) -> String {
    format!("Mod instalado: {} (simulación - sin archivos reales)", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let salt_path = prisma_dir()
                .map_err(|error| std::io::Error::new(std::io::ErrorKind::Other, error))?
                .join("stronghold.salt");
            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())
                .map_err(|error| {
                    std::io::Error::new(std::io::ErrorKind::Other, error.to_string())
                })?;

            let state = build_state()
                .map_err(|error| std::io::Error::new(std::io::ErrorKind::Other, error))?;

            if state.needs_setup {
                WebviewWindowBuilder::new(app, "setup", WebviewUrl::App("index.html".into()))
                    .title("Prisma Launcher")
                    .inner_size(620.0, 210.0)
                    .resizable(false)
                    .decorations(false)
                    .center()
                    .build()?;
            } else if let Some(main) = app.get_webview_window("main") {
                main.show()?;
                main.set_focus()?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            install_mod,
            list_directory,
            get_drives,
            get_special_folders,
            path_exists,
            read_file_as_data_url,
            save_installed_mod,
            get_installed_mods,
            launch_executable,
            validate_test_project,
            run_test_session,
            stop_test_process,
            create_mod_shortcut,
            uninstall_mod,
            initialize_launcher,
            save_user_name,
            save_background_image,
            get_window_label,
            start_window_drag,
            complete_setup,
            exit_app,
            save_secret,
            load_secret,
            delete_secret,
            read_file_chunk,
            get_file_size
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
