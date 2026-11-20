import { useEffect, useRef, useState } from "react";
import testCrop from "../assets/modRender.png"
import Highlight from "./Highlight.jsx";
import styles from "./Card.module.css";

function formatCountdown(releasedate) {
    if (!releasedate) {
        return null;
    }

    const target = new Date(releasedate).getTime();
    if (!Number.isFinite(target)) {
        return null;
    }

    const diff = target - Date.now();
    if (diff <= 0) {
        return null;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

function Card({title, cover, publisher, producer, releasedate, accentcolor, onClick, tokens = []})
{
    const [badgeGlow, setBadgeGlow] = useState(false);
    const [countdown, setCountdown] = useState(() => formatCountdown(releasedate));
    const previousCountdown = useRef(countdown);
    const coverSource = cover || testCrop;

    useEffect(() => {
        const update = () => setCountdown(formatCountdown(releasedate));
        update();
        const intervalId = setInterval(update, 30000);
        return () => clearInterval(intervalId);
    }, [releasedate]);

    useEffect(() => {
        if (previousCountdown.current === countdown) {
            return;
        }

        previousCountdown.current = countdown;
        setBadgeGlow(false);

        const frame = requestAnimationFrame(() => {
            setBadgeGlow(true);
        });

        const timeout = setTimeout(() => {
            setBadgeGlow(false);
        }, 760);

        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timeout);
        };
    }, [countdown]);

    return(
    <>
        <div className={styles["our-card"]} style={{ "--accent-color": accentcolor || "#3a2b25" }} onClick={onClick}>
            <div className={styles["f-layer"]}>
                <img src={coverSource} alt={`${title} cover`} />
            </div>
            <div className={styles["s-layer"]}>

            </div>
            {countdown && (
                <div className={`${styles["release-badge"]} ${badgeGlow ? styles["release-badge-glow"] : ""}`}>
                    <span className={styles["release-badge-time"]}>{countdown}</span>
                </div>
            )}
            <div className={styles["t-layer"]}>
                <h2 className={styles["mname"]}><Highlight text={title} tokens={tokens} /></h2>
                <p><Highlight text={producer} tokens={tokens} /></p>
            </div>
        </div>
    </>
  );
}

export default Card
