import { useMemo, useState } from "react";
import { matchesTokens, normalizeText, tokenize } from "../utils/search.js";

export const SORT_OPTIONS = [
    { value: "alpha", label: "Alfabético" },
    { value: "downloads", label: "Descargas" },
    { value: "recent", label: "Recientes" }
];

export const SEARCH_OPTIONS = [
    { value: "name", label: "Nombre" },
    { value: "developer", label: "Desarrollador" }
];

export const EMPTY_FILTERS = { minDownloads: "", minRating: "", dateFrom: "", tags: [], onlyInstalled: false };

export function useModSearch(items, options = {})
{
    const { getSearchFields, getTags, getDate, getDownloads, getRating, getName } = options;

    const [searchTerm, setSearchTerm] = useState("");
    const [searchMode, setSearchMode] = useState("name");
    const [groupSort, setGroupSort] = useState("alpha");
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const tokens = tokenize(searchTerm);
    const trimmedSearch = searchTerm.trim();

    const availableTags = useMemo(() => {
        if (!getTags) {
            return [];
        }
        return [...new Set(items.flatMap((item) => getTags(item) || []))].sort();
    }, [items, getTags]);

    const filtersActive =
        filters.minDownloads !== "" ||
        filters.minRating !== "" ||
        filters.dateFrom !== "" ||
        filters.tags.length > 0;

    const passesFilters = (item) => {
        if (filters.minDownloads !== "" && (getDownloads ? getDownloads(item) : 0) < Number(filters.minDownloads)) {
            return false;
        }
        if (filters.minRating !== "" && (getRating ? getRating(item) : 0) < Number(filters.minRating)) {
            return false;
        }
        if (filters.dateFrom) {
            const date = getDate ? getDate(item) : null;
            if (!date || new Date(date) < new Date(filters.dateFrom)) {
                return false;
            }
        }
        if (filters.tags.length > 0) {
            const itemTags = getTags ? getTags(item) : [];
            if (!filters.tags.some((tag) => itemTags.includes(tag))) {
                return false;
            }
        }
        return true;
    };

    const matchesSearch = (item) => {
        if (tokens.length === 0) {
            return true;
        }
        const fields = getSearchFields ? getSearchFields(item, searchMode) : [getName ? getName(item) : ""];
        return matchesTokens(fields.filter((field) => field !== null && field !== undefined && field !== "").join(" "), tokens);
    };

    const sortItems = (list) => [...list].sort((a, b) => {
        if (groupSort === "downloads") {
            return (getDownloads ? getDownloads(b) : 0) - (getDownloads ? getDownloads(a) : 0);
        }
        if (groupSort === "recent") {
            const aTime = getDate && getDate(a) ? new Date(getDate(a)).getTime() : 0;
            const bTime = getDate && getDate(b) ? new Date(getDate(b)).getTime() : 0;
            return bTime - aTime;
        }
        return normalizeText(getName ? getName(a) : "").localeCompare(normalizeText(getName ? getName(b) : ""));
    });

    const filteredItems = sortItems(items.filter((item) => matchesSearch(item) && passesFilters(item)));

    const updateFilter = (key, value) => {
        setFilters((previous) => ({ ...previous, [key]: value }));
    };

    const toggleTag = (tag) => {
        setFilters((previous) => ({
            ...previous,
            tags: previous.tags.includes(tag)
                ? previous.tags.filter((item) => item !== tag)
                : [...previous.tags, tag]
        }));
    };

    const clearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setGroupSort("alpha");
    };

    return {
        searchTerm, setSearchTerm,
        searchMode, setSearchMode,
        groupSort, setGroupSort,
        filters, setFilters,
        tokens, trimmedSearch,
        availableTags, filtersActive,
        filteredItems,
        updateFilter, toggleTag, clearFilters
    };
}
