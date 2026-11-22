import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const DownloadsContext = createContext(null);

function formatEta(seconds)
{
    if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
        return "--:--";
    }
    if (seconds <= 0) {
        return "00:00";
    }
    const total = Math.ceil(seconds);
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function DownloadsProvider({ children })
{
    const [downloads, setDownloads] = useState([]);
    const [library, setLibrary] = useState([]);
    const [unseenCount, setUnseenCount] = useState(0);
    const timersRef = useRef({});
    const unseenRef = useRef(0);

    useEffect(() => {
        return () => {
            Object.values(timersRef.current).forEach((timer) => clearInterval(timer));
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        invoke("get_installed_mods")
            .then((mods) => {
                if (cancelled || !Array.isArray(mods) || mods.length === 0) {
                    return;
                }
                setLibrary((current) => {
                    const byId = new Map();
                    mods.forEach((item) => byId.set(String(item.id), item));
                    current.forEach((item) => byId.set(String(item.id), { ...(byId.get(String(item.id)) || {}), ...item }));
                    return Array.from(byId.values());
                });
            })
            .catch(() => {
                // sin manifest de mods instalados
            });

        return () => { cancelled = true; };
    }, []);

    const stopTimer = useCallback((id) => {
        if (timersRef.current[id]) {
            clearInterval(timersRef.current[id]);
            delete timersRef.current[id];
        }
    }, []);

    const markDownloadsSeen = useCallback(() => {
        unseenRef.current = 0;
        setUnseenCount(0);
    }, []);

    const addToLibrary = useCallback((item) => {
        const libraryItem = {
            ...item.libraryItem,
            source: item.libraryItem.source || "downloaded"
        };

        setLibrary((current) => {
            if (current.some((entry) => entry.id === libraryItem.id)) {
                return current;
            }
            return [libraryItem, ...current];
        });

        invoke("save_installed_mod", { installedMod: libraryItem })
            .then((stored) => {
                setLibrary((current) => current.map((entry) =>
                    entry.id === libraryItem.id ? { ...entry, ...stored } : entry
                ));
            })
            .catch((error) => {
                console.error("No se pudo registrar el mod en assets:", error);
            });
    }, []);

    const startTimer = useCallback((id) => {
        stopTimer(id);

        const timer = setInterval(() => {
            setDownloads((previous) => previous.map((item) => {
                if (item.id !== id || item.status !== "downloading") {
                    return item;
                }

                const increment = 100 / item.durationSeconds / 2;
                const nextProgress = Math.min(100, item.progress + increment);
                const secondsLeft = item.durationSeconds * (1 - nextProgress / 100);

                if (nextProgress >= 100) {
                    stopTimer(id);
                    addToLibrary(item);
                    return { ...item, progress: 100, etaSeconds: 0, status: "completed" };
                }

                return { ...item, progress: nextProgress, etaSeconds: secondsLeft };
            }));
        }, 500);

        timersRef.current[id] = timer;
    }, [stopTimer, addToLibrary]);

    const startDownload = useCallback((mod) => {
        const id = mod.ID;

        setDownloads((previous) => {
            const existing = previous.find((item) => item.id === id);
            if (existing) {
                return previous;
            }

            const libraryItem = {
                id: mod.ID,
                name: mod.m_name,
                description: mod.m_desc,
                category: mod.m_cover ? "Mod" : "Mod",
                cover: mod.m_cover || null,
                publisher: mod.m_devgroupname || null,
                producer: mod.m_producername || null,
                producerLogo: mod.m_producerlogo || null,
                devgroupLogo: mod.m_devgrouplogo || null,
                version: mod.m_version || mod.m_update?.version || "1.0.0",
                downloads: mod.m_downloads || 0,
                rating: mod.m_ratingAverage || 0,
                tags: mod.m_tags || [],
                link: mod.m_link || null,
                updateLink: mod.m_update?.download_url || null,
                installedAt: new Date().toISOString()
            };

            return [{
                id,
                libraryItem,
                progress: 0,
                etaSeconds: 12,
                durationSeconds: 12,
                status: "downloading",
                mod
            }, ...previous];
        });

        unseenRef.current += 1;
        setUnseenCount(unseenRef.current);
        setTimeout(() => startTimer(id), 0);
    }, [startTimer]);

    const pauseDownload = useCallback((id) => {
        stopTimer(id);
        setDownloads((previous) => previous.map((item) =>
            item.id === id && item.status === "downloading"
                ? { ...item, status: "paused" }
                : item
        ));
    }, [stopTimer]);

    const resumeDownload = useCallback((id) => {
        setDownloads((previous) => previous.map((item) =>
            item.id === id && item.status === "paused"
                ? { ...item, status: "downloading" }
                : item
        ));
        startTimer(id);
    }, [startTimer]);

    const cancelDownload = useCallback((id) => {
        stopTimer(id);
        setDownloads((previous) => previous.filter((item) => item.id !== id));
    }, [stopTimer]);

    const clearCompleted = useCallback(() => {
        setDownloads((previous) => previous.filter((item) => item.status !== "completed"));
    }, []);

    const getDownload = useCallback((id) => {
        return downloads.find((item) => item.id === id) || null;
    }, [downloads]);

    const isInLibrary = useCallback((id) => {
        return library.some((item) => item.id === id);
    }, [library]);

    const value = useMemo(() => ({
        downloads,
        library,
        unseenCount,
        formatEta,
        startDownload,
        pauseDownload,
        resumeDownload,
        cancelDownload,
        clearCompleted,
        getDownload,
        isInLibrary,
        markDownloadsSeen,
        addToLibrary
    }), [downloads, library, unseenCount, startDownload, pauseDownload, resumeDownload, cancelDownload, clearCompleted, getDownload, isInLibrary, markDownloadsSeen, addToLibrary]);

    return (
        <DownloadsContext.Provider value={value}>
            {children}
        </DownloadsContext.Provider>
    );
}

function useDownloads()
{
    const context = useContext(DownloadsContext);
    if (!context) {
        throw new Error("useDownloads debe usarse dentro de DownloadsProvider");
    }
    return context;
}

export { DownloadsProvider, useDownloads };
