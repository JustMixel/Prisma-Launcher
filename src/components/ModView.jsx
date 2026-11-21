import { useEffect, useState } from "react";
import testCrop from "../assets/modRender.png";
import defaultStudioLogo from "../assets/default-studio-logo.svg";
import RatingStars from "./RatingStars.jsx";
import { useDownloads } from "../context/DownloadsContext.jsx";
import { getAvailableUpdate, getUpdateLabel } from "../utils/update.js";
import styles from "./ModView.module.css";

const TABS = ["Info", "Videos", "Updates", "Reviews"];

function DownloadBtn({ download, isInLibrary, onStart, onPause, onResume, onCancel })
{
    if (!download && !isInLibrary) {
        return (
            <button className={styles["download-btn"]} onClick={onStart} aria-label="Descargar">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                </svg>
                <span>Descargar</span>
            </button>
        );
    }

    if (isInLibrary && (!download || download.status === "completed")) {
        return (
            <button className={styles["download-btn-installed"]} disabled>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>En tu biblioteca</span>
            </button>
        );
    }

    const percent = Math.round(download.progress);

    return (
        <div className={styles["download-controls"]}>
            <button className={styles["download-btn-active"]} onClick={download.status === "downloading" ? onPause : onResume}>
                <span>
                    {download.status === "downloading"
                        ? `Descargando... ${percent}%`
                        : `Reanudar... ${percent}%`}
                </span>
            </button>
            <button className={styles["download-cancel-btn"]} onClick={onCancel} title="Cancelar descarga">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
            </button>
        </div>
    );
}

function ModView({ mod, onBack })
{
    const [activeTab, setActiveTab] = useState("Info");
    const [versions, setVersions] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userRating, setUserRating] = useState(0);

    const { library, getDownload, isInLibrary, startDownload, pauseDownload, resumeDownload, cancelDownload } = useDownloads();

    const download = getDownload(mod.ID);
    const inLibrary = isInLibrary(mod.ID);

    const coverSource = mod.m_cover || testCrop;
    const releaseYear = mod.m_releasedate ? new Date(mod.m_releasedate).getFullYear() : null;
    const installedItem = library.find((item) => String(item.id) === String(mod.ID));
    const updateLabel = getUpdateLabel(getAvailableUpdate(mod.m_update, installedItem?.version));

    useEffect(() => {
        if (!mod.ID) {
            return;
        }

        let cancelled = false;

        async function fetchVersions() {
            try {
                const res = await fetch(`http://localhost:3000/api/mods/${mod.ID}/versions`);
                const data = await res.json();
                if (!cancelled) {
                    setVersions(Array.isArray(data.items) ? data.items : []);
                }
            } catch (error) {
                console.error(error);
            }
        }

        fetchVersions();

        return () => {
            cancelled = true;
        };
    }, [mod.ID]);

    return (
        <div className={styles["modview"]}>
            <button className={styles["back-btn"]} onClick={onBack} aria-label="Volver">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                </svg>
            </button>

            <div className={styles["left-column"]}>
                <div className={styles["banner"]} style={{ backgroundImage: `url("${coverSource}")` }}></div>

                <div className={styles["title-band"]}>
                    <div className={styles["title-row"]}>
                        <h1 className={styles["mod-title"]}>{mod.m_name}</h1>
                        {updateLabel && <span className={styles["update-badge"]}>{updateLabel}</span>}
                    </div>
                    {releaseYear && <p className={styles["mod-year"]}>({releaseYear})</p>}
                </div>

                <div className={styles["info-area"]}>
                    <div className={styles["tabs"]}>
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                className={`${styles["tab"]} ${activeTab === tab ? styles["tab-active"] : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className={styles["tab-content"]}>
                        {activeTab === "Info" && (
                            <div className={styles["info-panel"]}>
                                <h2 className={styles["section-title"]}>MOD INFORMATION</h2>
                                <p className={styles["description"]}>{mod.m_desc || "No description available."}</p>
                                <dl className={styles["stats"]}>
                                    <div><dt>Downloads</dt><dd>{mod.m_downloads ?? 0}</dd></div>
                                    <div><dt>Rating</dt><dd>{mod.m_ratingAverage ?? 0} ({mod.m_ratingCount ?? 0})</dd></div>
                                    <div><dt>Released</dt><dd>{mod.m_releasedate ? new Date(mod.m_releasedate).toLocaleDateString() : "N/A"}</dd></div>
                                    <div><dt>Producer</dt><dd>{mod.m_producername || "N/A"}</dd></div>
                                </dl>
                                <div className={styles["rate-section"]}>
                                    <p>Tu calificación:</p>
                                    <RatingStars rating={userRating} onRate={setUserRating} interactive={true}/>
                                </div>
                                <div className={styles["info-btn"]}>
                                    <DownloadBtn
                                        download={download}
                                        isInLibrary={inLibrary}
                                        onStart={() => startDownload(mod)}
                                        onPause={() => pauseDownload(mod.ID)}
                                        onResume={() => resumeDownload(mod.ID)}
                                        onCancel={() => cancelDownload(mod.ID)}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "Videos" && (
                            <div className={styles["empty-panel"]}>
                                <h2 className={styles["section-title"]}>VIDEOS</h2>
                                <p className={styles["empty-text"]}>No videos yet.</p>
                            </div>
                        )}

                        {activeTab === "Updates" && (
                            <div className={styles["info-panel"]}>
                                <h2 className={styles["section-title"]}>UPDATES</h2>
                                {versions.length === 0 ? (
                                    <p className={styles["empty-text"]}>No updates yet.</p>
                                ) : (
                                    <ul className={styles["version-list"]}>
                                        {versions.map((version) => (
                                            <li key={version.id} className={styles["version-item"]}>
                                                <div className={styles["version-head"]}>
                                                    <div className={styles["version-head-left"]}>
                                                        <strong>v{version.version}</strong>
                                                        {version.name && <span className={styles["version-name"]}>{version.name}</span>}
                                                        {version.is_update && <span className={styles["version-new"]}>Nueva</span>}
                                                    </div>
                                                    <span>{version.released_at ? new Date(version.released_at).toLocaleDateString() : "TBA"}</span>
                                                </div>
                                                <p>{version.changelog}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {activeTab === "Reviews" && (
                            <div className={styles["empty-panel"]}>
                                <h2 className={styles["section-title"]}>REVIEWS</h2>
                                <p className={styles["empty-text"]}>No reviews yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                className={`${styles["sidebar-toggle"]} ${sidebarOpen ? styles["sidebar-toggle-open"] : ""}`}
                onClick={() => setSidebarOpen(prev => !prev)}
                aria-label={sidebarOpen ? "Ocultar desarrollador" : "Mostrar desarrollador"}
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {sidebarOpen ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
                </svg>
            </button>

            <aside className={`${styles["right-column"]} ${sidebarOpen ? styles["right-column-open"] : ""}`}>
                <img
                    className={styles["dev-logo"]}
                    src={mod.m_devgrouplogo || defaultStudioLogo}
                    alt={`${mod.m_devgroupname || "Developer"} logo`}
                    onError={(event) => {
                        event.currentTarget.src = defaultStudioLogo;
                    }}
                />
                <p className={styles["dev-name"]}>{mod.m_devgroupname || "Unknown developer"}</p>
            </aside>
        </div>
    );
}

export default ModView
