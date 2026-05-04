export {Bucket} from "./queries/bucket";
export {ServiceReqs} from "./queries/servicereqs";
export {Helper, employeeSelect} from "./queries/helper";
export {Employee} from "./queries/employee";
export {Content} from "./queries/content";
export {Bookmark} from "./queries/bookmark";
export {Collection} from "./queries/collection";
export {Notification} from "./queries/notification";
export {Preview} from "./queries/preview";
export { embeddingToSql } from "./lib/embeddings";
export { buildSystemPrompt } from "./lib/systemPrompt";
export { prismaReadOnly } from "./lib/prisma";
export { SCHEMA_DESCRIPTION } from "./lib/schemaDescription";
export { FEW_SHOT_EXAMPLES } from "./lib/fewShotExamples";
export { prisma } from "./lib/prisma";
export { supabase } from "./lib/supabase";

// Prisma model types — use these in backend code (hooks, helpers).
// Do not import Prisma types directly on the frontend; use lib/types.ts instead.
export type {
    EmployeeModel,
    ContentModel,
    ServiceRequestModel,
    CollectionModel,
    CollectionItemModel,
    CollectionFavoriteModel,
    BookmarkModel,
    PreviewModel
} from "./generated/prisma/models";
export type { Persona, Status, ContentType, RequestType } from "./generated/prisma/enums";
