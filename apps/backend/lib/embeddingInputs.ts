/** One builder per entity type — single source of truth for what goes into each embedding. */

/** Expands camelCase identifiers to human-readable words: "businessAnalyst" → "business analyst" */
const camelToWords = (s: string) => s.replace(/([A-Z])/g, ' $1').toLowerCase().trim();

export const buildContentEmbeddingInput = (
    name: string,
    contentType: string,
    persona: string,
    tags: string[],
    status: string,
    fileURI: string | null,
    textContent: string | null,
) => {
    const filename = fileURI ? (fileURI.split('/').pop() ?? null) : null;
    return [
        `Title: ${name}.`,
        `Type: ${camelToWords(contentType)}.`,
        `Audience: ${camelToWords(persona)}.`,
        `Status: ${camelToWords(status)}.`,
        tags.length ? `Tags: ${tags.join(', ')}.` : '',
        filename ? `File: ${filename}.` : '',
        textContent ?? '',
    ].filter(Boolean).join(' ');
};

export const buildEmployeeEmbeddingInput = (
    firstName: string,
    lastName: string,
    persona: string,
) => `Name: ${firstName} ${lastName}. Role: ${camelToWords(persona)}.`;

export const buildCollectionEmbeddingInput = (
    displayName: string,
    itemNames: string[],
) => [
    `Collection: ${displayName}.`,
    itemNames.length ? `Contains: ${itemNames.join(', ')}.` : '',
].filter(Boolean).join(' ');

export const buildServiceReqEmbeddingInput = (
    name: string | null,
    type: string,
    notes: string | null,
) => [
    name ? `Name: ${name}.` : '',
    `Type: ${camelToWords(type)}.`,
    notes ? `Notes: ${notes}.` : '',
].filter(Boolean).join(' ');