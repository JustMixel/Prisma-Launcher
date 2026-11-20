import { useEffect, useRef, useState } from "react";
import Card from "./Card.jsx";
import StudioCard from "./StudioCard.jsx";
import ModView from "./ModView.jsx";
import { matchesTokens, normalizeText, tokenize } from "../utils/search.js";
import styles from "./Store.module.css";
import funnel from "../assets/funnel.png";

const SORT_OPTIONS = [
    { value: "alpha", label: "Alfabético" },
    { value: "downloads", label: "Descargas" },
    { value: "recent", label: "Recientes" }
];

const SEARCH_OPTIONS = [
    { value: "name", label: "Nombre" },
    { value: "developer", label: "Desarrollador" }
];

const RECENT_KEY = "prisma-recent-searches";
const EMPTY_FILTERS = { minDownloads: "", minRating: "", dateFrom: "", tags: [], onlyInstalled: false };

function loadRecentSearches() {
    try {
        const parsed = JSON.parse(localStorage.getItem(RECENT_KEY));
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 8) : [];
    } catch {
        return [];
    }
}

function Store()
{
    const [mods, setMods] = useState([]);
    const [status, setStatus] = useState("loading");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchMode, setSearchMode] = useState("name");
    const [groupSort, setGroupSort] = useState("alpha");
    const [isSearchMenuOpen, setSearchMenuOpen] = useState(false);
    const [selectedMod, setSelectedMod] = useState(null);
    const [viewingEntity, setViewingEntity] = useState(null);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [recentSearches, setRecentSearches] = useState(loadRecentSearches);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);
    const inputRef = useRef(null);

    useEffect(() =>
        {
            let cancelled = false;

            async function fetchMods()
                {
                    try {
                        const res = await fetch('http://localhost:3000/api/mods');
                        if (!res.ok) {
                            throw new Error(`HTTP ${res.status}`);
                        }
                        const data = await res.json();
                        if (!cancelled) {
                            setMods(Array.isArray(data) ? data : []);
                            setStatus("ready");
                        }
                    } catch (error) {
                        console.error(error);
                        if (!cancelled) {
                            setStatus("error");
                        }
                    }
                }
            fetchMods();

            return () => {
                cancelled = true;
            };
        }, []);

    const tokens = tokenize(searchTerm);
    const trimmedSearch = searchTerm.trim();

    const availableTags = [...new Set(mods.flatMap((mod) => mod.m_tags || []))].sort();

    const filtersActive =
        filters.minDownloads !== "" ||
        filters.minRating !== "" ||
        filters.dateFrom !== "" ||
        filters.tags.length > 0;

    const passesFilters = (mod) => {
        const downloads = mod.m_downloads ?? 0;
        if (filters.minDownloads !== "" && downloads < Number(filters.minDownloads)) {
            return false;
        }
        if (filters.minRating !== "" && (mod.m_ratingAverage ?? 0) < Number(filters.minRating)) {
            return false;
        }
        if (filters.dateFrom) {
            if (!mod.m_releasedate || new Date(mod.m_releasedate) < new Date(filters.dateFrom)) {
                return false;
            }
        }
        if (filters.tags.length > 0) {
            const modTags = mod.m_tags || [];
            if (!filters.tags.some((tag) => modTags.includes(tag))) {
                return false;
            }
        }
        return true;
    };

    const matchesSearch = (mod) => {
        if (tokens.length === 0) {
            return true;
        }

        const fields = searchMode === "name"
            ? [mod.m_name, mod.m_producername]
            : [mod.m_devgroupname, mod.m_producername, mod.m_devgroupid, mod.m_producerid];

        return matchesTokens(fields.filter((field) => field !== null && field !== undefined && field !== "").join(" "), tokens);
    };

    const sortMods = (list) => [...list].sort((a, b) => {
        if (groupSort === "downloads") {
            return (b.m_downloads ?? 0) - (a.m_downloads ?? 0);
        }
        if (groupSort === "recent") {
            const aTime = a.m_releasedate ? new Date(a.m_releasedate).getTime() : 0;
            const bTime = b.m_releasedate ? new Date(b.m_releasedate).getTime() : 0;
            return bTime - aTime;
        }
        return normalizeText(a.m_name).localeCompare(normalizeText(b.m_name));
    });

    const filteredMods = sortMods(mods.filter((mod) => matchesSearch(mod) && passesFilters(mod)));

    const studiosById = mods.reduce((accumulator, mod) => {
        if (mod.m_devgroupid === null || mod.m_devgroupid === undefined) {
            return accumulator;
        }

        if (!accumulator[mod.m_devgroupid]) {
            accumulator[mod.m_devgroupid] = {
                id: mod.m_devgroupid,
                name: mod.m_devgroupname || `Studio ${mod.m_devgroupid}`,
                logo: mod.m_devgrouplogo || null,
                cover: mod.m_cover,
                accentcolor: mod.m_accentcolor,
                modCount: 0,
                downloads: 0,
                latest: 0
            };
        }

        accumulator[mod.m_devgroupid].modCount += 1;
        accumulator[mod.m_devgroupid].downloads += mod.m_downloads || 0;
        if (mod.m_releasedate) {
            accumulator[mod.m_devgroupid].latest = Math.max(
                accumulator[mod.m_devgroupid].latest,
                new Date(mod.m_releasedate).getTime()
            );
        }
        return accumulator;
    }, {});

    const visibleStudios = Object.values(studiosById)
        .filter((studio) => !tokens.length || matchesTokens(studio.name, tokens))
        .sort((a, b) => {
            if (groupSort === "downloads") {
                return b.downloads - a.downloads;
            }
            if (groupSort === "recent") {
                return b.latest - a.latest;
            }
            return normalizeText(a.name).localeCompare(normalizeText(b.name));
        });

    const producersById = mods.reduce((accumulator, mod) => {
        if (mod.m_producerid === null || mod.m_producerid === undefined) {
            return accumulator;
        }

        if (!accumulator[mod.m_producerid]) {
            accumulator[mod.m_producerid] = {
                id: mod.m_producerid,
                name: mod.m_producername || `Producer ${mod.m_producerid}`,
                logo: mod.m_producerlogo || null,
                cover: mod.m_cover,
                accentcolor: mod.m_accentcolor,
                modCount: 0,
                downloads: 0,
                latest: 0
            };
        }

        accumulator[mod.m_producerid].modCount += 1;
        accumulator[mod.m_producerid].downloads += mod.m_downloads || 0;
        if (mod.m_releasedate) {
            accumulator[mod.m_producerid].latest = Math.max(
                accumulator[mod.m_producerid].latest,
                new Date(mod.m_releasedate).getTime()
            );
        }
        return accumulator;
    }, {});

    const visibleProducers = Object.values(producersById)
        .filter((producer) => !tokens.length || matchesTokens(producer.name, tokens))
        .sort((a, b) => {
            if (groupSort === "downloads") {
                return b.downloads - a.downloads;
            }
            if (groupSort === "recent") {
                return b.latest - a.latest;
            }
            return normalizeText(a.name).localeCompare(normalizeText(b.name));
        });

    const entityMods = viewingEntity
        ? sortMods(mods.filter((mod) => {
            const belongs = viewingEntity.kind === "studio"
                ? mod.m_devgroupid === viewingEntity.id
                : mod.m_producerid === viewingEntity.id;
            return belongs && passesFilters(mod);
        }))
        : [];

    const showProfiles = searchMode === "developer" && !viewingEntity;

    const suggestionSource = searchMode === "developer"
        ? [...new Set(mods.flatMap((mod) => [mod.m_devgroupname, mod.m_producername]).filter(Boolean))]
        : mods.map((mod) => mod.m_name).filter(Boolean);

    const suggestions = suggestionsOpen
        ? (trimmedSearch
            ? suggestionSource.filter((name) => matchesTokens(name, tokens)).slice(0, 6)
            : recentSearches.slice(0, 6))
        : [];

    const commitSearch = (value) => {
        const term = String(value ?? "").trim();
        if (!term) {
            return;
        }
        setRecentSearches((previous) => {
            const next = [term, ...previous.filter((item) => normalizeText(item) !== normalizeText(term))].slice(0, 8);
            try {
                localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            } catch {
                // almacenamiento no disponible
            }
            return next;
        });
    };

    const pickSuggestion = (value) => {
        setSearchTerm(value);
        setViewingEntity(null);
        commitSearch(value);
        setSuggestionsOpen(false);
        setSuggestionIndex(-1);
        inputRef.current?.focus();
    };

    const clearSearch = () => {
        setSearchTerm("");
        setViewingEntity(null);
        setSuggestionIndex(-1);
        inputRef.current?.focus();
    };

    const clearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setGroupSort("alpha");
    };

    const toggleTag = (tag) => {
        setFilters((previous) => ({
            ...previous,
            tags: previous.tags.includes(tag)
                ? previous.tags.filter((item) => item !== tag)
                : [...previous.tags, tag]
        }));
    };

    const handleInputKeyDown = (event) => {
        if (event.key === "Escape") {
            setSuggestionsOpen(false);
            setSuggestionIndex(-1);
            setSearchMenuOpen(false);
            return;
        }

        if (event.key === "ArrowDown" && suggestions.length > 0) {
            event.preventDefault();
            setSuggestionsOpen(true);
            setSuggestionIndex((previous) => (previous + 1) % suggestions.length);
            return;
        }

        if (event.key === "ArrowUp" && suggestions.length > 0) {
            event.preventDefault();
            setSuggestionIndex((previous) => (previous <= 0 ? suggestions.length - 1 : previous - 1));
            return;
        }

        if (event.key === "Enter") {
            if (suggestionIndex >= 0 && suggestionIndex < suggestions.length) {
                pickSuggestion(suggestions[suggestionIndex]);
            } else {
                commitSearch(searchTerm);
                setSuggestionsOpen(false);
                setSuggestionIndex(-1);
            }
        }
    };

    const handleWrapKeyDown = (event) => {
        if (event.key === "Escape") {
            setSearchMenuOpen(false);
            setSuggestionsOpen(false);
        }
    };

    if (selectedMod) {
        return <ModView mod={selectedMod} onBack={() => setSelectedMod(null)} />;
    }

    const updateFilter = (key, value) => {
        setFilters((previous) => ({ ...previous, [key]: value }));
    };

    return (
        <>
            <div className={styles["header"]} onKeyDown={handleWrapKeyDown}>
                <div className={styles["search-bar"]}>
                    <div className={styles["search-wrap"]}>
                        <input
                            ref={inputRef}
                            type="text"
                            id="mname"
                            name="mname"
                            placeholder={searchMode === "name" ? "Buscar por nombre..." : "Buscar por desarrollador..."}
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setViewingEntity(null);
                                setSuggestionIndex(-1);
                                setSuggestionsOpen(true);
                            }}
                            onFocus={() => setSuggestionsOpen(true)}
                            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 120)}
                            onKeyDown={handleInputKeyDown}
                        />
                        {searchTerm && (
                            <button type="button" className={styles["clear-btn"]} onClick={clearSearch} aria-label="Limpiar búsqueda">
                                ✕
                            </button>
                        )}

                        {suggestions.length > 0 && (
                            <div className={styles["suggestions"]}>
                                {!trimmedSearch && (
                                    <div className={styles["recent-head"]}>
                                        <span>Recientes</span>
                                        <button
                                            type="button"
                                            className={styles["recent-clear"]}
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => {
                                                setRecentSearches([]);
                                                try {
                                                    localStorage.removeItem(RECENT_KEY);
                                                } catch {
                                                    // almacenamiento no disponible
                                                }
                                            }}
                                        >
                                            Borrar
                                        </button>
                                    </div>
                                )}
                                {suggestions.map((name, index) => (
                                    <button
                                        key={name}
                                        type="button"
                                        className={`${styles["suggestion-item"]} ${index === suggestionIndex ? styles["suggestion-active"] : ""}`}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onMouseEnter={() => setSuggestionIndex(index)}
                                        onClick={() => pickSuggestion(name)}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles["filterMenu"]}>
                        <button
                            className={`${styles["filter-button"]} ${isSearchMenuOpen ? styles["filter-button-open"] : ""} ${filtersActive ? styles["filter-button-active"] : ""}`}
                            onClick={() => setSearchMenuOpen(prev => !prev)}
                            aria-label="Filtros de búsqueda"
                        >
                            <img src={funnel} alt="Filter" />
                            {filtersActive && <span className={styles["filter-dot"]}></span>}
                        </button>

                        {isSearchMenuOpen && (
                            <div className={styles["filter-panel"]}>
                                <span className={styles["filter-section-title"]}>Buscar por</span>
                                {SEARCH_OPTIONS.map((option) => (
                                    <label key={option.value} className={styles["filter-option"]}>
                                        <input
                                            type="radio"
                                            name="search-mode"
                                            checked={searchMode === option.value}
                                            onChange={() => {
                                                setSearchMode(option.value);
                                                setViewingEntity(null);
                                            }}
                                        />
                                        {option.label}
                                    </label>
                                ))}

                                <span className={styles["filter-section-title"]}>Ordenar por</span>
                                {SORT_OPTIONS.map((option) => (
                                    <label key={option.value} className={styles["filter-option"]}>
                                        <input
                                            type="radio"
                                            name="group-sort"
                                            checked={groupSort === option.value}
                                            onChange={() => setGroupSort(option.value)}
                                        />
                                        {option.value === "alpha" ? "Alfabético" : option.label}
                                    </label>
                                ))}

                                <span className={styles["filter-section-title"]}>Filtros</span>
                                <div className={styles["filter-row"]}>
                                    <label className={styles["filter-field"]}>
                                        Desc. mín.
                                        <input
                                            type="number"
                                            min="0"
                                            className={styles["filter-number"]}
                                            value={filters.minDownloads}
                                            onChange={(event) => updateFilter("minDownloads", event.target.value)}
                                        />
                                    </label>
                                    <label className={styles["filter-field"]}>
                                        Rating mín.
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            className={styles["filter-number"]}
                                            value={filters.minRating}
                                            onChange={(event) => updateFilter("minRating", event.target.value)}
                                        />
                                    </label>
                                </div>
                                <label className={styles["filter-field"]}>
                                    Lanzado desde
                                    <input
                                        type="date"
                                        className={styles["filter-date"]}
                                        value={filters.dateFrom}
                                        onChange={(event) => updateFilter("dateFrom", event.target.value)}
                                    />
                                </label>

                                {availableTags.length > 0 && (
                                    <div className={styles["tag-chips"]}>
                                        {availableTags.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                className={`${styles["tag-chip"]} ${filters.tags.includes(tag) ? styles["tag-chip-active"] : ""}`}
                                                onClick={() => toggleTag(tag)}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <label className={`${styles["filter-option"]} ${styles["filter-disabled"]}`}>
                                    <input type="checkbox" checked={false} disabled />
                                    Solo instalados (próximamente)
                                </label>

                                <button type="button" className={styles["filter-clear"]} onClick={clearFilters}>
                                    Limpiar todo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {status === "loading" && (
                <div className={styles["state-block"]}>
                    <p className={styles["state-text"]}>Cargando catálogo…</p>
                </div>
            )}

            {status === "error" && (
                <div className={styles["state-block"]}>
                    <p className={styles["state-text"]}>No se pudo conectar con el servidor.</p>
                </div>
            )}

            {status === "ready" && showProfiles && (
                visibleStudios.length > 0 || visibleProducers.length > 0 ? (
                    <>
                        {visibleStudios.length > 0 && (
                            <>
                                <h2 className={styles["section-heading"]}>Studios</h2>
                                <div className={styles["cards"]}>
                                    {visibleStudios.map((studio) => (
                                        <StudioCard
                                            key={studio.id}
                                            name={studio.name}
                                            logo={studio.logo}
                                            cover={studio.cover}
                                            accentcolor={studio.accentcolor}
                                            modCount={studio.modCount}
                                            tokens={tokens}
                                            onClick={() => {
                                                setViewingEntity({ kind: "studio", id: studio.id, name: studio.name });
                                                setSearchTerm(studio.name);
                                                commitSearch(studio.name);
                                                setSuggestionsOpen(false);
                                                setSuggestionIndex(-1);
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {visibleProducers.length > 0 && (
                            <>
                                <h2 className={styles["section-heading"]}>Productores</h2>
                                <div className={styles["cards"]}>
                                    {visibleProducers.map((producer) => (
                                        <StudioCard
                                            key={producer.id}
                                            name={producer.name}
                                            logo={producer.logo}
                                            cover={producer.cover}
                                            accentcolor={producer.accentcolor}
                                            modCount={producer.modCount}
                                            tokens={tokens}
                                            onClick={() => {
                                                setViewingEntity({ kind: "producer", id: producer.id, name: producer.name });
                                                setSearchTerm(producer.name);
                                                commitSearch(producer.name);
                                                setSuggestionsOpen(false);
                                                setSuggestionIndex(-1);
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className={styles["state-block"]}>
                        <p className={styles["state-text"]}>
                            {trimmedSearch ? `Sin resultados para «${trimmedSearch}»` : "No hay estudios ni productores disponibles."}
                        </p>
                    </div>
                )
            )}

            {status === "ready" && viewingEntity && (
                entityMods.length > 0 ? (
                    <>
                        <h2 className={styles["section-heading"]}>{viewingEntity.name}</h2>
                        <div className={styles["cards"]}>
                            {entityMods.map((mod) => (
                                <Card
                                    key={mod.ID}
                                    cover={mod.m_cover}
                                    title={mod.m_name}
                                    publisher={mod.m_devgroupname}
                                    producer={mod.m_producername}
                                    releasedate={mod.m_releasedate}
                                    accentcolor={mod.m_accentcolor}
                                    tokens={tokens}
                                    onClick={() => setSelectedMod(mod)}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className={styles["state-block"]}>
                        <p className={styles["state-text"]}>
                            {filtersActive ? "No hay mods que coincidan con los filtros." : "Este perfil aún no tiene mods."}
                        </p>
                    </div>
                )
            )}

            {status === "ready" && searchMode === "name" && (
                filteredMods.length > 0 ? (
                    <div className={styles["cards"]}>
                        {filteredMods.map((mod) => (
                            <Card
                                key={mod.ID}
                                cover={mod.m_cover}
                                title={mod.m_name}
                                publisher={mod.m_devgroupname}
                                producer={mod.m_producername}
                                releasedate={mod.m_releasedate}
                                accentcolor={mod.m_accentcolor}
                                tokens={tokens}
                                onClick={() => setSelectedMod(mod)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles["state-block"]}>
                        <p className={styles["state-text"]}>
                            {trimmedSearch
                                ? `Sin resultados para «${trimmedSearch}»`
                                : "No hay mods que coincidan con los filtros."}
                        </p>
                    </div>
                )
            )}
        </>
    );
}

export default Store
