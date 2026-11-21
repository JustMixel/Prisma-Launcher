import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import pfpTest from "../assets/pfp-test.png";
import CustomFileDialog, { IMAGE_FILTERS } from "./CustomFileDialog.jsx";
import { isValidName } from "../utils/name.js";
import { clearSession, getSession, saveSession } from "../utils/session.js";
import { SETTINGS_KEYS, TABS } from "../utils/settings.js";
import styles from "./Configuration.module.css";

const PICTURE_KEY = "prisma-profile-picture";

const ROLE_LABELS = {
    member: "Miembro",
    activated: "Miembro activado",
    tester: "Tester",
    developer: "Desarrollador"
};

const ACCENTS = [
    { label: "Amarillo", value: "#d9cd00" },
    { label: "Azul", value: "#6fa8dc" },
    { label: "Verde", value: "#7fb069" },
    { label: "Rojo", value: "#d96565" }
];

const TAB_LABELS = {
    store: "Tienda",
    library: "Biblioteca",
    downloads: "Descargas",
    configuration: "Configuración"
};

function readStoredPicture()
{
    try {
        return localStorage.getItem(PICTURE_KEY) || "";
    } catch {
        return "";
    }
}

function Configuration({ userName, onNameChange, profilePicture, onPictureChange, settings, onSettingChange })
{
    const [name, setName] = useState(userName || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);
    const [modsPath, setModsPath] = useState(settings.modsPath || "");
    const [session, setSession] = useState(getSession);
    const [accountUser, setAccountUser] = useState("");
    const [accountPass, setAccountPass] = useState("");
    const [accountBusy, setAccountBusy] = useState(false);

    const valid = isValidName(name);
    const changed = name.trim() !== (userName || "");

    useEffect(() => {
        setName(userName || "");
    }, [userName]);

    useEffect(() => {
        setModsPath(settings.modsPath || "");
    }, [settings.modsPath]);

    async function handleSaveName(event)
    {
        event.preventDefault();
        if (!valid || !changed || saving) {
            return;
        }

        setSaving(true);
        setError("");
        setNotice("");
        try {
            await invoke("save_user_name", { name: name.trim() });
            onNameChange(name.trim());
            setNotice("Nombre actualizado.");
        } catch (saveError) {
            setError(String(saveError));
        } finally {
            setSaving(false);
        }
    }

    async function handleSelectPicture(path)
    {
        setError("");
        setNotice("");
        try {
            const dataUrl = await invoke("read_file_as_data_url", { path });
            onPictureChange(dataUrl);
            localStorage.setItem(PICTURE_KEY, dataUrl);
            setNotice("Foto de perfil actualizada.");
        } catch (pictureError) {
            setError(String(pictureError));
        } finally {
            setDialogOpen(false);
        }
    }

    function handleResetPicture()
    {
        onPictureChange("");
        localStorage.removeItem(PICTURE_KEY);
        setError("");
        setNotice("Foto de perfil restablecida.");
    }

    function handleSelectModsFolder(path)
    {
        setModsPath(path);
        setFolderDialogOpen(false);
        setError("");
        setNotice("Carpeta seleccionada. Guardá para aplicar.");
    }

    function handleSaveModsPath()
    {
        onSettingChange(SETTINGS_KEYS.modsPath, modsPath.trim());
        setError("");
        setNotice("Carpeta de mods guardada.");
    }

    async function handleLogin(event)
    {
        event.preventDefault();
        if (accountBusy || !accountUser.trim() || !accountPass) {
            return;
        }

        setAccountBusy(true);
        setError("");
        setNotice("");
        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: accountUser.trim(), password: accountPass })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error === "invalid"
                    ? "Usuario o contraseña incorrectos."
                    : "No se pudo conectar con el servidor.");
            }
            const saved = saveSession(data.user);
            setSession(saved);
            setAccountPass("");
            setNotice(`Sesión iniciada como ${saved.displayName} (${ROLE_LABELS[saved.role] || saved.role}).`);
        } catch (loginError) {
            setError(String(loginError.message || loginError));
        } finally {
            setAccountBusy(false);
        }
    }

    function handleLogout()
    {
        clearSession();
        setSession(null);
        setAccountUser("");
        setAccountPass("");
        setError("");
        setNotice("Sesión cerrada.");
    }

    return (
        <div className={styles["config"]}>
            <header className={styles["header"]}>
                <h1>CONFIGURACIÓN</h1>
                <p>Ajusta tu perfil y preferencias del launcher.</p>
            </header>

            {error && <p className={styles["error"]}>{error}</p>}
            {notice && <p className={styles["notice"]}>{notice}</p>}

            <section className={styles["card"]}>
                <h2>Perfil</h2>

                <div className={styles["profile-row"]}>
                    <img
                        className={styles["avatar"]}
                        src={profilePicture || pfpTest}
                        alt="Foto de perfil"
                    />
                    <div className={styles["profile-actions"]}>
                        <button
                            className={styles["btn"]}
                            type="button"
                            onClick={() => setDialogOpen(true)}
                        >
                            Cambiar foto
                        </button>
                        <button
                            className={styles["btn secondary"]}
                            type="button"
                            onClick={handleResetPicture}
                        >
                            Restablecer
                        </button>
                    </div>
                </div>

                <form className={styles["name-form"]} onSubmit={handleSaveName}>
                    <label className={styles["label"]} htmlFor="config-name">Nombre visible</label>
                    <div className={styles["name-row"]}>
                        <input
                            id="config-name"
                            className={styles["input"]}
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={40}
                        />
                        <button
                            className={styles["btn"]}
                            type="submit"
                            disabled={!valid || !changed || saving}
                        >
                            Guardar
                        </button>
                    </div>
                    <p className={styles["hint"]}>Este nombre aparece en la barra lateral.</p>
                </form>

                <div className={styles["role-row"]}>
                    <span>Rol activo</span>
                    <strong>Miembro</strong>
                </div>
            </section>

            <section className={styles["card"]}>
                <h2>Cuenta Prisma</h2>

                {session ? (
                    <div className={styles["setting-block"]}>
                        <span className={styles["label"]}>Conectado como</span>
                        <div className={styles["name-row"]}>
                            <div className={styles["account-info"]}>
                                <strong>{session.displayName}</strong>
                                <span>
                                    {ROLE_LABELS[session.role] || session.role}
                                    {session.activated ? "" : " · sin activar"}
                                </span>
                            </div>
                            <button type="button" className={styles["btn secondary"]} onClick={handleLogout}>
                                Cerrar sesión
                            </button>
                        </div>
                        <p className={styles["hint"]}>Los testers pueden activar proyectos ocultos desde su biblioteca.</p>
                    </div>
                ) : (
                    <form className={styles["name-form"]} onSubmit={handleLogin}>
                        <label className={styles["label"]} htmlFor="account-user">Usuario</label>
                        <div className={styles["name-row"]}>
                            <input
                                id="account-user"
                                className={styles["input"]}
                                type="text"
                                value={accountUser}
                                onChange={(event) => setAccountUser(event.target.value)}
                                autoComplete="username"
                                placeholder="Usuario"
                            />
                            <input
                                className={styles["input"]}
                                type="password"
                                value={accountPass}
                                onChange={(event) => setAccountPass(event.target.value)}
                                autoComplete="current-password"
                                placeholder="Contraseña"
                                aria-label="Contraseña"
                            />
                            <button
                                className={styles["btn"]}
                                type="submit"
                                disabled={accountBusy || !accountUser.trim() || !accountPass}
                            >
                                {accountBusy ? "Conectando…" : "Iniciar sesión"}
                            </button>
                        </div>
                        <p className={styles["hint"]}>Cuentas de prueba: tester/tester123 · dev/dev123 · user/user123</p>
                    </form>
                )}
            </section>

            <section className={styles["card"]}>
                <h2>Apariencia</h2>

                <div className={styles["setting-block"]}>
                    <span className={styles["label"]}>Fondo del launcher</span>
                    <div className={styles["segmented"]}>
                        {[
                            { value: "image", label: "Imagen" },
                            { value: "solid", label: "Color sólido" }
                        ].map((option) => (
                            <button
                                key={option.value}
                                className={`${styles["segment"]} ${settings.backgroundMode === option.value ? styles["active"] : ""}`}
                                type="button"
                                onClick={() => onSettingChange(SETTINGS_KEYS.backgroundMode, option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles["setting-block"]}>
                    <span className={styles["label"]}>Color de acento</span>
                    <div className={styles["swatches"]}>
                        {ACCENTS.map((accent) => (
                            <button
                                key={accent.value}
                                className={`${styles["swatch"]} ${settings.accentColor === accent.value ? styles["active"] : ""}`}
                                style={{ backgroundColor: accent.value }}
                                type="button"
                                title={accent.label}
                                aria-label={accent.label}
                                onClick={() => onSettingChange(SETTINGS_KEYS.accentColor, accent.value)}
                            />
                        ))}
                    </div>
                </div>

                <p className={styles["hint"]}>Los cambios se aplican al instante.</p>
            </section>

            <section className={styles["card"]}>
                <h2>Launcher</h2>

                <div className={styles["setting-block"]}>
                    <label className={styles["label"]} htmlFor="mods-path">Carpeta de mods local</label>
                    <div className={styles["name-row"]}>
                        <input
                            id="mods-path"
                            className={styles["input"]}
                            type="text"
                            value={modsPath}
                            onChange={(event) => setModsPath(event.target.value)}
                            placeholder="Selecciona una carpeta..."
                        />
                        <button
                            className={styles["btn"]}
                            type="button"
                            onClick={() => setFolderDialogOpen(true)}
                        >
                            Examinar
                        </button>
                        <button
                            className={styles["btn"]}
                            type="button"
                            disabled={modsPath.trim() === (settings.modsPath || "")}
                            onClick={handleSaveModsPath}
                        >
                            Guardar
                        </button>
                    </div>
                </div>

                <label className={styles["switch-row"]}>
                    <span>Recordar última pestaña</span>
                    <input
                        type="checkbox"
                        checked={settings.rememberTab}
                        onChange={(event) => onSettingChange(SETTINGS_KEYS.rememberTab, event.target.checked)}
                    />
                    <span className={styles["switch"]}></span>
                </label>

                <div className={styles["setting-block"]}>
                    <label className={styles["label"]} htmlFor="startup-tab">Pestaña inicial</label>
                    <select
                        id="startup-tab"
                        className={styles["select"]}
                        value={settings.startupTab}
                        disabled={settings.rememberTab}
                        onChange={(event) => onSettingChange(SETTINGS_KEYS.startupTab, event.target.value)}
                    >
                        {TABS.map((tab) => (
                            <option key={tab} value={tab}>{TAB_LABELS[tab]}</option>
                        ))}
                    </select>
                    {settings.rememberTab && (
                        <p className={styles["hint"]}>Se usará la última pestaña visitada.</p>
                    )}
                </div>
            </section>

            <section className={styles["card"]}>
                <h2>Acerca de</h2>
                <div className={styles["about-grid"]}>
                    <div><span>Aplicación</span><strong>Prisma Launcher</strong></div>
                    <div><span>Versión</span><strong>0.1.0</strong></div>
                    <div><span>Stack</span><strong>Tauri v2 · React 19</strong></div>
                    <div><span>Catálogo</span><strong>Mods de GTA SA</strong></div>
                </div>
                <p className={styles["hint"]}>Hecho para Prisma Studios.</p>
            </section>

            {folderDialogOpen && (
                <CustomFileDialog
                    title="Selecciona la carpeta de mods"
                    selectFolders
                    onSelect={handleSelectModsFolder}
                    onCancel={() => setFolderDialogOpen(false)}
                />
            )}

            {dialogOpen && (
                <CustomFileDialog
                    title="Selecciona tu foto de perfil"
                    filters={IMAGE_FILTERS}
                    onSelect={handleSelectPicture}
                    onCancel={() => setDialogOpen(false)}
                />
            )}
        </div>
    );
}

export { readStoredPicture };
export default Configuration;
