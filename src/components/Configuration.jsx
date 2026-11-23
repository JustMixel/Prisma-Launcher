import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import pfpTest from "../assets/pfp-test.png";
import CustomFileDialog, { IMAGE_FILTERS } from "./CustomFileDialog.jsx";
import { isValidName } from "../utils/name.js";
import { SETTINGS_KEYS, TABS } from "../utils/settings.js";
import { COLOR_GROUPS } from "../utils/colors.js";
import styles from "./Configuration.module.css";

const PICTURE_KEY = "prisma-profile-picture";

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
    configuration: "Configuración",
    creator: "Creator"
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
    const [backgroundDialogOpen, setBackgroundDialogOpen] = useState(false);
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);
    const [modsPath, setModsPath] = useState(settings.modsPath || "");
    const colorOverrides = settings.colorOverrides || {};

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

    async function handleSelectBackground(path)
    {
        setError("");
        setNotice("");
        try {
            const savedPath = await invoke("save_background_image", { path });
            onSettingChange(SETTINGS_KEYS.customBackgroundImage, savedPath);
            setNotice("Fondo actualizado.");
        } catch (backgroundError) {
            setError(String(backgroundError));
        } finally {
            setBackgroundDialogOpen(false);
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

    function handleColorChange(entry, value)
    {
        if (entry.accent) {
            onSettingChange(SETTINGS_KEYS.accentColor, value);
            return;
        }
        onSettingChange(
            SETTINGS_KEYS.colorOverrides,
            JSON.stringify({ ...colorOverrides, [entry.cssVar]: value })
        );
    }

    function handleResetGroup(group)
    {
        const next = { ...colorOverrides };
        for (const entry of group.entries) {
            delete next[entry.cssVar];
            if (entry.accent) {
                onSettingChange(SETTINGS_KEYS.accentColor, entry.value);
            }
        }
        onSettingChange(SETTINGS_KEYS.colorOverrides, JSON.stringify(next));
    }

    function handleResetAllColors()
    {
        onSettingChange(SETTINGS_KEYS.colorOverrides, "{}");
        const amarillo = COLOR_GROUPS.find((group) => group.id === "amarillo");
        if (amarillo) {
            onSettingChange(SETTINGS_KEYS.accentColor, amarillo.entries[0].value);
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
                <h2>Apariencia</h2>

                <div className={styles["setting-block"]}>
                    <label className={styles["label"]} htmlFor="custom-background">Imagen de fondo</label>
                    <div className={styles["name-row"]}>
                        <input
                            id="custom-background"
                            className={styles["input"]}
                            type="text"
                            value={settings.customBackgroundImage || ""}
                            readOnly
                            placeholder="Ninguna imagen seleccionada"
                        />
                        <button
                            className={styles["btn"]}
                            type="button"
                            onClick={() => setBackgroundDialogOpen(true)}
                        >
                            {settings.customBackgroundImage ? "Cambiar" : "Examinar"}
                        </button>
                        {settings.customBackgroundImage && (
                            <button
                                className={styles["btn secondary"]}
                                type="button"
                                onClick={() => onSettingChange(SETTINGS_KEYS.customBackgroundImage, "")}
                            >
                                Quitar
                            </button>
                        )}
                    </div>
                    <p className={styles["hint"]}>
                        Medidas recomendadas: 1920×1080 px (16:9). Formatos: PNG, JPG, JPEG, WEBP, BMP y
                        GIF (con animación soportada). Sin imagen se usa el fondo por defecto del launcher.
                    </p>
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
                <h2>Customización</h2>
                <p className={styles["hint"]}>
                    Inventario completo de colores del launcher, agrupado por familia. Cada color se usa en
                    todos los módulos indicados; los cambios se aplican al instante.
                </p>

                {COLOR_GROUPS.map((group) => (
                    <div key={group.id} className={styles["color-group"]}>
                        <div className={styles["color-group-head"]}>
                            <span className={styles["color-group-title"]}>{group.label}</span>
                            <button
                                className={`${styles["btn"]} ${styles["btn-ghost"]}`}
                                type="button"
                                onClick={() => handleResetGroup(group)}
                            >
                                Restablecer
                            </button>
                        </div>

                        {group.entries.map((entry) => {
                            const value = entry.accent
                                ? settings.accentColor
                                : colorOverrides[entry.cssVar] || entry.value;
                            return (
                                <div key={entry.id} className={styles["color-entry"]}>
                                    <input
                                        className={styles["color-entry-preview"]}
                                        type="color"
                                        value={value}
                                        onChange={(event) => handleColorChange(entry, event.target.value)}
                                        aria-label={entry.label}
                                        title={entry.label}
                                    />
                                    <div className={styles["color-entry-info"]}>
                                        <span className={styles["color-entry-label"]}>{entry.label}</span>
                                        <span className={styles["color-entry-where"]}>{entry.where}</span>
                                    </div>
                                    <span className={styles["color-entry-hex"]}>{value.toUpperCase()}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}

                <button
                    className={styles["btn"]}
                    type="button"
                    onClick={handleResetAllColors}
                >
                    Restablecer todos los colores
                </button>
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
            {backgroundDialogOpen && (
                <CustomFileDialog
                    title="Selecciona una imagen de fondo"
                    filters={IMAGE_FILTERS}
                    onSelect={handleSelectBackground}
                    onCancel={() => setBackgroundDialogOpen(false)}
                />
            )}
        </div>
    );
}

export { readStoredPicture };
export default Configuration;
