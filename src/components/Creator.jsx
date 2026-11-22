import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { marked } from "marked";
import DOMPurify from "dompurify";
import testCrop from "../assets/modRender.png";
import CustomFileDialog, { IMAGE_FILTERS } from "./CustomFileDialog.jsx";
import { CATEGORIES } from "./AddLocalMod.jsx";
import { clearSession, getSession, saveSession } from "../utils/session.js";
import styles from "./Creator.module.css";

const API = "http://localhost:3000/api";

const AUDIO_FILTERS = [
    { label: "Audio (*.mp3, *.ogg, *.wav)", extensions: ["mp3", "ogg", "wav"] },
    { label: "Todos los archivos (*.*)", extensions: [] }
];

const VISIBILITY_OPTIONS = [
    { value: "draft", label: "Borrador" },
    { value: "hidden", label: "Oculto" },
    { value: "published", label: "Publicado" }
];

const ROLE_LABELS = {
    member: "Miembro",
    activated: "Miembro activado",
    tester: "Tester",
    developer: "Desarrollador"
};

// Mock local de invitaciones (flujo real pendiente — ver CONTEXT.md)
const MOCK_REQUESTS = [
    {
        id: "req-1",
        title: "¡Has sido invitado!",
        project: 'Proyecto Prisma – “devgroupname/producername”',
        meta: "Total Conversion · v0.1 · 18 tester(s)"
    }
];

const API_ERRORS = {
    missing_fields: "Faltan campos obligatorios.",
    unknown_creator: "Creador desconocido.",
    not_found: "Proyecto no encontrado.",
    invalid_visibility: "Visibilidad inválida.",
    invalid_max_uses: "Cantidad de usos inválida.",
    user_not_found: "Usuario no encontrado.",
    not_activated: "Ese usuario no está activado.",
    invalid_action: "Acción inválida."
};

const EMPTY_FORM = {
    name: "",
    description: "",
    category: "Total Conversion",
    cover: "",
    executablePath: "",
    tags: "",
    version: "0.1.0",
    statsIni: "",
    releaseMode: "today",
    releaseDate: "",
    countdownBadge: true,
    credits: "",
    links: "",
    requirements: "",
    changelog: "",
    languages: []
};

const EMPTY_ASSETS = {
    banner: "",
    icon: "",
    logo: "",
    libraryImage: "",
    hoverImage: "",
    hoverMusic: "",
    trailer: ""
};

const ASSET_FIELDS = [
    { key: "banner", label: "Banner de Store", hint: "Recomendado: 1920 × 480 px (banner ancho 4:1)" },
    { key: "icon", label: "Icono / ejecutable del launcher", hint: "Recomendado: 512 × 512 px, PNG con alfa" },
    { key: "logo", label: "Logo (ModPlayView)", hint: "Recomendado: PNG con alfa, ancho mínimo 1920 px (escala hasta 3528 × 1197)" },
    { key: "libraryImage", label: "Imagen de Library", hint: "Recomendado: 440 × 640 px (card 220 × 320 @2x, ratio 11:16)" },
    { key: "hoverImage", label: "Hover image", hint: "Recomendado: 440 × 640 px (misma proporción que la card)" },
    { key: "hoverMusic", label: "Hover music (audio)", hint: "Recomendado: MP3/OGG, 30–60 s, máx. ~3 MB" }
];

function renderMarkdown(text) {
    try {
        return DOMPurify.sanitize(marked.parse(text || ""));
    } catch {
        return "";
    }
}

function isoToLocalInput(iso) {
    if (!iso) {
        return "";
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function mapError(error) {
    const message = String(error?.message || error);
    if (message.includes("fetch") || message.includes("Failed")) {
        return "No se pudo conectar con el servidor.";
    }
    return API_ERRORS[message] || message;
}

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || `Error HTTP ${response.status}`);
    }
    return data;
}

function jsonOptions(method, body) {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    };
}

function Creator({ onNavigate })
{
    const [session, setSession] = useState(getSession);
    const isDeveloper = session?.role === "developer";

    const [view, setView] = useState("list");
    const [status, setStatus] = useState("loading");
    const [reloadKey, setReloadKey] = useState(0);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [coverDataUrl, setCoverDataUrl] = useState("");
    const [coverPath, setCoverPath] = useState("");
    const [assets, setAssets] = useState({ ...EMPTY_ASSETS });
    const [screenshots, setScreenshots] = useState([]);
    const [assetDialog, setAssetDialog] = useState(null);
    const [shotsDialog, setShotsDialog] = useState(false);
    const [showDescPreview, setShowDescPreview] = useState(false);
    const [languageOptions, setLanguageOptions] = useState([]);
    const [shotEditIndex, setShotEditIndex] = useState(null);
    const [shotDragIndex, setShotDragIndex] = useState(null);
    const [executableDialog, setExecutableDialog] = useState(false);
    const [coverDialog, setCoverDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionBusy, setActionBusy] = useState(false);
    const [codeMaxUses, setCodeMaxUses] = useState("100");
    const [testerUserId, setTesterUserId] = useState("");
    const [accountUser, setAccountUser] = useState("");
    const [accountPass, setAccountPass] = useState("");
    const [accountBusy, setAccountBusy] = useState(false);

    useEffect(() => {
        if (!isDeveloper) {
            setStatus("ready");
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const [projectData, userData, languageData] = await Promise.all([
                    fetchJson(`${API}/creator/projects?creator=${encodeURIComponent(session.username)}`),
                    fetchJson(`${API}/users`),
                    fetchJson(`${API}/languages`).catch(() => [])
                ]);
                if (cancelled) {
                    return;
                }
                setProjects(Array.isArray(projectData) ? projectData : []);
                setUsers(Array.isArray(userData) ? userData : []);
                setLanguageOptions(Array.isArray(languageData) ? languageData : []);
                setStatus("ready");
            } catch (loadError) {
                if (!cancelled) {
                    setError(mapError(loadError));
                    setStatus("error");
                }
            }
        })();

        return () => { cancelled = true; };
    }, [isDeveloper, session?.username, reloadKey]);

    function reload() {
        setReloadKey((key) => key + 1);
    }

    async function handleLogin(event) {
        event.preventDefault();
        if (accountBusy || !accountUser.trim() || !accountPass) {
            return;
        }

        setAccountBusy(true);
        setError("");
        try {
            const data = await fetchJson(`${API}/auth/login`, jsonOptions("POST", {
                username: accountUser.trim(),
                password: accountPass
            }));
            saveSession(data.user);
            setSession(data.user);
            setAccountPass("");
            setView("list");
        } catch (loginError) {
            const message = String(loginError?.message || loginError);
            setError(message === "invalid"
                ? "Usuario o contraseña incorrectos."
                : mapError(loginError));
        } finally {
            setAccountBusy(false);
        }
    }

    function handleLogout() {
        clearSession();
        setSession(null);
        setAccountUser("");
        setAccountPass("");
        setError("");
        setView("list");
        setSelectedId(null);
        setStatus("loading");
    }

    function handleFormChange(event) {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    }

    function openCreate() {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setCoverDataUrl("");
        setCoverPath("");
        setAssets({ ...EMPTY_ASSETS });
        setScreenshots([]);
        setShowDescPreview(false);
        setShotEditIndex(null);
        setError("");
        setView("form");
    }

    function addLanguage(value) {
        const language = (value || "").trim();
        if (!language) {
            return;
        }
        setForm((previous) => (
            previous.languages.some((lang) => lang.toLowerCase() === language.toLowerCase())
                ? previous
                : { ...previous, languages: [...previous.languages, language] }
        ));
    }

    function removeLanguage(lang) {
        setForm((previous) => ({ ...previous, languages: previous.languages.filter((entry) => entry !== lang) }));
    }

    function updateShotField(index, field, value) {
        setScreenshots((previous) => previous.map((shot, shotIndex) => (
            shotIndex === index ? { ...shot, [field]: value } : shot
        )));
    }

    function removeShot(index) {
        setScreenshots((previous) => previous.filter((_, shotIndex) => shotIndex !== index));
        setShotEditIndex((previous) => {
            if (previous === null || previous < index) {
                return previous;
            }
            if (previous === index) {
                return null;
            }
            return previous - 1;
        });
    }

    function handleShotDragStart(index) {
        setShotDragIndex(index);
    }

    function handleShotDragOver(event, index) {
        event.preventDefault();
        if (shotDragIndex === null || shotDragIndex === index) {
            return;
        }
        setScreenshots((previous) => {
            const next = [...previous];
            const [moved] = next.splice(shotDragIndex, 1);
            next.splice(index, 0, moved);
            return next;
        });
        setShotEditIndex((previous) => {
            if (previous === null) {
                return previous;
            }
            if (previous === shotDragIndex) {
                return index;
            }
            if (shotDragIndex < previous && previous <= index) {
                return previous - 1;
            }
            if (index <= previous && previous < shotDragIndex) {
                return previous + 1;
            }
            return previous;
        });
        setShotDragIndex(index);
    }

    function handleShotDragEnd() {
        setShotDragIndex(null);
    }

    function openEdit(project) {
        setEditingId(project.id);
        setForm({
            name: project.name,
            description: project.description || "",
            category: project.category || "Otro",
            cover: typeof project.cover === "string" && project.cover.startsWith("http") ? project.cover : "",
            executablePath: project.executablePath || "",
            tags: (project.tags || []).join(", "),
            version: project.version || "0.1.0",
            statsIni: project.statsIni || "",
            releaseMode: project.releasedate ? "scheduled" : "today",
            releaseDate: isoToLocalInput(project.releasedate),
            countdownBadge: Boolean(project.countdownBadge),
            credits: project.credits || "",
            links: (project.links || []).join("\n"),
            requirements: project.requirements || "",
            changelog: project.changelog || "",
            languages: Array.isArray(project.languages)
                ? project.languages
                : (typeof project.languages === "string" && project.languages
                    ? project.languages.split(",").map((lang) => lang.trim()).filter(Boolean)
                    : [])
        });
        setCoverDataUrl(typeof project.cover === "string" && project.cover.startsWith("data:") ? project.cover : "");
        setCoverPath("");
        setAssets({ ...EMPTY_ASSETS, ...(project.assets || {}) });
        setScreenshots(
            Array.isArray(project.screenshots)
                ? project.screenshots.map((shot) => (typeof shot === "string"
                    ? { src: shot, name: "", description: "" }
                    : { src: shot.src || "", name: shot.name || "", description: shot.description || "" }))
                : []
        );
        setShowDescPreview(false);
        setShotEditIndex(null);
        setError("");
        setView("form");
    }

    function openDetail(id) {
        setSelectedId(id);
        setError("");
        setView("detail");
    }

    function goBackFromForm() {
        setError("");
        if (editingId) {
            setView("detail");
        } else {
            setView("list");
        }
    }

    async function handleSelectCover(path) {
        try {
            const dataUrl = await invoke("read_file_as_data_url", { path });
            setCoverDataUrl(dataUrl);
            setCoverPath(path);
        } catch (coverError) {
            setError(String(coverError));
        } finally {
            setCoverDialog(false);
        }
    }

    async function handleSelectAsset(path) {
        try {
            const dataUrl = await invoke("read_file_as_data_url", { path });
            setAssets((previous) => ({ ...previous, [assetDialog]: dataUrl }));
        } catch (assetError) {
            setError(String(assetError));
        } finally {
            setAssetDialog(null);
        }
    }

    async function handleAddScreenshot(path) {
        try {
            const dataUrl = await invoke("read_file_as_data_url", { path });
            setScreenshots((previous) => [...previous, { src: dataUrl, name: "", description: "" }]);
            setShotEditIndex((previous) => previous); // mantiene el editor abierto si ya lo estaba
        } catch (shotError) {
            setError(String(shotError));
        } finally {
            setShotsDialog(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (saving || !form.name.trim()) {
            return;
        }

        setSaving(true);
        setError("");
        const scheduled = form.releaseMode === "scheduled";
        const payload = {
            name: form.name,
            description: form.description,
            category: form.category,
            cover: coverDataUrl || form.cover.trim() || null,
            tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
            version: form.version,
            executablePath: form.executablePath || null,
            statsIni: form.statsIni.trim() || null,
            releasedate: scheduled
                ? (form.releaseDate ? new Date(form.releaseDate).toISOString() : null)
                : new Date().toISOString(),
            countdownBadge: scheduled && form.countdownBadge,
            credits: form.credits,
            links: form.links.split("\n").map((link) => link.trim()).filter(Boolean),
            requirements: form.requirements,
            changelog: form.changelog,
            languages: form.languages,
            assets: {
                banner: assets.banner || null,
                icon: assets.icon || null,
                logo: assets.logo || null,
                libraryImage: assets.libraryImage || null,
                hoverImage: assets.hoverImage || null,
                hoverMusic: assets.hoverMusic || null,
                trailer: assets.trailer || null
            },
            screenshots
        };

        try {
            if (editingId) {
                await fetchJson(`${API}/creator/projects/${editingId}`, jsonOptions("PATCH", payload));
                setSelectedId(editingId);
            } else {
                const data = await fetchJson(`${API}/creator/projects`, jsonOptions("POST", {
                    ...payload,
                    creator: session.username,
                    generateCodeMaxUses: 100
                }));
                setSelectedId(data.project.id);
            }
            reload();
            setView("detail");
        } catch (submitError) {
            setError(mapError(submitError));
        } finally {
            setSaving(false);
        }
    }

    async function changeVisibility(visibility) {
        if (actionBusy || !selectedId) {
            return;
        }
        setActionBusy(true);
        setError("");
        try {
            await fetchJson(`${API}/creator/projects/${selectedId}/visibility`, jsonOptions("POST", { visibility }));
            reload();
        } catch (visibilityError) {
            setError(mapError(visibilityError));
        } finally {
            setActionBusy(false);
        }
    }

    async function handleGenerateCode() {
        if (actionBusy || !selectedId) {
            return;
        }
        setActionBusy(true);
        setError("");
        try {
            await fetchJson(`${API}/creator/projects/${selectedId}/codes`, jsonOptions("POST", { maxUses: Number(codeMaxUses) }));
            reload();
        } catch (codeError) {
            setError(mapError(codeError));
        } finally {
            setActionBusy(false);
        }
    }

    async function handleAddTester() {
        if (actionBusy || !selectedId || !testerUserId) {
            return;
        }
        setActionBusy(true);
        setError("");
        try {
            await fetchJson(`${API}/creator/projects/${selectedId}/testers`, jsonOptions("POST", {
                userId: Number(testerUserId),
                action: "add"
            }));
            setTesterUserId("");
            reload();
        } catch (testerError) {
            setError(mapError(testerError));
        } finally {
            setActionBusy(false);
        }
    }

    async function handleRemoveTester(userId) {
        if (actionBusy || !selectedId) {
            return;
        }
        setActionBusy(true);
        setError("");
        try {
            await fetchJson(`${API}/creator/projects/${selectedId}/testers`, jsonOptions("POST", {
                userId,
                action: "remove"
            }));
            reload();
        } catch (testerError) {
            setError(mapError(testerError));
        } finally {
            setActionBusy(false);
        }
    }

    async function handleCopyCode(code) {
        try {
            await navigator.clipboard.writeText(code);
        } catch {
            // portapapeles no disponible
        }
    }

    function renderWelcomeBar() {
        return (
            <header className={styles["welcome-bar"]}>
                <h1 className={styles["welcome"]}>¡Bienvenido, {session.displayName}!</h1>
                <div className={styles["header-buttons"]}>
                    <button
                        type="button"
                        className={styles["icon-btn"]}
                        title="Grupos de desarrollo"
                        aria-label="Grupos de desarrollo"
                        onClick={() => { setError(""); setView("groups"); }}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={styles["icon-btn"]}
                        title="Perfil"
                        aria-label="Perfil"
                        onClick={() => onNavigate && onNavigate("configuration")}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={styles["icon-btn"]}
                        title="Configuración"
                        aria-label="Configuración"
                        onClick={() => onNavigate && onNavigate("configuration")}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={`${styles["icon-btn"]} ${styles["icon-btn-danger"]}`}
                        title="Salir"
                        aria-label="Salir"
                        onClick={handleLogout}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                        </svg>
                    </button>
                </div>
            </header>
        );
    }

    if (!session) {
        return (
            <div className={styles["creator"]}>
                <div className={styles["login-panel"]}>
                    <h1 className={styles["title"]}>PRISMA CREATOR NETWORK</h1>
                    <p className={styles["subtitle"]}>
                        Iniciá sesión con tu cuenta Prisma para gestionar tus proyectos.
                    </p>

                    <form onSubmit={handleLogin} className={styles["login-form"]}>
                        <label className={styles["label"]}>
                            Usuario
                            <input
                                className={styles["input"]}
                                type="text"
                                value={accountUser}
                                onChange={(event) => setAccountUser(event.target.value)}
                                autoComplete="username"
                                placeholder="Usuario"
                            />
                        </label>

                        <label className={styles["label"]}>
                            Contraseña
                            <input
                                className={styles["input"]}
                                type="password"
                                value={accountPass}
                                onChange={(event) => setAccountPass(event.target.value)}
                                autoComplete="current-password"
                                placeholder="Contraseña"
                            />
                        </label>

                        {error && <p className={styles["error"]}>{error}</p>}

                        <button
                            type="submit"
                            className={styles["login-btn"]}
                            disabled={accountBusy || !accountUser.trim() || !accountPass}
                        >
                            {accountBusy ? "Conectando…" : "Iniciar sesión"}
                        </button>
                    </form>

                    <p className={styles["hint"]}>
                        Cuentas de prueba: dev/dev123 · tester/tester123 · user/user123
                    </p>
                </div>
            </div>
        );
    }

    if (!isDeveloper) {
        return (
            <div className={styles["creator"]}>
                <div className={styles["state-block"]}>
                    <p className={styles["state-text"]}>
                        Esta sección es solo para desarrolladores.
                    </p>
                    <p className={styles["state-text"]}>
                        Sesión actual: {session.displayName} ({ROLE_LABELS[session.role] || session.role}).
                    </p>
                    <button type="button" className={styles["retry-btn"]} onClick={handleLogout}>
                        Cerrar sesión
                    </button>
                </div>
            </div>
        );
    }

    if (status === "loading") {
        return (
            <div className={styles["creator"]}>
                <div className={styles["state-block"]}>
                    <p className={styles["state-text"]}>Cargando proyectos…</p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className={styles["creator"]}>
                <div className={styles["state-block"]}>
                    <p className={styles["state-text"]}>{error || "No se pudo conectar con el servidor."}</p>
                    <button
                        type="button"
                        className={styles["retry-btn"]}
                        onClick={() => {
                            setError("");
                            setStatus("loading");
                            reload();
                        }}
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (view === "form") {
        return (
            <div className={styles["creator"]}>
                {renderWelcomeBar()}

                <section className={styles["pcn-section"]}>
                    <div className={styles["form-head"]}>
                        <h1 className={styles["form-title"]}>{editingId ? "Editar Mod" : "Nuevo Mod"}</h1>
                        <p className={styles["form-subtitle"]}>
                            {editingId
                                ? "Actualizá los metadatos del proyecto."
                                : "Crea un proyecto dentro de la Prisma Creator Network. Se generará un código de activación inicial."}
                        </p>
                    </div>

                    <div className={styles["preview-card"]}>
                        <div className={styles["preview-frame"]}>
                            <img
                                src={coverDataUrl || form.cover.trim() || testCrop}
                                alt="Vista previa"
                                onError={(event) => { event.currentTarget.src = testCrop; }}
                            />
                        </div>
                        <div className={styles["preview-info"]}>
                            <p className={styles["preview-name"]}>{form.name || "Nombre del proyecto"}</p>
                            <p className={styles["preview-creator"]}>{session.displayName}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles["meta-panel"]}>
                        <span className={styles["group-title"]}>Información</span>

                        <label className={styles["label"]}>
                            Nombre del proyecto
                            <input className={styles["input"]} type="text" name="name" value={form.name} onChange={handleFormChange} required />
                        </label>

                        <div className={styles["label"]}>
                            <div className={styles["label-head"]}>
                                Descripción (Markdown + HTML)
                                <button
                                    type="button"
                                    className={styles["preview-toggle"]}
                                    onClick={() => setShowDescPreview((previous) => !previous)}
                                >
                                    {showDescPreview ? "Editar" : "Vista previa"}
                                </button>
                            </div>
                            {showDescPreview ? (
                                <div
                                    className={styles["md-preview"]}
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(form.description) }}
                                />
                            ) : (
                                <textarea className={styles["textarea"]} name="description" value={form.description} onChange={handleFormChange} required />
                            )}
                        </div>

                        <label className={styles["label"]}>
                            Categoría
                            <select className={styles["input"]} name="category" value={form.category} onChange={handleFormChange}>
                                {CATEGORIES.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </label>

                        <div className={styles["label"]}>
                            Portada (URL o archivo local)
                            <div className={styles["row-inline"]}>
                                <input
                                    className={styles["input"]}
                                    type="url"
                                    name="cover"
                                    value={form.cover}
                                    onChange={handleFormChange}
                                    placeholder="https://..."
                                />
                                <button type="button" className={styles["browse-btn"]} onClick={() => setCoverDialog(true)}>
                                    Examinar
                                </button>
                                {coverPath && (
                                    <button
                                        type="button"
                                        className={styles["clear-btn"]}
                                        title="Quitar portada local"
                                        onClick={() => { setCoverDataUrl(""); setCoverPath(""); }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            {coverPath && <p className={styles["field-hint"]}>{coverPath}</p>}
                            <p className={styles["field-hint"]}>Recomendado: 440 × 640 px (card 220 × 320 @2x, ratio 11:16)</p>
                        </div>

                        <div className={styles["label"]}>
                            Ruta del ejecutable
                            <div className={styles["row-inline"]}>
                                <input
                                    className={styles["input"]}
                                    type="text"
                                    value={form.executablePath}
                                    onChange={(event) => setForm((previous) => ({ ...previous, executablePath: event.target.value }))}
                                    placeholder="Selecciona el archivo..."
                                    readOnly
                                />
                                <button type="button" className={styles["browse-btn"]} onClick={() => setExecutableDialog(true)}>
                                    Explorar
                                </button>
                            </div>
                        </div>

                        <div className={styles["form-grid"]}>
                            <label className={styles["label"]}>
                                Versión
                                <input className={styles["input"]} type="text" name="version" value={form.version} onChange={handleFormChange} placeholder="0.1.0" />
                            </label>

                            <label className={styles["label"]}>
                                Archivo .ini de estadísticas
                                <input className={styles["input"]} type="text" name="statsIni" value={form.statsIni} onChange={handleFormChange} placeholder="stats.ini" />
                            </label>
                        </div>

                        <label className={styles["label"]}>
                            Tags (separados por coma)
                            <input className={styles["input"]} type="text" name="tags" value={form.tags} onChange={handleFormChange} placeholder="GTA SA, Total Conversion" />
                        </label>

                        <span className={styles["group-title"]}>Lanzamiento</span>

                        <div className={styles["radio-row"]}>
                            <label className={styles["radio-label"]}>
                                <input
                                    type="radio"
                                    name="releaseMode"
                                    checked={form.releaseMode === "today"}
                                    onChange={() => setForm((previous) => ({ ...previous, releaseMode: "today" }))}
                                />
                                Lanzar hoy
                            </label>
                            <label className={styles["radio-label"]}>
                                <input
                                    type="radio"
                                    name="releaseMode"
                                    checked={form.releaseMode === "scheduled"}
                                    onChange={() => setForm((previous) => ({ ...previous, releaseMode: "scheduled" }))}
                                />
                                Fecha programada
                            </label>
                        </div>

                        {form.releaseMode === "scheduled" && (
                            <>
                                <label className={styles["label"]}>
                                    Fecha y hora de lanzamiento
                                    <input
                                        className={styles["input"]}
                                        type="datetime-local"
                                        name="releaseDate"
                                        value={form.releaseDate}
                                        onChange={handleFormChange}
                                    />
                                </label>
                                <div className={styles["radio-row"]}>
                                    <label className={styles["radio-label"]}>
                                        <input
                                            type="radio"
                                            name="countdownBadge"
                                            checked={form.countdownBadge}
                                            onChange={() => setForm((previous) => ({ ...previous, countdownBadge: true }))}
                                        />
                                        Mostrar badge de cuenta regresiva
                                    </label>
                                    <label className={styles["radio-label"]}>
                                        <input
                                            type="radio"
                                            name="countdownBadge"
                                            checked={!form.countdownBadge}
                                            onChange={() => setForm((previous) => ({ ...previous, countdownBadge: false }))}
                                        />
                                        Conteo silencioso
                                    </label>
                                </div>
                            </>
                        )}

                        <span className={styles["group-title"]}>Detalles</span>

                        <label className={styles["label"]}>
                            Créditos (equipo / colaboradores)
                            <textarea
                                className={styles["textarea"]}
                                name="credits"
                                value={form.credits}
                                onChange={handleFormChange}
                                placeholder={"Equipo: ...\nColaboradores: ..."}
                            />
                        </label>

                        <label className={styles["label"]}>
                            Enlaces (uno por línea)
                            <textarea
                                className={styles["textarea"]}
                                name="links"
                                value={form.links}
                                onChange={handleFormChange}
                                placeholder={"https://...\nhttps://discord.gg/..."}
                            />
                        </label>

                        <div className={styles["form-grid"]}>
                            <label className={styles["label"]}>
                                Requisitos / dependencias
                                <textarea
                                    className={styles["textarea"]}
                                    name="requirements"
                                    value={form.requirements}
                                    onChange={handleFormChange}
                                    placeholder={"Windows 10 64-bit\nGTA SA 1.0 US"}
                                />
                            </label>

                            <label className={styles["label"]}>
                                Changelog / notas de versión
                                <textarea
                                    className={styles["textarea"]}
                                    name="changelog"
                                    value={form.changelog}
                                    onChange={handleFormChange}
                                    placeholder={"v0.1.0\n- Primer release"}
                                />
                            </label>
                        </div>

                        <div className={styles["label"]}>
                            Idioma(s)
                            {form.languages.length > 0 && (
                                <div className={styles["lang-chips"]}>
                                    {form.languages.map((lang) => (
                                        <span className={styles["lang-chip"]} key={lang}>
                                            {lang}
                                            <button
                                                type="button"
                                                className={styles["lang-chip-remove"]}
                                                title={`Quitar ${lang}`}
                                                onClick={() => removeLanguage(lang)}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <select
                                className={styles["input"]}
                                value=""
                                onChange={(event) => { if (event.target.value) addLanguage(event.target.value); }}
                                disabled={
                                    languageOptions.length > 0
                                    && languageOptions.every((lang) => form.languages.includes(lang))
                                }
                            >
                                <option value="" disabled>
                                    {languageOptions.length === 0
                                        ? "Cargando idiomas..."
                                        : (languageOptions.every((lang) => form.languages.includes(lang))
                                            ? "Ya agregaste todos los idiomas"
                                            : "Elegí un idioma para agregarlo...")}
                                </option>
                                {languageOptions
                                    .filter((lang) => !form.languages.includes(lang))
                                    .map((lang) => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                            </select>
                            <p className={styles["field-hint"]}>Elegí el idioma de la lista; ✕ en el chip para quitarlo.</p>
                        </div>

                        <span className={styles["group-title"]}>Assets</span>

                        {ASSET_FIELDS.map((asset) => (
                            <div className={styles["asset-block"]} key={asset.key}>
                                <div className={styles["asset-row"]}>
                                    <span className={styles["asset-label"]}>{asset.label}</span>
                                    <div className={styles["asset-controls"]}>
                                        {asset.key !== "hoverMusic" && assets[asset.key] && (
                                            <div className={styles["asset-thumb"]}>
                                                <img src={assets[asset.key]} alt="" />
                                            </div>
                                        )}
                                        <input
                                            className={styles["input"]}
                                            type="text"
                                            value={assets[asset.key] || ""}
                                            onChange={(event) => setAssets((previous) => ({ ...previous, [asset.key]: event.target.value }))}
                                            placeholder={asset.key === "hoverMusic" ? "Archivo de audio..." : "https://..."}
                                        />
                                        <button type="button" className={styles["browse-btn"]} onClick={() => setAssetDialog(asset.key)}>
                                            Examinar
                                        </button>
                                        {assets[asset.key] && (
                                            <button
                                                type="button"
                                                className={styles["clear-btn"]}
                                                title="Quitar asset"
                                                onClick={() => setAssets((previous) => ({ ...previous, [asset.key]: "" }))}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className={styles["asset-hint"]}>{asset.hint}</p>
                            </div>
                        ))}

                        <label className={styles["label"]}>
                            Trailer (URL)
                            <input
                                className={styles["input"]}
                                type="url"
                                value={assets.trailer || ""}
                                onChange={(event) => setAssets((previous) => ({ ...previous, trailer: event.target.value }))}
                                placeholder="https://youtube.com/..."
                            />
                        </label>

                        <div className={styles["label"]}>
                            <div className={styles["label-head"]}>
                                Galería de screenshots
                                <button type="button" className={styles["preview-toggle"]} onClick={() => setShotsDialog(true)}>
                                    + Agregar imagen
                                </button>
                            </div>
                            <p className={styles["field-hint"]}>
                                Arrastrá las imágenes para reordenarlas. Recomendado: 1920 × 1080 px (16:9). Clic en una imagen para ponerle nombre y descripción.
                            </p>
                            {screenshots.length > 0 && (
                                <div className={styles["shots-grid"]}>
                                    {screenshots.map((shot, index) => (
                                        <div
                                            className={`${styles["shot-item"]} ${shotEditIndex === index ? styles["shot-active"] : ""} ${shotDragIndex === index ? styles["shot-dragging"] : ""}`}
                                            key={`${shot.src.slice(-24)}-${index}`}
                                            draggable
                                            onDragStart={() => handleShotDragStart(index)}
                                            onDragOver={(event) => handleShotDragOver(event, index)}
                                            onDragEnd={handleShotDragEnd}
                                            onClick={() => setShotEditIndex((previous) => (previous === index ? null : index))}
                                            title="Clic para editar · arrastrar para reordenar"
                                        >
                                            <img src={shot.src} alt={shot.name || `Screenshot ${index + 1}`} />
                                            <span className={styles["shot-index"]}>{index + 1}</span>
                                            <button
                                                type="button"
                                                className={styles["shot-remove"]}
                                                title="Quitar screenshot"
                                                onClick={(event) => { event.stopPropagation(); removeShot(index); }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {shotEditIndex !== null && screenshots[shotEditIndex] && (
                                <div className={styles["shot-editor"]}>
                                    <p className={styles["shot-editor-title"]}>Screenshot {shotEditIndex + 1}</p>
                                    <label className={styles["label"]}>
                                        Nombre (opcional)
                                        <input
                                            className={styles["input"]}
                                            type="text"
                                            value={screenshots[shotEditIndex].name}
                                            onChange={(event) => updateShotField(shotEditIndex, "name", event.target.value)}
                                            placeholder="Ej: Gameplay en el centro"
                                        />
                                    </label>
                                    <label className={styles["label"]}>
                                        Descripción (opcional)
                                        <textarea
                                            className={styles["textarea"]}
                                            value={screenshots[shotEditIndex].description}
                                            onChange={(event) => updateShotField(shotEditIndex, "description", event.target.value)}
                                            placeholder="Ej: Vista del mapa durante la misión 3"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        {error && <p className={styles["error"]}>{error}</p>}

                        <div className={styles["actions"]}>
                            <button type="button" className={styles["cancel-btn"]} onClick={goBackFromForm}>Cancelar</button>
                            <button type="submit" className={styles["submit-btn"]} disabled={saving || !form.name.trim()}>
                                {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Enviar"}
                            </button>
                        </div>
                    </form>
                </section>

                {executableDialog && (
                    <CustomFileDialog
                        title="Selecciona el ejecutable del proyecto"
                        onSelect={(path) => {
                            setForm((previous) => ({ ...previous, executablePath: path }));
                            setExecutableDialog(false);
                        }}
                        onCancel={() => setExecutableDialog(false)}
                    />
                )}

                {coverDialog && (
                    <CustomFileDialog
                        title="Selecciona la portada del proyecto"
                        filters={IMAGE_FILTERS}
                        onSelect={handleSelectCover}
                        onCancel={() => setCoverDialog(false)}
                    />
                )}

                {assetDialog && (
                    <CustomFileDialog
                        title="Selecciona el asset"
                        filters={assetDialog === "hoverMusic" ? AUDIO_FILTERS : IMAGE_FILTERS}
                        onSelect={handleSelectAsset}
                        onCancel={() => setAssetDialog(null)}
                    />
                )}

                {shotsDialog && (
                    <CustomFileDialog
                        title="Agregar screenshot"
                        filters={IMAGE_FILTERS}
                        onSelect={handleAddScreenshot}
                        onCancel={() => setShotsDialog(false)}
                    />
                )}
            </div>
        );
    }

    if (view === "detail") {
        const project = projects.find((entry) => entry.id === selectedId);

        if (!project) {
            return (
                <div className={styles["creator"]}>
                    <div className={styles["state-block"]}>
                        <button className={styles["back-btn"]} onClick={() => setView("list")} aria-label="Volver">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5" />
                                <path d="M12 19l-7-7 7-7" />
                            </svg>
                            Volver
                        </button>
                        <p className={styles["state-text"]}>Proyecto no encontrado.</p>
                    </div>
                </div>
            );
        }

        const testerCandidates = users.filter(
            (user) => user.activated && !project.testers.some((tester) => tester.id === user.id)
        );

        return (
            <div className={styles["creator"]}>
                <div className={styles["detail-panel"]}>
                    <div className={styles["panel-head"]}>
                        <button className={styles["back-btn"]} onClick={() => { setView("list"); setError(""); }} aria-label="Volver">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5" />
                                <path d="M12 19l-7-7 7-7" />
                            </svg>
                            Volver
                        </button>
                    </div>

                    <div className={styles["detail-header"]}>
                        <div className={styles["detail-cover"]}>
                            <img src={project.cover || testCrop} alt={project.name} onError={(event) => { event.currentTarget.src = testCrop; }} />
                        </div>
                        <div className={styles["detail-info"]}>
                            <div className={styles["detail-title-row"]}>
                                <h1 className={styles["detail-name"]}>{project.name}</h1>
                                <span className={`${styles["badge"]} ${styles[`badge-${project.visibility}`]}`}>
                                    {VISIBILITY_OPTIONS.find((option) => option.value === project.visibility)?.label || project.visibility}
                                </span>
                            </div>
                            <p className={styles["detail-creator"]}>{project.creatorName || session.displayName}</p>
                            <p className={styles["detail-meta"]}>
                                {project.category} · v{project.version || "—"} · actualizado {new Date(project.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className={styles["detail-actions"]}>
                            <button type="button" className={styles["edit-btn"]} onClick={() => openEdit(project)}>Editar</button>
                            <button type="button" className={styles["test-btn"]} disabled title="Próximamente (F3)">Testear</button>
                        </div>
                    </div>

                    {project.description && (
                        <div
                            className={`${styles["detail-desc"]} ${styles["md-preview"]}`}
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(project.description) }}
                        />
                    )}

                    {error && <p className={styles["error"]}>{error}</p>}

                    <section className={styles["section"]}>
                        <h2 className={styles["section-title"]}>Visibilidad</h2>
                        <div className={styles["visibility-row"]}>
                            {VISIBILITY_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`${styles["visibility-btn"]} ${project.visibility === option.value ? styles["visibility-active"] : ""}`}
                                    disabled={actionBusy}
                                    onClick={() => changeVisibility(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <p className={styles["hint"]}>
                            Oculto: solo accesible por código. Publicado: aparecerá en la Store (integración pendiente F5).
                        </p>
                    </section>

                    <section className={styles["section"]}>
                        <h2 className={styles["section-title"]}>Códigos de activación</h2>
                        {project.codes.length > 0 ? (
                            <div className={styles["code-list"]}>
                                {project.codes.map((entryCode) => (
                                    <div key={entryCode.code} className={styles["code-row"]}>
                                        <span className={styles["code-value"]}>{entryCode.code}</span>
                                        <span className={styles["code-meta"]}>
                                            {entryCode.used}/{entryCode.maxUses} usos
                                            {entryCode.expiresAt ? ` · expira ${new Date(entryCode.expiresAt).toLocaleDateString()}` : " · sin expiración"}
                                        </span>
                                        <button type="button" className={styles["copy-btn"]} onClick={() => handleCopyCode(entryCode.code)}>
                                            Copiar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles["hint"]}>Este proyecto aún no tiene códigos.</p>
                        )}
                        <div className={styles["generate-row"]}>
                            <input
                                className={styles["input"]}
                                type="number"
                                min="1"
                                max="100000"
                                value={codeMaxUses}
                                onChange={(event) => setCodeMaxUses(event.target.value)}
                                aria-label="Usos máximos del nuevo código"
                            />
                            <button type="button" className={styles["browse-btn"]} disabled={actionBusy} onClick={handleGenerateCode}>
                                Generar código
                            </button>
                        </div>
                    </section>

                    <section className={styles["section"]}>
                        <h2 className={styles["section-title"]}>Testers</h2>
                        {project.testers.length > 0 ? (
                            <div className={styles["tester-chips"]}>
                                {project.testers.map((tester) => (
                                    <span key={tester.id} className={styles["tester-chip"]}>
                                        {tester.displayName} ({tester.username})
                                        <button
                                            type="button"
                                            className={styles["chip-remove"]}
                                            disabled={actionBusy}
                                            onClick={() => handleRemoveTester(tester.id)}
                                            aria-label={`Quitar a ${tester.displayName}`}
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className={styles["hint"]}>Sin testers asignados.</p>
                        )}
                        <div className={styles["generate-row"]}>
                            <select
                                className={styles["input"]}
                                value={testerUserId}
                                onChange={(event) => setTesterUserId(event.target.value)}
                                aria-label="Elegir miembro activado"
                            >
                                <option value="">Elegir miembro activado…</option>
                                {testerCandidates.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.displayName} ({user.username}) · {user.role}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className={styles["browse-btn"]}
                                disabled={actionBusy || !testerUserId}
                                onClick={handleAddTester}
                            >
                                Asignar
                            </button>
                        </div>
                        <p className={styles["hint"]}>Solo miembros activados pueden ser testers.</p>
                    </section>
                </div>
            </div>
        );
    }

    if (view === "groups") {
        return (
            <div className={styles["creator"]}>
                <div className={styles["form-panel"]}>
                    <div className={styles["panel-head"]}>
                        <button className={styles["back-btn"]} onClick={() => { setView("list"); setError(""); }} aria-label="Volver">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5" />
                                <path d="M12 19l-7-7 7-7" />
                            </svg>
                            Volver
                        </button>
                        <h1 className={styles["title"]}>GRUPOS DE DESARROLLO</h1>
                    </div>
                    <p className={styles["subtitle"]}>Organizá tus estudios y productores.</p>
                    <div className={styles["state-block"]}>
                        <p className={styles["state-text"]}>Vista próximamente — aún no está diseñada.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles["creator"]}>
            {renderWelcomeBar()}

            <section className={styles["pcn-section"]}>
                <h2 className={styles["section-heading"]}>Tus requests</h2>
                {MOCK_REQUESTS.map((request) => (
                    <div key={request.id} className={styles["request-card"]}>
                        <div className={styles["request-icon"]}>
                            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                                <path d="M12 2 22 12 12 22 2 12Z" />
                            </svg>
                        </div>
                        <div className={styles["request-info"]}>
                            <p className={styles["request-title"]}>{request.title}</p>
                            <p className={styles["request-sub"]}>{request.project}</p>
                            <p className={styles["request-meta"]}>{request.meta}</p>
                        </div>
                    </div>
                ))}
            </section>

            <section className={styles["pcn-section"]}>
                <div className={styles["section-bar"]}>
                    <h2 className={styles["section-heading"]}>Tus mods</h2>
                    <button type="button" className={styles["new-btn"]} onClick={openCreate}>
                        + Nuevo proyecto
                    </button>
                </div>

                {error && <p className={styles["error"]}>{error}</p>}

                {projects.length > 0 ? (
                    <div className={styles["project-list"]}>
                        {projects.map((project) => (
                            <button key={project.id} type="button" className={styles["project-row"]} onClick={() => openDetail(project.id)}>
                                <div className={styles["row-cover"]}>
                                    <img src={project.cover || testCrop} alt="" onError={(event) => { event.currentTarget.src = testCrop; }} />
                                </div>
                                <div className={styles["row-info"]}>
                                    <p className={styles["row-name"]}>{project.name}</p>
                                    <p className={styles["row-meta"]}>
                                        {project.category} · v{project.version || "—"} · {project.codes.length} código(s) · {project.testers.length} tester(s)
                                    </p>
                                </div>
                                <span className={`${styles["badge"]} ${styles[`badge-${project.visibility}`]}`}>
                                    {VISIBILITY_OPTIONS.find((option) => option.value === project.visibility)?.label || project.visibility}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className={styles["empty-text"]}>Todavía no tenés proyectos. Creá uno con “+ Nuevo proyecto”.</p>
                )}
            </section>
        </div>
    );
}

export default Creator;
