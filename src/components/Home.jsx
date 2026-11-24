import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useDownloads } from "../context/DownloadsContext.jsx";
import styles from "./Home.module.css";

function PlayIcon()
{
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none">
            <path d="M8 5v14l11-7z" />
        </svg>
    );
}

function Home()
{
    const { library, removeFromLibrary } = useDownloads();
    const [installedMods, setInstalledMods] = useState([]);
    const [runningId, setRunningId] = useState(null);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        invoke("get_installed_mods")
            .then((mods) => {
                if (!cancelled) {
                    setInstalledMods(Array.isArray(mods) ? mods : []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setInstalledMods([]);
                }
            });

        return () => { cancelled = true; };
    }, [library.length]);

    const desktopItems = (() => {
        const byId = new Map();
        library.forEach((item) => byId.set(String(item.id), item));
        installedMods.forEach((item) => {
            const key = String(item.id);
            byId.set(key, { ...(byId.get(key) || {}), ...item });
        });
        return Array.from(byId.values());
    })();

    async function handleRun(mod)
    {
        setError("");
        setNotice("");
        setRunningId(String(mod.id));

        try {
            if (mod.executablePath) {
                await invoke("launch_executable", { path: mod.executablePath });
                setNotice(`Ejecutando ${mod.name}.`);
                return;
            }

            if (mod.link) {
                await openUrl(mod.link);
                setNotice(`Abriendo el enlace de ${mod.name}.`);
                return;
            }

            setError(`${mod.name} no tiene un ejecutable registrado.`);
        } catch (runError) {
            setError(String(runError));
        } finally {
            setRunningId(null);
        }
    }

    async function handleShortcut(mod)
    {
        setError("");
        setNotice("");

        try {
            const path = await invoke("create_mod_shortcut", { installedMod: mod });
            setNotice(`Acceso directo creado: ${path}`);
        } catch (shortcutError) {
            setError(String(shortcutError));
        }
    }

    async function handleUninstall(mod)
    {
        const name = mod.name || "este mod";
        if (!window.confirm(`¿Desinstalar ${name}? Se borrarán sus archivos locales.`)) {
            return;
        }

        setError("");
        setNotice("");

        try {
            await invoke("uninstall_mod", { modId: String(mod.id) });
            removeFromLibrary(mod.id);
            setInstalledMods((current) => current.filter((entry) => String(entry.id) !== String(mod.id)));
            setNotice(`${name} se desinstaló.`);
        } catch (uninstallError) {
            setError(String(uninstallError));
        }
    }

    return (
        <div className={styles["home"]}>
            <header className={styles["header"]}>
                <h1>ESCRITORIO</h1>
                <p>Tus mods instalados. Haz clic para ejecutarlos.</p>
            </header>

            {error && <p className={styles["error"]}>{error}</p>}
            {notice && <p className={styles["notice"]}>{notice}</p>}

            {desktopItems.length > 0 ? (
                <div className={styles["grid"]}>
                    {desktopItems.map((mod) => {
                        const key = String(mod.id);
                        const running = runningId === key;
                        const runnable = Boolean(mod.executablePath || mod.link);
                        return (
                            <div key={key} className={styles["tile"]}>
                                <button
                                    className={`${styles["icon"]} ${running ? styles["running"] : ""}`}
                                    type="button"
                                    disabled={running}
                                    title={runnable ? `Ejecutar ${mod.name}` : `${mod.name} sin ejecutable`}
                                    onClick={() => handleRun(mod)}
                                >
                                    <span className={styles["icon-art"]}>
                                        {mod.cover ? (
                                            <img src={mod.cover} alt="" />
                                        ) : (
                                            <span className={styles["icon-fallback"]}>{(mod.name || "?").slice(0, 1).toUpperCase()}</span>
                                        )}
                                        <span className={styles["icon-play"]}>
                                            <PlayIcon />
                                        </span>
                                    </span>
                                    <span className={styles["icon-label"]}>{mod.name}</span>
                                    <span className={styles["icon-status"]}>
                                        {running
                                            ? "Ejecutando…"
                                            : mod.executablePath
                                                ? "Listo"
                                                : mod.link
                                                    ? "Enlace"
                                                    : "Sin ejecutable"}
                                    </span>
                                </button>
                                <div className={styles["tile-actions"]}>
                                    <button
                                        type="button"
                                        className={styles["tile-action"]}
                                        onClick={() => handleShortcut(mod)}
                                        title="Crear un acceso directo del mod"
                                    >
                                        Atajo
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles["tile-action"]} ${styles["tile-action-danger"]}`}
                                        onClick={() => handleUninstall(mod)}
                                        title="Desinstalar el mod y borrar sus archivos locales"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles["empty"]}>
                    <div className={styles["empty-mark"]}></div>
                    <p className={styles["empty-title"]}>Tu escritorio está vacío</p>
                    <p className={styles["empty-text"]}>
                        Los mods que instales aparecerán aquí como accesos directos, listos para ejecutarse.
                    </p>
                </div>
            )}
        </div>
    );
}

export default Home;
