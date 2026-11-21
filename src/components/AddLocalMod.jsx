import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import testCrop from "../assets/modRender.png";
import CustomFileDialog, { IMAGE_FILTERS } from "./CustomFileDialog.jsx";
import styles from "./AddLocalMod.module.css";

const CATEGORIES = ["Total Conversion", "Vehículos", "Mapas", "Armas", "Scripts", "Texturas", "Sonidos", "Otro"];

function AddLocalMod({ onBack, onSave })
{
    const [dialogOpen, setDialogOpen] = useState(false);
    const [coverDialogOpen, setCoverDialogOpen] = useState(false);
    const [coverDataUrl, setCoverDataUrl] = useState("");
    const [coverPath, setCoverPath] = useState("");
    const [form, setForm] = useState({
        name: "",
        description: "",
        category: "Total Conversion",
        cover: "",
        creator: "",
        executablePath: "",
        tags: ""
    });

    function handleChange(event)
    {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    }

    function handleSelectExecutable()
    {
        setDialogOpen(true);
    }

    async function handleSelectCover(path)
    {
        try {
            const dataUrl = await invoke("read_file_as_data_url", { path });
            setCoverDataUrl(dataUrl);
            setCoverPath(path);
        } catch (error) {
            console.error("No se pudo cargar la portada:", error);
        } finally {
            setCoverDialogOpen(false);
        }
    }

    function handleClearCover()
    {
        setCoverDataUrl("");
        setCoverPath("");
    }

    function handleSubmit(event)
    {
        event.preventDefault();
        if (!form.executablePath) {
            return;
        }
        onSave({
            id: `local-${Date.now()}`,
            name: form.name,
            description: form.description,
            category: form.category,
            cover: coverDataUrl || form.cover.trim() || null,
            publisher: form.creator.trim() || null,
            producer: form.creator.trim() || null,
            executablePath: form.executablePath.trim() || null,
            version: null,
            downloads: 0,
            rating: 0,
            tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
            source: "local",
            installedAt: new Date().toISOString()
        });
    }

    return (
        <div className={styles["add-local"]}>
            <button className={styles["back-btn"]} onClick={onBack} aria-label="Volver">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                </svg>
            </button>

            <div className={styles["form-panel"]}>
                <h1 className={styles["title"]}>AGREGAR MOD LOCAL</h1>
                <p className={styles["subtitle"]}>Registra un mod que ya tienes en tu computadora.</p>

                <form onSubmit={handleSubmit} className={styles["form"]}>
                    <div className={styles["preview-row"]}>
                        <div className={styles["preview-frame"]}>
                            <img src={coverDataUrl || form.cover.trim() || testCrop} alt="Vista previa" onError={(event) => { event.currentTarget.src = testCrop; }} />
                        </div>
                        <div className={styles["preview-info"]}>
                            <p className={styles["preview-name"]}>{form.name || "Nombre del mod"}</p>
                            <p className={styles["preview-creator"]}>{form.creator || "Desarrollador"}</p>
                        </div>
                    </div>

                    <label className={styles["label"]}>
                        Nombre del mod
                        <input className={styles["input"]} type="text" name="name" value={form.name} onChange={handleChange} required />
                    </label>

                    <label className={styles["label"]}>
                        Descripción
                        <textarea className={styles["textarea"]} name="description" value={form.description} onChange={handleChange} required />
                    </label>

                    <label className={styles["label"]}>
                        Categoría
                        <select className={styles["input"]} name="category" value={form.category} onChange={handleChange}>
                            {CATEGORIES.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </label>

                    <div className={styles["label"]}>
                        Portada (URL o archivo local)
                        <div className={styles["cover-row"]}>
                            <input
                                className={styles["input"]}
                                type="url"
                                name="cover"
                                value={form.cover}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                            <button type="button" className={styles["cover-btn"]} onClick={() => setCoverDialogOpen(true)}>
                                Examinar
                            </button>
                            {coverPath && (
                                <button type="button" className={styles["cover-clear"]} onClick={handleClearCover} title="Quitar portada local">
                                    ✕
                                </button>
                            )}
                        </div>
                        {coverPath && <p className={styles["cover-path"]}>{coverPath}</p>}
                    </div>

                    <label className={styles["label"]}>
                        Grupo de desarrollo o Productor
                        <input className={styles["input"]} type="text" name="creator" value={form.creator} onChange={handleChange} />
                    </label>

                    <div className={styles["label"]}>
                        Ruta del ejecutable del mod
                        <div className={styles["file-row"]}>
                            <input
                                className={styles["input"]}
                                type="text"
                                value={form.executablePath}
                                placeholder="Selecciona el archivo..."
                                readOnly
                            />
                            <button
                                type="button"
                                className={styles["browse-btn"]}
                                onClick={handleSelectExecutable}
                            >
                                Explorar
                            </button>
                        </div>
                    </div>

                    <label className={styles["label"]}>
                        Tags (separados por coma)
                        <input className={styles["input"]} type="text" name="tags" value={form.tags} onChange={handleChange} placeholder="GTA SA, Total Conversion" />
                    </label>

                    <div className={styles["actions"]}>
                        <button type="button" className={styles["cancel-btn"]} onClick={onBack}>Cancelar</button>
                        <button type="submit" className={styles["submit-btn"]}>Agregar a la biblioteca</button>
                    </div>
                </form>
            </div>

            {dialogOpen && (
                <CustomFileDialog
                    title="Selecciona el ejecutable del mod"
                    onSelect={(path) => {
                        setForm((previous) => ({ ...previous, executablePath: path }));
                        setDialogOpen(false);
                    }}
                    onCancel={() => setDialogOpen(false)}
                />
            )}

            {coverDialogOpen && (
                <CustomFileDialog
                    title="Selecciona la portada del mod"
                    filters={IMAGE_FILTERS}
                    onSelect={handleSelectCover}
                    onCancel={() => setCoverDialogOpen(false)}
                />
            )}
        </div>
    );
}

export default AddLocalMod
