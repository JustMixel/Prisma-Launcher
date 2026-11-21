import { useEffect } from "react";
import { useDownloads } from "../context/DownloadsContext.jsx";
import LibraryItem from "./LibraryItem.jsx";
import styles from "./Downloads.module.css";

function Downloads()
{
    const { downloads, clearCompleted, markDownloadsSeen } = useDownloads();

    useEffect(() => {
        markDownloadsSeen();
    }, [markDownloadsSeen]);

    const active = downloads.filter((item) => item.status !== "completed");
    const completed = downloads.filter((item) => item.status === "completed");

    return (
        <div className={styles["downloads"]}>
            <div className={styles["header"]}>
                {completed.length > 0 && (
                    <button className={styles["clear-btn"]} onClick={clearCompleted}>
                        Limpiar completadas
                    </button>
                )}
            </div>

            {downloads.length === 0 ? (
                <div className={styles["empty"]}>
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <path d="M7 10l5 5 5-5"/>
                        <path d="M12 15V3"/>
                    </svg>
                    <p>No hay descargas activas.</p>
                </div>
            ) : (
                <>
                    {active.length > 0 && (
                        <section className={styles["section"]}>
                            <h2 className={styles["section-title"]}>En progreso ({active.length})</h2>
                            {active.map((item) => <LibraryItem key={item.id} item={item} />)}
                        </section>
                    )}

                    {completed.length > 0 && (
                        <section className={styles["section"]}>
                            <h2 className={styles["section-title"]}>Completadas ({completed.length})</h2>
                            {completed.map((item) => <LibraryItem key={item.id} item={item} />)}
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

export default Downloads
