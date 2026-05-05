/** Splits `text` on case-insensitive matches of `query` and wraps each match in a yellow highlight `<span>`. */
export function highlight(text: string, query: string) {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
        regex.exec(part) !== null
            ? (
            <span key={i} className="bg-yellow-300 font-semibold">
            {part}
            </span>
    ) : (
        part
    )
);
}

/** Returns `{start, end}` index pairs for every case-insensitive occurrence of `query` in `full`. */
export function findMatches(full: string, query: string) {
    if (!query) return [];
    const regex = new RegExp(query, "gi");
    const matches = [];
    let m;
    while ((m = regex.exec(full)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length });
    }
    return matches;
}

/** Highlights match ranges within a text segment that starts at `offset` characters from the full document start. Used for paginated/windowed text rendering. */
export function highlightRange(text: string, offset: number, matches: {start:number,end:number}[]) {
    const parts = [];
    let i = 0;

    for (const m of matches) {
        if (m.end <= offset || m.start >= offset + text.length) continue;

        const start = Math.max(m.start - offset, 0);
        const end = Math.min(m.end - offset, text.length);

        if (i < start) parts.push(text.slice(i, start));
        parts.push(<span className="bg-yellow-300 rounded px-1 font-semibold">{text.slice(start, end)}</span>);
        i = end;
    }

    if (i < text.length) parts.push(text.slice(i));

    return parts;
}