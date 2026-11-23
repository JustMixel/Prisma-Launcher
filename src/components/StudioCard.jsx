import testCrop from "../assets/modRender.png"
import defaultStudioLogo from "../assets/default-studio-logo.svg";
import Highlight from "./Highlight.jsx";
import styles from "./StudioCard.module.css";

function StudioCard({ name, logo, cover, accentcolor, modCount, onClick, tokens = [] })
{
    const coverSource = cover || testCrop;

    return (
        <div className={styles["studio-card"]} style={accentcolor ? { "--accent": accentcolor } : undefined} onClick={onClick}>
            <div className={styles["cover-layer"]} style={{ backgroundImage: `url("${coverSource}")` }}></div>
            <div className={styles["gradient-layer"]}></div>
            <div className={styles["content-layer"]}>
                <div className={styles["logo-frame"]}>
                    <img
                        src={logo || defaultStudioLogo}
                        alt={`${name} logo`}
                        onError={(event) => {
                            event.currentTarget.src = defaultStudioLogo;
                        }}
                    />
                </div>
                <h3 className={styles["studio-name"]}><Highlight text={name} tokens={tokens} /></h3>
                <p className={styles["studio-stat"]}>{modCount} mods publicados.</p>
            </div>
        </div>
    );
}

export default StudioCard
