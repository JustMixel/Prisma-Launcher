import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import pfpTest from "../assets/pfp-test.png";
import CustomFileDialog, { IMAGE_FILTERS } from "./CustomFileDialog.jsx";
import { isValidName } from "../utils/name.js";
import { SETTINGS_KEYS, TABS } from "../utils/settings.js";
import styles from "./Configuration.module.css";

const PICTURE_KEY = "prisma-profile-picture";

const ACCENTS = [
    { label: "Amarillo", value: "#d9cd00" },
    { label: "Azul", value: "#6fa8dc" },
    { label: "Verde", value: "#7fb069" },
    { label: "Rojo", value: "#d96565" }
];

function hexToHsl(hex)
{
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    if (!match) {
        return { h: 0, s: 0, l: 7 };
    }
    const r = parseInt(match[1], 16) / 255;
    const g = parseInt(match[2], 16) / 255;
    const b = parseInt(match[3], 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    let hue = 0;
    let saturation = 0;
    if (max !== min) {
        const delta = max - min;
        saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        if (max === r) {
            hue = (g - b) / delta + (g < b ? 6 : 0);
        } else if (max === g) {
            hue = (b - r) / delta + 2;
        } else {
            hue = (r - g) / delta + 4;
        }
        hue *= 60;
    }
    return { h: Math.round(hue), s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}

function hslToHex(h, s, l)
{
    const saturation = s / 100;
    const lightness = l / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const section = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const match = lightness - chroma / 2;
    let rgb = [0, 0, 0];
    if (h < 60) rgb = [chroma, section, 0];
    else if (h < 120) rgb = [section, chroma, 0];
    else if (h < 180) rgb = [0, chroma, section];
    else if (h < 240) rgb = [0, section, chroma];
    else if (h < 300) rgb = [section, 0, chroma];
    else rgb = [chroma, 0, section];
    const toHex = (channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0");
    return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

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
    const [hsl, setHsl] = useState(() => hexToHsl(settings.customBackgroundColor || "#121212"));

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

    function handleHslChange(part, value)
    {
        const next = { ...hsl, [part]: Number(value) };
        setHsl(next);
        onSettingChange(SETTINGS_KEYS.customBackgroundColor, hslToHex(next.h, next.s, next.l));
    }

    function handleExactColor(event)
    {
        const hex = event.target.value;
        setHsl(hexToHsl(hex));
        onSettingChange(SETTINGS_KEYS.customBackgroundColor, hex);
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
                    <span className={styles["label"]}>Fondo del launcher</span>
                    <div className={styles["segmented"]}>
                        {[
                            { value: "image", label: "Por defecto" },
                            { value: "custom", label: "Personalizada" },
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

                {settings.backgroundMode === 'custom' && (
                    <div className={styles["setting-block"]}>
                        <label className={styles["label"]} htmlFor="custom-background">Imagen personalizada</label>
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
                        </div>
                        <p className={styles["hint"]}>
                            Medidas recomendadas: 1920×1080 px (16:9). Formatos: PNG, JPG, JPEG, WEBP, BMP y
                            GIF (con animación soportada). La imagen se adapta a la ventana.
                        </p>
                    </div>
                )}

                {settings.backgroundMode === 'solid' && (
                    <div className={styles["setting-block"]}>
                        <span className={styles["label"]}>Color de fondo</span>
                        <div className={styles["color-picker"]}>
                            <input
                                className={styles["color-preview"]}
                                type="color"
                                value={hslToHex(hsl.h, hsl.s, hsl.l)}
                                onChange={handleExactColor}
                                aria-label="Elegir color exacto"
                                title="Elegir color exacto"
                            />
                            <div className={styles["color-sliders"]}>
                                <div className={styles["slider-row"]}>
                                    <label htmlFor="slider-h">Matiz</label>
                                    <input
                                        id="slider-h"
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={hsl.h}
                                        onChange={(event) => handleHslChange("h", event.target.value)}
                                        style={{
                                            "--track": "linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))"
                                        }}
                                    />
                                </div>
                                <div className={styles["slider-row"]}>
                                    <label htmlFor="slider-s">Saturación</label>
                                    <input
                                        id="slider-s"
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={hsl.s}
                                        onChange={(event) => handleHslChange("s", event.target.value)}
                                        style={{
                                            "--track": `linear-gradient(to right, hsl(${hsl.h} 0% ${hsl.l}%), hsl(${hsl.h} 100% ${hsl.l}%))`
                                        }}
                                    />
                                </div>
                                <div className={styles["slider-row"]}>
                                    <label htmlFor="slider-l">Luminosidad</label>
                                    <input
                                        id="slider-l"
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={hsl.l}
                                        onChange={(event) => handleHslChange("l", event.target.value)}
                                        style={{
                                            "--track": `linear-gradient(to right, hsl(${hsl.h} ${hsl.s}% 0%), hsl(${hsl.h} ${hsl.s}% 50%), hsl(${hsl.h} ${hsl.s}% 100%))`
                                        }}
                                    />
                                </div>
                                <div className={styles["color-meta"]}>
                                    <span className={styles["color-hex"]}>{hslToHex(hsl.h, hsl.s, hsl.l).toUpperCase()}</span>
                                    <span className={styles["color-hsl"]}>{`${hsl.h}° · ${hsl.s}% · ${hsl.l}%`}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
