import { useEffect, useRef, useState } from "react";
import funnel from "../assets/funnel.png";
import { normalizeText } from "../utils/search.js";
import { SEARCH_OPTIONS, SORT_OPTIONS } from "../hooks/useModSearch.js";
import styles from "./ModSearchBar.module.css";

const RECENT_KEY = "prisma-recent-searches";

function loadRecentSearches() {
    try {
        const parsed = JSON.parse(localStorage.getItem(RECENT_KEY));
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 8) : [];
    } catch {
        return [];
    }
}

function ModSearchBar({
    search,
    suggestionsSource = [],
    onPickSuggestion,
    onClearSearch,
    showDeveloperOption = true
})
{
    const {
        searchTerm, setSearchTerm,
        searchMode, setSearchMode,
        groupSort, setGroupSort,
        filters,
        tokens, trimmedSearch,
        availableTags, filtersActive,
        updateFilter, toggleTag, clearFilters
    } = search;

    const [isSearchMenuOpen, setSearchMenuOpen] = useState(false);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState(loadRecentSearches);
    const inputRef = useRef(null);

    useEffect(() => {
        const sync = () => setRecentSearches(loadRecentSearches());
        window.addEventListener("storage", sync);
        return () => window.removeEventListener("storage", sync);
    }, []);

    const suggestions = suggestionsOpen
        ? (trimmedSearch
            ? suggestionsSource.filter((name) => name && normalizeText(name).includes(normalizeText(trimmedSearch))).slice(0, 6)
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
        if (onPickSuggestion) {
            onPickSuggestion(value);
        }
        commitSearch(value);
        setSuggestionsOpen(false);
        setSuggestionIndex(-1);
        inputRef.current?.focus();
    };

    const clear = () => {
        setSearchTerm("");
        if (onClearSearch) {
            onClearSearch();
        }
        setSuggestionIndex(-1);
        inputRef.current?.focus();
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

    const options = showDeveloperOption ? SEARCH_OPTIONS : SEARCH_OPTIONS.filter((option) => option.value === "name");

    return (
        <div className={styles["search-bar"]} onKeyDown={(event) => {
            if (event.key === "Escape") {
                setSearchMenuOpen(false);
                setSuggestionsOpen(false);
            }
        }}>
            <div className={styles["search-wrap"]}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={searchMode === "name" ? "Buscar por nombre..." : "Buscar por desarrollador..."}
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                        if (onClearSearch) {
                            onClearSearch();
                        }
                        setSuggestionIndex(-1);
                        setSuggestionsOpen(true);
                    }}
                    onFocus={() => setSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setSuggestionsOpen(false), 120)}
                    onKeyDown={handleInputKeyDown}
                />
                {searchTerm && (
                    <button type="button" className={styles["clear-btn"]} onClick={clear} aria-label="Limpiar búsqueda">✕</button>
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
                    onClick={() => setSearchMenuOpen((previous) => !previous)}
                    aria-label="Filtros de búsqueda"
                >
                    <img src={funnel} alt="Filter" />
                    {filtersActive && <span className={styles["filter-dot"]}></span>}
                </button>

                {isSearchMenuOpen && (
                    <div className={styles["filter-panel"]}>
                        <span className={styles["filter-section-title"]}>Buscar por</span>
                        {options.map((option) => (
                            <label key={option.value} className={styles["filter-option"]}>
                                <input
                                    type="radio"
                                    name={`search-mode-${styles["filter-panel"]}`}
                                    checked={searchMode === option.value}
                                    onChange={() => setSearchMode(option.value)}
                                />
                                {option.label}
                            </label>
                        ))}

                        <span className={styles["filter-section-title"]}>Ordenar por</span>
                        {SORT_OPTIONS.map((option) => (
                            <label key={option.value} className={styles["filter-option"]}>
                                <input
                                    type="radio"
                                    name={`group-sort-${styles["filter-panel"]}`}
                                    checked={groupSort === option.value}
                                    onChange={() => setGroupSort(option.value)}
                                />
                                {option.label}
                            </label>
                        ))}

                        <span className={styles["filter-section-title"]}>Filtros</span>
                        <div className={styles["filter-row"]}>
                            <label className={styles["filter-field"]}>
                                Desc. mín.
                                <input type="number" min="0" className={styles["filter-number"]} value={filters.minDownloads} onChange={(event) => updateFilter("minDownloads", event.target.value)} />
                            </label>
                            <label className={styles["filter-field"]}>
                                Rating mín.
                                <input type="number" min="0" max="10" step="0.1" className={styles["filter-number"]} value={filters.minRating} onChange={(event) => updateFilter("minRating", event.target.value)} />
                            </label>
                        </div>
                        <label className={styles["filter-field"]}>
                            Lanzado desde
                            <input type="date" className={styles["filter-date"]} value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} />
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

                        <button type="button" className={styles["filter-clear"]} onClick={clearFilters}>
                            Limpiar todo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ModSearchBar
