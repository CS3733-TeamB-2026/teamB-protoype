export {Bucket} from "./queries/bucket";
export {ServiceReqs} from "./queries/servicereqs";
export {Helper, employeeSelect} from "./queries/helper";
export {Employee} from "./queries/employee";
export {Content} from "./queries/content";
export {Bookmark} from "./queries/bookmark";
export {Collection} from "./queries/collection";

// Prisma model types — use these in backend code (hooks, helpers).
// Do not import Prisma types directly on the frontend; use lib/types.ts instead.
export type {
    Employee as EmployeeModel,
    Content as ContentModel,
    ServiceRequest as ServiceRequestModel,
    Collection as CollectionModel,
    CollectionItem as CollectionItemModel,
    CollectionFavorite as CollectionFavoriteModel,
    Bookmark as BookmarkModel,
} from "./generated/prisma/models";
export type { Persona, Status, ContentType, RequestType } from "./generated/prisma/enums";