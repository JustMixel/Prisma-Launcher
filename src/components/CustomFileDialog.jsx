import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import prismaIcon from "../assets/prisma-icon.png";
import styles from "./CustomFileDialog.module.css";

const DEFAULT_FILTERS = [
    { label: "Ejecutables (*.exe, *.bat, *.cmd)", extensions: ["exe", "bat", "cmd"] },
    { label: "Todos los archivos (*.*)", extensions: [] }
];

const IMAGE_FILTERS = [
    { label: "Imágenes (*.png, *.jpg, *.jpeg, *.webp, *.gif, *.bmp)", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"] },
    { label: "Todos los archivos (*.*)", extensions: [] }
];

export { IMAGE_FILTERS };

function getParentPath(path)
{
    const normalized = path.replace(/[\\/]+$/, "");
    const index = Math.max(normalized.lastIndexOf("\\"), normalized.lastIndexOf("/"));
    if (index <= 0) {
        return /^[A-Za-z]:$/.test(normalized) ? `${normalized}\\` : null;
    }
    return normalized.slice(0, index);
}

function getBasename(path)
{
    return path.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || path;
}

function FolderIcon()
{
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#d9b24a" stroke="none">
            <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"/>
        </svg>
    );
}

function FileIcon()
{
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8ab4d8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
        </svg>
    );
}

function SideIcon({ type })
{
    const paths = {
        desktop: <><rect x="2" y="4" width="20" height="13" rx="1"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
        documents: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
        downloads: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
        pictures: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
        music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
        videos: <><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 8 16 12 10 16"/></>,
        pc: <><rect x="2" y="3" width="20" height="14" rx="2"/><rect x="6" y="21" width="12" height="1"/><line x1="12" y1="17" x2="12" y2="21"/></>,
        drive: <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="18" cy="12" r="1"/><line x1="6" y1="10" x2="14" y2="10"/></>
    };
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {paths[type] || paths.documents}
        </svg>
    );
}

function CustomFileDialog({ title, onSelect, onCancel, filters = DEFAULT_FILTERS, selectFolders = false })
{
    const [currentPath, setCurrentPath] = useState("");
    const [addressDraft, setAddressDraft] = useState("");
    const [entries, setEntries] = useState([]);
    const [specialFolders, setSpecialFolders] = useState([]);
    const [drives, setDrives] = useState([]);
    const [selected, setSelected] = useState(null);
    const [fileName, setFileName] = useState("");
    const [filterIndex, setFilterIndex] = useState(0);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragRef = useRef(null);
    const listRef = useRef(null);

    const activeFilter = filters[filterIndex];

    useEffect(() => {
        setAddressDraft(currentPath);
    }, [currentPath]);

    useEffect(() => {
        function handleMouseMove(event) {
            if (!dragRef.current) return;
            const offset = dragRef.current;
            setPosition({
                x: event.clientX - offset.startX,
                y: event.clientY - offset.startY
            });
        }
        function handleMouseUp() {
            dragRef.current = null;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    function handleDragStart(event) {
        if (event.target.closest("button")) return;
        dragRef.current = {
            startX: event.clientX - position.x,
            startY: event.clientY - position.y
        };
        document.body.style.cursor = "move";
        document.body.style.userSelect = "none";
    }

    useEffect(() => {
        let cancelled = false;
        async function loadInitial() {
            try {
                const [folders, disks] = await Promise.all([
                    invoke("get_special_folders"),
                    invoke("get_drives")
                ]);
                if (!cancelled) {
                    setSpecialFolders(folders);
                    setDrives(disks);
                    const initial = folders[0]?.path || disks[0]?.path || "C:\\";
                    navigateTo(initial, false);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(String(loadError));
                    setCurrentPath("C:\\");
                }
            }
        }
        loadInitial();
        return () => { cancelled = true; };
    }, []);

    async function navigateTo(path, addToHistory = true)
    {
        setLoading(true);
        setError("");
        try {
            const items = await invoke("list_directory", { path });
            setEntries(items);
            setCurrentPath(path);
            setSelected(null);
            setFileName("");
            if (addToHistory) {
                setHistory((previous) => [...previous.slice(0, historyIndex + 1), path]);
                setHistoryIndex((previous) => previous + 1);
            } else if (historyIndex === -1) {
                setHistory([path]);
                setHistoryIndex(0);
            }
            return true;
        } catch (loadError) {
            setError(String(loadError));
            setEntries([]);
            return false;
        } finally {
            setLoading(false);
        }
    }

    function normalizePathInput(value)
    {
        const typed = value.trim();
        if (!typed) {
            return null;
        }
        if (/^[A-Za-z]:$/.test(typed)) {
            return `${typed}\\`;
        }
        return typed;
    }

    async function handleAddressKeyDown(event)
    {
        if (event.key !== "Enter") {
            return;
        }
        const target = normalizePathInput(addressDraft);
        if (!target) {
            return;
        }
        await navigateTo(target);
    }

    async function handleNameKeyDown(event)
    {
        if (event.key !== "Enter") {
            return;
        }
        const typed = fileName.trim();
        const looksLikePath = typed.includes("\\") || typed.includes("/") || /^[A-Za-z]:/.test(typed);
        if (looksLikePath) {
            const target = normalizePathInput(typed);
            const navigated = await navigateTo(target);
            if (!navigated && /\.[A-Za-z0-9]+$/.test(typed)) {
                confirm(typed);
            }
            return;
        }
        handleOpenClick();
    }

    function goBack()
    {
        if (historyIndex > 0) {
            const target = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            navigateTo(target, false);
        }
    }

    function goForward()
    {
        if (historyIndex < history.length - 1) {
            const target = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            navigateTo(target, false);
        }
    }

    function goUp()
    {
        const parent = getParentPath(currentPath);
        if (parent) {
            navigateTo(parent);
        }
    }

    function handleEntryClick(entry)
    {
        setSelected(entry);
        if (!entry.is_dir) {
            setFileName(entry.name);
        } else {
            setFileName("");
        }
    }

    function handleEntryDoubleClick(entry)
    {
        if (entry.is_dir) {
            navigateTo(entry.path);
        } else if (isAllowed(entry)) {
            confirm(entry.path);
        }
    }

    function isAllowed(entry)
    {
        if (entry.is_dir || activeFilter.extensions.length === 0) {
            return true;
        }
        return activeFilter.extensions.includes(entry.extension);
    }

    function confirm(path)
    {
        const clean = path.trim();
        if (!clean) {
            return;
        }
        const fullPath = /^[A-Za-z]:[\\/]/.test(clean) ? clean : `${currentPath.replace(/[\\/]$/, "")}\\${clean}`;
        onSelect(fullPath);
    }

    function handleOpenClick()
    {
        if (selectFolders) {
            const typed = fileName.trim();
            const target = selected?.is_dir ? selected.path : (typed || currentPath);
            confirm(target);
            return;
        }

        if (selected && !selected.is_dir) {
            confirm(selected.path);
            return;
        }
        confirm(fileName);
    }

    const visibleEntries = entries.filter((entry) => isAllowed(entry) || entry.is_dir);

    return (
        <div className={styles["overlay"]} onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
            <div className={styles["dialog"]} role="dialog" aria-modal="true" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
                <div className={styles["title-bar"]} onMouseDown={handleDragStart}>
                    <div className={styles["title-left"]}>
                        <div className={styles["app-logo"]}>
                            <img src={prismaIcon} alt="Prisma Studios" />
                        </div>
                        <span>{title}</span>
                    </div>
                    <button className={styles["close-btn"]} onClick={onCancel} aria-label="Cerrar">✕</button>
                </div>

                <div className={styles["toolbar"]}>
                    <button className={styles["nav-btn"]} onClick={goBack} disabled={historyIndex <= 0} title="Atrás">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </button>
                    <button className={styles["nav-btn"]} onClick={goForward} disabled={historyIndex >= history.length - 1} title="Adelante">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                    <button className={styles["nav-btn"]} onClick={goUp} title="Subir">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                    </button>
                    <div className={styles["address-bar"]}>
                        <span className={styles["address-icon"]}><FolderIcon /></span>
                        <input
                            className={styles["address-input"]}
                            type="text"
                            value={addressDraft}
                            onChange={(event) => setAddressDraft(event.target.value)}
                            onKeyDown={handleAddressKeyDown}
                            onBlur={() => setAddressDraft(currentPath)}
                            placeholder="Escribe una ruta y presiona Enter..."
                            aria-label="Ruta de la carpeta"
                        />
                    </div>
                </div>

                <div className={styles["body"]}>
                    <aside className={styles["sidebar"]}>
                        <div className={styles["sidebar-group"]}>
                            <p className={styles["sidebar-heading"]}>Acceso rápido</p>
                            {specialFolders.map((folder) => (
                                <button
                                    key={folder.path}
                                    className={`${styles["sidebar-item"]} ${currentPath === folder.path ? styles["sidebar-active"] : ""}`}
                                    onClick={() => navigateTo(folder.path)}
                                >
                                    <SideIcon type={folder.icon} />
                                    <span>{folder.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className={styles["sidebar-group"]}>
                            <p className={styles["sidebar-heading"]}>Este equipo</p>
                            <button className={styles["sidebar-item"]} onClick={() => navigateTo("") }>
                                <SideIcon type="pc" />
                                <span>Este equipo</span>
                            </button>
                            {drives.map((drive) => (
                                <button
                                    key={drive.path}
                                    className={`${styles["sidebar-item"]} ${currentPath === drive.path ? styles["sidebar-active"] : ""}`}
                                    onClick={() => navigateTo(drive.path)}
                                >
                                    <SideIcon type="drive" />
                                    <span>{drive.name}</span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className={styles["file-list"]} ref={listRef} tabIndex={0}>
                        {loading && <p className={styles["list-state"]}>Cargando...</p>}
                        {!loading && error && <p className={styles["list-error"]}>{error}</p>}
                        {!loading && !error && visibleEntries.length === 0 && (
                            <p className={styles["list-state"]}>Esta carpeta está vacía.</p>
                        )}
                        {!loading && visibleEntries.map((entry) => (
                            <button
                                key={entry.path}
                                className={`${styles["file-row"]} ${selected?.path === entry.path ? styles["file-selected"] : ""} ${!isAllowed(entry) ? styles["file-disabled"] : ""}`}
                                onClick={() => handleEntryClick(entry)}
                                onDoubleClick={() => handleEntryDoubleClick(entry)}
                            >
                                <span className={styles["file-icon"]}>{entry.is_dir ? <FolderIcon /> : <FileIcon />}</span>
                                <span className={styles["file-name"]}>{entry.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles["bottom"]}>
                    <label className={styles["bottom-field"]}>
                        {selectFolders ? "Carpeta:" : "Nombre de archivo:"}
                        <input
                            type="text"
                            value={fileName}
                            onChange={(event) => setFileName(event.target.value)}
                            onKeyDown={handleNameKeyDown}
                            placeholder={selectFolders ? "Selecciona una carpeta" : "Archivo o ruta (Enter para navegar)"}
                        />
                    </label>
                    {!selectFolders && (
                        <label className={styles["bottom-field"]}>
                            Tipo:
                            <select value={filterIndex} onChange={(event) => setFilterIndex(Number(event.target.value))}>
                                {filters.map((filter, index) => (
                                    <option key={filter.label} value={index}>{filter.label}</option>
                                ))}
                            </select>
                        </label>
                    )}
                    <div className={styles["bottom-actions"]}>
                        <button className={styles["open-btn"]} onClick={handleOpenClick}>
                            {selectFolders ? "Seleccionar" : "Abrir"}
                        </button>
                        <button className={styles["cancel-btn"]} onClick={onCancel}>Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CustomFileDialog
