import { useState } from "react";
import testCrop from "../assets/modRender.png";
import styles from "./RedeemProject.module.css";

const ERROR_MESSAGES = {
    invalid: "Código inválido.",
    inactive: "Este código está desactivado.",
    expired: "Este código expiró.",
    limit: "Este código alcanzó el límite de usos.",
    missing_code: "Ingresá un código.",
    missing_fields: "Datos incompletos."
};

function RedeemProject({ onBack, onRedeemed })
{
    const [code, setCode] = useState("");
    const [status, setStatus] = useState("idle");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [activating, setActivating] = useState(false);

    async function handleSearch(event)
    {
        event.preventDefault();
        if (status === "loading" || !code.trim()) {
            return;
        }

        setStatus("loading");
        setError("");
        setResult(null);
        try {
            const response = await fetch("http://localhost:3000/api/codes/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(ERROR_MESSAGES[data.error] || "No se pudo validar el código.");
            }
            setResult(data);
            setStatus("found");
        } catch (searchError) {
            setError(String(searchError.message || searchError));
            setStatus("error");
        }
    }

    function handleActivate()
    {
        if (!result?.project || activating) {
            return;
        }

        const project = result.project;
        setActivating(true);
        onRedeemed({
            id: project.id,
            name: project.name,
            description: project.description || "",
            category: project.category || "Mod",
            cover: project.cover || null,
            publisher: project.creatorName || null,
            producer: project.creatorName || null,
            executablePath: project.executablePath || null,
            link: project.link || null,
            version: project.version || null,
            downloads: 0,
            rating: 0,
            tags: Array.isArray(project.tags) ? project.tags : [],
            source: "code",
            installedAt: new Date().toISOString()
        });
    }

    const project = result?.project;

    return (
        <div className={styles["redeem"]}>
            <button className={styles["back-btn"]} onClick={onBack} aria-label="Volver">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                </svg>
            </button>

            <div className={styles["form-panel"]}>
                <h1 className={styles["title"]}>ACTIVAR PROYECTO</h1>
                <p className={styles["subtitle"]}>Ingresá un código de activación para desbloquear un proyecto oculto.</p>

                <form onSubmit={handleSearch} className={styles["form"]}>
                    <label className={styles["label"]}>
                        Código de activación
                        <input
                            className={styles["input"]}
                            type="text"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            placeholder="Ej: PRISMA-TEST"
                            autoFocus
                        />
                    </label>

                    {error && <p className={styles["error"]}>{error}</p>}

                    {project && (
                        <div className={styles["preview-row"]}>
                            <div className={styles["preview-frame"]}>
                                <img src={project.cover || testCrop} alt={project.name} onError={(event) => { event.currentTarget.src = testCrop; }} />
                            </div>
                            <div className={styles["preview-info"]}>
                                <p className={styles["preview-name"]}>{project.name}</p>
                                <p className={styles["preview-creator"]}>{project.creatorName || "Creador desconocido"}</p>
                                <p className={styles["preview-desc"]}>{project.description}</p>
                                <p className={styles["preview-meta"]}>
                                    {project.version ? `Versión ${project.version}` : "Sin versión"}
                                    {" · "}
                                    {result.remainingUses} usos restantes
                                </p>
                            </div>
                        </div>
                    )}

                    <div className={styles["actions"]}>
                        <button type="button" className={styles["cancel-btn"]} onClick={onBack}>Cancelar</button>
                        {project ? (
                            <button type="button" className={styles["submit-btn"]} onClick={handleActivate} disabled={activating}>
                                {activating ? "Activando…" : "Activar proyecto"}
                            </button>
                        ) : (
                            <button type="submit" className={styles["submit-btn"]} disabled={status === "loading" || !code.trim()}>
                                {status === "loading" ? "Buscando…" : "Buscar"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RedeemProject;
