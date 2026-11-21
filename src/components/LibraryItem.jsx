import testCrop from "../assets/modRender.png";
import defaultStudioLogo from "../assets/default-studio-logo.svg";
import { useDownloads } from "../context/DownloadsContext.jsx";
import styles from "./LibraryItem.module.css";

function LibraryItem({ item, compact = false })
{
    const { pauseDownload, resumeDownload, cancelDownload, formatEta } = useDownloads();

    const coverSource = item.libraryItem.cover || testCrop;
    const logoSource = item.libraryItem.devgroupLogo || item.libraryItem.producerLogo || defaultStudioLogo;
    const creator = item.libraryItem.publisher || item.libraryItem.producer || "Desconocido";
    const isDownloading = item.status === "downloading";
    const isPaused = item.status === "paused";
    const isCompleted = item.status === "completed";
    const percent = Math.round(item.progress);

    return (
        <div className={`${styles["item"]} ${compact ? styles["compact"] : ""}`}>
            <div className={styles["cover-frame"]}>
                <img src={coverSource} alt={item.libraryItem.name} />
            </div>

            <div className={styles["info"]}>
                <div className={styles["top-row"]}>
                    <div className={styles["identity"]}>
                        <img className={styles["creator-logo"]} src={logoSource} alt="" onError={(e) => { e.currentTarget.src = defaultStudioLogo; }} />
                        <div className={styles["text"]}>
                            <h3 className={styles["name"]}>{item.libraryItem.name}</h3>
                            <p className={styles["creator"]}>{creator}</p>
                        </div>
                    </div>

                    <div className={styles["controls"]}>
                        {isDownloading && (
                            <button className={styles["control-btn"]} onClick={() => pauseDownload(item.id)} title="Pausar">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
                            </button>
                        )}
                        {isPaused && (
                            <button className={styles["control-btn"]} onClick={() => resumeDownload(item.id)} title="Reanudar">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="7,5 19,12 7,19"/></svg>
                            </button>
                        )}
                        <button className={`${styles["control-btn"]} ${styles["cancel"]}`} onClick={() => cancelDownload(item.id)} title="Cancelar">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
                        </button>
                    </div>
                </div>

                <div className={styles["progress-area"]}>
                    <div className={styles["progress-track"]}>
                        <div
                            className={`${styles["progress-fill"]} ${isCompleted ? styles["fill-completed"] : ""} ${isPaused ? styles["fill-paused"] : ""}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <div className={styles["progress-meta"]}>
                        <span className={styles["percent"]}>{percent}%</span>
                        {isDownloading && <span className={styles["eta"]}>ETA {formatEta(item.etaSeconds)}</span>}
                        {isPaused && <span className={styles["eta"]}>En pausa</span>}
                        {isCompleted && <span className={styles["eta"]}>Completado</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LibraryItem
