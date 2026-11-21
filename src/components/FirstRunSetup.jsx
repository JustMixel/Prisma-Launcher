import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import styles from "./FirstRunSetup.module.css";
import { isValidName } from "../utils/name.js";

const PLACEHOLDERS = [
    "Que tal, me dices tu nombre?",
    "Voy a necesitar tu nombre...",
    "Creo que voy a necesitar tu nombre para esto, hermano.",
    "Me das tu nombre?",
    "Hola, nombre, si.",
    "La gente pide a gritos tu nombre...",
    "Vamos, dame tu nombre y terminemos esto de una vez."
];

function FirstRunSetup({ onComplete })
{
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

    const valid = isValidName(name);

    async function handleSubmit(event)
    {
        event.preventDefault();
        if (!valid || saving) {
            return;
        }

        setSaving(true);
        setError("");
        try {
            await invoke("save_user_name", { name: name.trim() });
            await invoke("complete_setup");
            if (onComplete) {
                onComplete();
            }
        } catch (saveError) {
            setError(String(saveError));
            setSaving(false);
        }
    }

    function handleDragStart()
    {
        invoke("start_window_drag");
    }

    async function handleClose()
    {
        try {
            await invoke("exit_app");
        } catch {
            window.close();
        }
    }

    return (
        <div className={styles["overlay"]}>
            <div className={styles["panel"]} role="dialog" aria-modal="true">
                <div className={styles["drag-bar"]} onMouseDown={handleDragStart}></div>
                <button className={styles["close-btn"]} onClick={handleClose} aria-label="Cerrar">✕</button>

                <form className={styles["form"]} onSubmit={handleSubmit}>
                    <div className={styles["brand"]}>
                        <h1>Prisma Launcher</h1>
                    </div>

                    <input
                        className={styles["input"]}
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={placeholder}
                        maxLength={40}
                        autoFocus
                    />

                    {error && <p className={styles["error"]}>{error}</p>}

                    <button className={styles["ok-btn"]} type="submit" disabled={!valid || saving}>
                        Ok
                    </button>
                </form>
            </div>
        </div>
    );
}

export default FirstRunSetup;
