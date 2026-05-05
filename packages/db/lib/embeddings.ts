/**
 * Serializes a numeric embedding vector into the pgvector literal format `[x,y,z,…]`.
 * Used in raw SQL queries passed to `$queryRaw` where Prisma can't interpolate a
 * native vector type — the string is cast to `vector` by the query itself.
 */
export const embeddingToSql = (v: number[]) => `[${v.join(',')}]`;
