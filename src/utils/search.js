export function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function tokenize(query) {
    return normalizeText(query).split(/\s+/).filter(Boolean);
}

export function matchesTokens(text, tokens) {
    if (!tokens || tokens.length === 0) {
        return true;
    }

    const haystack = normalizeText(text);
    return tokens.every((token) => haystack.includes(token));
}

export function highlightRanges(text, tokens) {
    const chars = [...String(text ?? "")];

    if (!tokens || tokens.length === 0 || chars.length === 0) {
        return [];
    }

    const folded = [];
    const map = [];

    chars.forEach((char, index) => {
        const base = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        for (const foldedChar of base) {
            folded.push(foldedChar);
            map.push(index);
        }
    });

    const foldedText = folded.join("");
    const ranges = [];

    for (const token of tokens) {
        if (!token) {
            continue;
        }

        let from = 0;
        while (from <= foldedText.length - token.length) {
            const at = foldedText.indexOf(token, from);
            if (at === -1) {
                break;
            }

            const start = map[at];
            const end = map[at + token.length - 1] + 1;
            ranges.push([start, end]);
            from = at + token.length;
        }
    }

    if (ranges.length === 0) {
        return [];
    }

    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]];

    for (const range of ranges.slice(1)) {
        const last = merged[merged.length - 1];
        if (range[0] <= last[1]) {
            last[1] = Math.max(last[1], range[1]);
        } else {
            merged.push(range);
        }
    }

    return merged;
}
