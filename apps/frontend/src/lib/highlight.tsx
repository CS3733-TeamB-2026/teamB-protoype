export function highlight(text: string, query: string) {
    if (!query) return text; // nothing to highlight

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
        regex.test(part) ? (
            <span key={i} className="bg-yellow-300 font-semibold">
            {part}
            </span>
    ) : (
        part
    )
);
}