import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useDownloads } from "../context/DownloadsContext.jsx";
import demoHoverImage from "../assets/San Fierro BKG.jpg";
import demoHoverMusic from "../assets/prestart.ogg";
import styles from "./Home.module.css";

// Tiempo de espera antes de activar la vista previa (estilo PS5).
const DWELL_MS = 1000;

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
    const { library } = useDownloads();
    const [installedMods, setInstalledMods] = useState([]);
    const [runningId, setRunningId] = useState(null);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [preview, setPreview] = useState(null);

    const dwellTimer = useRef(null);
    const audioRef = useRef(null);
    const musicSourceRef = useRef(null);
    const gridRef = useRef(null);

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

    useEffect(() => {
        return () => {
            if (dwellTimer.current) {
                clearTimeout(dwellTimer.current);
            }
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
            }
        };
    }, []);

    const desktopItems = (() => {
        const byId = new Map();
        library.forEach((item) => byId.set(String(item.id), item));
        installedMods.forEach((item) => {
            const key = String(item.id);
            byId.set(key, { ...(byId.get(key) || {}), ...item });
        });
        return Array.from(byId.values());
    })();

    const previewItem = preview
        ? desktopItems.find((item) => String(item.id) === preview.id) || null
        : null;

    useEffect(() => {
        if (preview && !previewItem) {
            stopPreview();
        }
    }, [preview, previewItem]);

    useEffect(() => {
        function resumePreviewMusic() {
            const audio = audioRef.current;
            if (!audio || !preview) {
                return;
            }
            const playback = audio.play();
            if (playback && typeof playback.catch === "function") {
                playback.catch(() => {});
            }
        }

        window.addEventListener("pointerdown", resumePreviewMusic);
        return () => window.removeEventListener("pointerdown", resumePreviewMusic);
    }, [preview]);

    function stopPreview()
    {
        if (dwellTimer.current) {
            clearTimeout(dwellTimer.current);
            dwellTimer.current = null;
        }

        setPreview(null);

        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }

    function startPreviewMusic(mod)
    {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }

        // Fallback de prueba mientras los mods no traigan su propio hover.
        const source = mod.hoverMusic || demoHoverMusic;
        if (!source) {
            return;
        }

        if (musicSourceRef.current !== source) {
            audio.src = source;
            musicSourceRef.current = source;
        }

        audio.loop = true;
        audio.volume = 0.5;
        audio.currentTime = 0;

        const playback = audio.play();
        if (playback && typeof playback.catch === "function") {
            playback.catch(() => {});
        }
    }

    function handleHoverStart(mod, event)
    {
        const id = String(mod.id);
        if (preview && preview.id === id) {
            return;
        }

        if (dwellTimer.current) {
            clearTimeout(dwellTimer.current);
        }

        const tileRect = event.currentTarget.getBoundingClientRect();
        const gridRect = gridRef.current ? gridRef.current.getBoundingClientRect() : null;
        const referenceWidth = gridRect ? gridRect.width : window.innerWidth;
        const centerX = gridRect
            ? tileRect.left - gridRect.left + tileRect.width / 2
            : tileRect.left + tileRect.width / 2;
        const side = centerX > referenceWidth * 0.66 ? "left" : "right";

        dwellTimer.current = setTimeout(() => {
            dwellTimer.current = null;
            setPreview({ id, side });
            startPreviewMusic(mod);
        }, DWELL_MS);
    }

    function handleHoverEnd()
    {
        if (dwellTimer.current) {
            clearTimeout(dwellTimer.current);
            dwellTimer.current = null;
        }
    }

    async function handleRun(mod)
    {
        stopPreview();
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

    return (
        <div className={`${styles["home"]} ${preview ? styles["previewing"] : ""}`}>
            <audio ref={audioRef} preload="none" />

            {previewItem && (
                <div className={styles["preview"]} aria-hidden="true">
                    <div
                        className={styles["preview-media"]}
                        style={{ backgroundImage: `url("${previewItem.hoverImage || demoHoverImage}")` }}
                    />
                    <div className={styles["preview-shade"]} />
                    <div
                        className={styles["preview-accent"]}
                        style={{ background: `linear-gradient(to top, ${previewItem.accentcolor || "var(--accent, #d9cd00)"}, transparent)` }}
                    />
                </div>
            )}

            <header className={styles["header"]}>
                <h1>ESCRITORIO</h1>
                <p>Tus mods instalados. Haz clic para ejecutarlos.</p>
            </header>

            {error && <p className={styles["error"]}>{error}</p>}
            {notice && <p className={styles["notice"]}>{notice}</p>}

            {desktopItems.length > 0 ? (
                <div className={styles["grid"]} ref={gridRef} onMouseLeave={stopPreview}>
                    {desktopItems.map((mod) => {
                        const key = String(mod.id);
                        const running = runningId === key;
                        const runnable = Boolean(mod.executablePath || mod.link);
                        const dimmed = Boolean(preview) && preview.id !== key;
                        return (
                            <div
                                key={key}
                                className={`${styles["tile"]} ${dimmed ? styles["dimmed"] : ""}`}
                                onMouseEnter={(event) => handleHoverStart(mod, event)}
                                onMouseLeave={handleHoverEnd}
                            >
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

            {previewItem && (
                <div className={`${styles["preview-info"]} ${preview.side === "left" ? styles["preview-info-left"] : styles["preview-info-right"]}`}>
                    <h2 className={styles["preview-title"]}>{previewItem.name}</h2>
                    <p className={styles["preview-desc"]}>{previewItem.description || "Sin descripción."}</p>
                </div>
            )}
        </div>
    );
}

export default Home;
