import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import LibraryCard from "./LibraryCard.jsx";
import ModSearchBar from "./ModSearchBar.jsx";
import AddLocalMod from "./AddLocalMod.jsx";
import RedeemProject from "./RedeemProject.jsx";
import ModPlayView from "./ModPlayView.jsx";
import { useDownloads } from "../context/DownloadsContext.jsx";
import { useModSearch } from "../hooks/useModSearch.js";
import { getSession } from "../utils/session.js";
import { getAvailableUpdate } from "../utils/update.js";
import styles from "./Library.module.css";

function Library()
{
    const { library, addToLibrary } = useDownloads();
    const [showAddForm, setShowAddForm] = useState(false);
    const [showRedeem, setShowRedeem] = useState(false);
    const [serverUpdates, setServerUpdates] = useState({});
    const [installedMods, setInstalledMods] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const session = getSession();

    useEffect(() => {
        let cancelled = false;

        async function fetchUpdates() {
            try {
                const response = await fetch("http://localhost:3000/api/mods");
                if (!response.ok) {
                    throw new Error("Servidor no disponible");
                }
                const data = await response.json();
                if (cancelled || !Array.isArray(data)) {
                    return;
                }
                setServerUpdates(Object.fromEntries(
                    data.filter((mod) => mod.m_update).map((mod) => [mod.ID, mod.m_update])
                ));
            } catch {
                if (!cancelled) {
                    setServerUpdates({});
                }
            }
        }

        fetchUpdates();
        const intervalId = setInterval(fetchUpdates, 60000);
        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        invoke("get_installed_mods")
            .then((mods) => {
                if (!cancelled) {
                    setInstalledMods(Array.isArray(mods) ? mods : []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setInstalledMods([]);
                }
            });

        return () => { cancelled = true; };
    }, [library.length]);

    const mergedLibrary = useMemo(() => {
        const byId = new Map();
        library.forEach((item) => byId.set(String(item.id), item));
        installedMods.forEach((item) => {
            const key = String(item.id);
            byId.set(key, { ...(byId.get(key) || {}), ...item });
        });
        return Array.from(byId.values());
    }, [library, installedMods]);

    const search = useModSearch(mergedLibrary, {
        getName: (item) => item.name,
        getSearchFields: (item, mode) => mode === "developer"
            ? [item.publisher, item.producer]
            : [item.name, item.publisher, item.producer],
        getTags: (item) => item.tags,
        getDownloads: (item) => item.downloads,
        getRating: (item) => item.rating,
        getDate: (item) => item.installedAt
    });

    if (showAddForm) {
        return (
            <AddLocalMod
                onBack={() => setShowAddForm(false)}
                onSave={(item) => {
                    addToLibrary({ libraryItem: item });
                    setShowAddForm(false);
                }}
            />
        );
    }

    if (showRedeem) {
        return (
            <RedeemProject
                onBack={() => setShowRedeem(false)}
                onRedeemed={(item) => {
                    addToLibrary({ libraryItem: item });
                    setShowRedeem(false);
                }}
            />
        );
    }

    const { filteredItems, tokens, trimmedSearch } = search;
    const suggestions = [...new Set(mergedLibrary.flatMap((item) => [item.name, item.publisher, item.producer]).filter(Boolean))];
    const selectedMod = mergedLibrary.find((item) => String(item.id) === String(selectedId)) || null;
    const selectedUpdate = selectedMod ? getAvailableUpdate(serverUpdates[selectedMod.id], selectedMod.version) : null;

    if (selectedMod) {
        return <ModPlayView mod={selectedMod} update={selectedUpdate} onBack={() => setSelectedId(null)} />;
    }

    return (
        <div className={styles["library"]}>
            <div className={styles["search-row"]}>
                <ModSearchBar
                    search={search}
                    suggestionsSource={suggestions}
                    onClearSearch={() => {}}
                />
                <div className={styles["actions-row"]}>
                    {session?.role === "tester" && (
                        <button className={styles["activate-btn"]} onClick={() => setShowRedeem(true)}>
                            Activar Proyecto
                        </button>
                    )}
                    <button className={styles["add-btn"]} onClick={() => setShowAddForm(true)}>
                        + Agregar mod
                    </button>
                </div>
            </div>

            {filteredItems.length > 0 ? (
                <div className={styles["cards"]}>
                    {filteredItems.map((item) => (
                        <LibraryCard
                            key={item.id}
                            item={item}
                            update={getAvailableUpdate(serverUpdates[item.id], item.version)}
                            tokens={tokens}
                            onClick={() => setSelectedId(item.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles["state-block"]}>
                    <p className={styles["state-text"]}>
                        {trimmedSearch
                            ? `Sin resultados para «${trimmedSearch}»`
                            : "Tu biblioteca está vacía. Descarga mods o agrega uno localmente."}
                    </p>
                </div>
            )}
        </div>
    );
}

export default Library
