import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useDownloads } from "../context/DownloadsContext.jsx";
import strandedHoverImage from "../assets/stranded.png";
import demoHoverMusic from "../assets/prestart.ogg";
import styles from "./Home.module.css";

// Tiempo de espera antes de activar la vista previa (estilo PS5).
const DWELL_MS = 1000;
const DEFAULT_BOUNDS = { top: 0, left: 0, width: 1280, height: 720 };

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
    const [catalog, setCatalog] = useState({});
    const [runningId, setRunningId] = useState(null);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [preview, setPreview] = useState(null);
    const [previewBounds, setPreviewBounds] = useState(DEFAULT_BOUNDS);
    const [previewImage, setPreviewImage] = useState(null);

    const dwellTimer = useRef(null);
    const audioRef = useRef(null);
    const musicSourceRef = useRef(null);
    const musicFallbackRef = useRef(false);
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

    // El catálogo completa los datos de hover de mods instalados antes de que
    // existieran esos campos en el manifiesto local.
    useEffect(() => {
        let cancelled = false;

        async function loadCatalog()
        {
            try {
                const response = await fetch("http://localhost:3000/api/mods");
                if (!response.ok) {
                    return;
                }
                const data = await response.json();
                if (cancelled || !Array.isArray(data)) {
                    return;
                }
                const byId = {};
                data.forEach((mod) => {
                    byId[String(mod.ID)] = {
                        name: mod.m_name || null,
                        description: mod.m_desc || null,
                        cover: mod.m_cover || null,
                        accentcolor: mod.m_accentcolor || null,
                        hoverImage: mod.m_hoverimage || null,
                        hoverMusic: mod.m_hovermusic || null
                    };
                });
                setCatalog(byId);
            } catch {
                // Sin servidor: los mods ya instalados siguen funcionando.
            }
        }

        loadCatalog();
        return () => { cancelled = true; };
    }, []);

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

    const desktopItems = useMemo(() => {
        const byId = new Map();
        library.forEach((item) => byId.set(String(item.id), item));
        installedMods.forEach((item) => {
            const key = String(item.id);
            byId.set(key, { ...(byId.get(key) || {}), ...item });
        });

        return Array.from(byId.values()).map((item) => {
            const remote = catalog[String(item.id)];
            if (!remote) {
                return item;
            }
            return {
                ...item,
                name: item.name || remote.name,
                description: item.description || remote.description,
                cover: item.cover || remote.cover,
                accentcolor: item.accentcolor || remote.accentcolor,
                hoverImage: item.hoverImage || remote.hoverImage,
                hoverMusic: item.hoverMusic || remote.hoverMusic
            };
        });
    }, [library, installedMods, catalog]);

    useEffect(() => {
        if (preview) {
            setPreviewBounds(measurePreviewBounds());
        }
    }, [preview]);

    useEffect(() => {
        if (!preview) {
            return undefined;
        }

        function handleResize()
        {
            setPreviewBounds(measurePreviewBounds());
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [preview]);

    useEffect(() => {
        if (!preview) {
            setPreviewImage(null);
            return undefined;
        }

        const preferred = preview.item.hoverImage || strandedHoverImage;
        setPreviewImage(preferred);

        if (!preferred || preferred === strandedHoverImage) {
            return undefined;
        }

        let cancelled = false;
        const probe = new Image();
        probe.onerror = () => {
            if (!cancelled) {
                setPreviewImage(strandedHoverImage);
            }
        };
        probe.src = preferred;

        return () => {
            cancelled = true;
            probe.onerror = null;
        };
    }, [preview]);

    useEffect(() => {
        function resumePreviewMusic()
        {
            const audio = audioRef.current;
            if (!audio || !preview) {
                return;
            }
            playAudio();
        }

        window.addEventListener("pointerdown", resumePreviewMusic);
        return () => window.removeEventListener("pointerdown", resumePreviewMusic);
    }, [preview]);

    function measurePreviewBounds()
    {
        const grid = gridRef.current;
        const main = grid ? grid.closest(".main-content") : null;
        const element = main || grid;
        if (!element) {
            return { ...DEFAULT_BOUNDS, width: window.innerWidth, height: window.innerHeight };
        }
        const rect = element.getBoundingClientRect();
        return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    }

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

    function playAudio()
    {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }

        try {
            audio.currentTime = 0;
        } catch {
            // El audio todavía no tiene metadatos.
        }

        const playback = audio.play();
        if (playback && typeof playback.catch === "function") {
            playback.catch(() => {});
        }
    }

    function startPreviewMusic(item)
    {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }

        const preferred = item.hoverMusic || demoHoverMusic;
        musicFallbackRef.current = !item.hoverMusic;

        if (musicSourceRef.current !== preferred) {
            audio.src = preferred;
            musicSourceRef.current = preferred;
        }

        audio.loop = true;
        audio.volume = 0.5;
        playAudio();
    }

    function handleAudioError()
    {
        const audio = audioRef.current;
        if (!audio || musicFallbackRef.current) {
            return;
        }

        musicFallbackRef.current = true;
        musicSourceRef.current = demoHoverMusic;
        audio.src = demoHoverMusic;
        playAudio();
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
            setPreviewBounds(measurePreviewBounds());
            setPreview({ id, side, item: mod });
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

    const previewItem = preview ? preview.item : null;

    return (
        <div className={`${styles["home"]} ${preview ? styles["previewing"] : ""}`}>
            <audio ref={audioRef} preload="auto" loop onError={handleAudioError} />

            {previewItem && (
                <div
                    className={styles["preview"]}
                    style={{
                        top: `${previewBounds.top}px`,
                        left: `${previewBounds.left}px`,
                        width: `${previewBounds.width}px`,
                        height: `${previewBounds.height}px`
                    }}
                    aria-hidden="true"
                >
                    <img
                        className={styles["preview-media"]}
                        src={previewImage || strandedHoverImage}
                        alt=""
                        onError={() => setPreviewImage(strandedHoverImage)}
                    />
                    <div className={styles["preview-shade"]} />
                    <div
                        className={styles["preview-accent"]}
                        style={{ background: `linear-gradient(to top, ${previewItem.accentcolor || "#d9cd00"}, transparent)` }}
                    />
                    <div className={`${styles["preview-info"]} ${preview.side === "left" ? styles["preview-info-left"] : styles["preview-info-right"]}`}>
                        <h2 className={styles["preview-title"]}>{previewItem.name}</h2>
                        <p className={styles["preview-desc"]}>{previewItem.description || "Sin descripción."}</p>
                    </div>
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
        </div>
    );
}

export default Home;
