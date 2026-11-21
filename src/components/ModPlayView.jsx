import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import stelLogo from "../../Mock/Main Screens/STEL3.png";
import styles from "./ModPlayView.module.css";

function HomeIcon()
{
    return (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </svg>
    );
}

function ChartIcon()
{
    return (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 17 9 11 13 15 21 7" />
            <polyline points="15 7 21 7 21 13" />
        </svg>
    );
}

function TrophyIcon()
{
    return (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
            <path d="M8 6H5a3 3 0 0 0 3 3" />
            <path d="M16 6h3a3 3 0 0 1-3 3" />
            <path d="M12 13v4" />
            <path d="M9 21h6" />
            <path d="M10 17h4v4h-4z" />
        </svg>
    );
}

function GearIcon()
{
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19.14 12.94a7.5 7.5 0 0 0 .06-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.24-1.12.55-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.67 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.34.61.22l2.39-.96c.5.39 1.04.7 1.62.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.58-.24 1.12-.55 1.62-.94l2.39.96c.19.12.47.02.61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
        </svg>
    );
}

function ModPlayView({ mod, onBack })
{
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [launching, setLaunching] = useState(false);
    const [panel, setPanel] = useState(null);
    const [logoFailed, setLogoFailed] = useState(false);

    const creator = mod.publisher || mod.producer || "Desconocido";
    const year = mod.installedAt ? new Date(mod.installedAt).getFullYear() : "";

    async function handlePlay()
    {
        setError("");
        setNotice("");

        if (mod.executablePath) {
            setLaunching(true);
            try {
                await invoke("launch_executable", { path: mod.executablePath });
                setNotice("Ejecutando el mod.");
            } catch (launchError) {
                setError(String(launchError));
            } finally {
                setLaunching(false);
            }
            return;
        }

        if (mod.link) {
            try {
                await openUrl(mod.link);
                setNotice("Abriendo el enlace del mod.");
            } catch (openError) {
                setError(String(openError));
            }
            return;
        }

        setError("Este mod no tiene un ejecutable registrado.");
    }

    async function handleOpenFolder()
    {
        setError("");
        setNotice("");
        if (!mod.folder) {
            setError("Este mod todavía no tiene una carpeta registrada.");
            return;
        }

        try {
            await openPath(mod.folder);
        } catch (openError) {
            setError(String(openError));
        }
    }

    return (
        <div className={styles["play-view"]}>
            <div className={styles["center"]}>
                {logoFailed ? (
                    <h1 className={styles["logo"]}>{mod.name}</h1>
                ) : (
                    <img
                        className={styles["logo-img"]}
                        src={stelLogo}
                        alt={mod.name}
                        onError={() => setLogoFailed(true)}
                    />
                )}
            </div>

            <div className={styles["actions-wrap"]}>
                <div className={styles["actions"]}>
                    <button
                        className={styles["gear-btn"]}
                        type="button"
                        title="Abrir carpeta del mod"
                        onClick={handleOpenFolder}
                    >
                        <GearIcon />
                    </button>
                    <button
                        className={styles["play-btn"]}
                        type="button"
                        onClick={handlePlay}
                        disabled={launching}
                    >
                        {launching ? "INICIANDO..." : "JUGAR"}
                    </button>
                </div>

                {error && <p className={styles["error"]}>{error}</p>}
                {notice && <p className={styles["notice"]}>{notice}</p>}
            </div>

            <p className={styles["footer"]}>
                {creator}{year ? `, ${year}` : ""}
            </p>

            <aside className={styles["rail"]}>
                <button className={styles["rail-btn"]} type="button" title="Volver a la biblioteca" onClick={onBack}>
                    <HomeIcon />
                </button>
                <button
                    className={`${styles["rail-btn"]} ${panel === "stats" ? styles["rail-btn-active"] : ""}`}
                    type="button"
                    title="Estadísticas"
                    onClick={() => setPanel(panel === "stats" ? null : "stats")}
                >
                    <ChartIcon />
                </button>
                <button
                    className={`${styles["rail-btn"]} ${panel === "achievements" ? styles["rail-btn-active"] : ""}`}
                    type="button"
                    title="Logros"
                    onClick={() => setPanel(panel === "achievements" ? null : "achievements")}
                >
                    <TrophyIcon />
                </button>
            </aside>

            {panel === "stats" && (
                <div className={styles["panel"]}>
                    <h2>Estadísticas</h2>
                    <div><span>Descargas</span><strong>{mod.downloads ?? 0}</strong></div>
                    <div><span>Rating</span><strong>★ {mod.rating ?? 0}</strong></div>
                    <div><span>Versión</span><strong>{mod.version || "1.0.0"}</strong></div>
                    <div>
                        <span>Instalado</span>
                        <strong>{mod.installedAt ? new Date(mod.installedAt).toLocaleDateString() : "—"}</strong>
                    </div>
                </div>
            )}

            {panel === "achievements" && (
                <div className={styles["panel"]}>
                    <h2>Logros</h2>
                    <p className={styles["panel-text"]}>Próximamente.</p>
                </div>
            )}
        </div>
    );
}

export default ModPlayView;
