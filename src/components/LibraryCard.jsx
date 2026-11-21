import testCrop from "../assets/modRender.png";
import { getUpdateLabel } from "../utils/update.js";
import styles from "./LibraryCard.module.css";

function LibraryCard({ item, update, tokens = [], onClick })
{
    const coverSource = item.cover || testCrop;
    const creator = item.publisher || item.producer || "Desconocido";
    const updateLabel = getUpdateLabel(update);

    return (
        <div className={styles["our-card"]} onClick={onClick}>
            <div className={styles["f-layer"]}>
                <img src={coverSource} alt={`${item.name} cover`} />
            </div>
            <div className={styles["s-layer"]}></div>
            {updateLabel && <div className={styles["update-badge"]}>{updateLabel}</div>}
            <div className={styles["t-layer"]}>
                <h2 className={styles["mname"]}>{item.name}</h2>
                <p className={styles["creator"]}>{creator}</p>
                <div className={styles["stats"]}>
                    <span className={styles["stat"]}>★ {item.rating ?? 0}</span>
                    <span className={styles["stat"]}>v{item.version || "1.0.0"}</span>
                </div>
            </div>
        </div>
    );
}

export default LibraryCard
