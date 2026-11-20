import { highlightRanges } from "../utils/search.js";

function Highlight({ text, tokens = [] }) {
    const value = String(text ?? "");
    const chars = [...value];
    const ranges = highlightRanges(value, tokens);

    if (ranges.length === 0) {
        return <>{value}</>;
    }

    const parts = [];
    let cursor = 0;

    ranges.forEach(([start, end], index) => {
        if (start > cursor) {
            parts.push(chars.slice(cursor, start).join(""));
        }
        parts.push(<mark key={index}>{chars.slice(start, end).join("")}</mark>);
        cursor = end;
    });

    if (cursor < chars.length) {
        parts.push(chars.slice(cursor).join(""));
    }

    return <>{parts}</>;
}

export default Highlight;
