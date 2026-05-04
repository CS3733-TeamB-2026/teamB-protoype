/** One builder per entity type — single source of truth for what goes into each embedding. */

export const buildContentEmbeddingInput = (
    name: string,
    contentType: string,
    persona: string,
    tags: string[],
    textContent: string | null,
) => [name, contentType, persona, tags.join(' '), textContent ?? ''].join(' ');

export const buildEmployeeEmbeddingInput = (
    firstName: string,
    lastName: string,
    persona: string,
) => `${firstName} ${lastName} ${persona}`;

export const buildCollectionEmbeddingInput = (
    displayName: string,
) => displayName;

export const buildServiceReqEmbeddingInput = (
    name: string | null,
    type: string,
    notes: string | null,
) => [name ?? '', type, notes ?? ''].join(' ');