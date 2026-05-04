import 'dotenv/config'
import './jobs'
import express from 'express'
import morgan from 'morgan';
import cors from 'cors'
import path from 'path';
import { fileURLToPath } from 'url';
import multer from "multer";
import * as servicereqs from './hooks/servicereqs'
import * as content from './hooks/content'
import * as employee from './hooks/employee'
import * as bookmark from './hooks/bookmark'
import * as collection from './hooks/collection'
import * as notifications from './hooks/notifications'
import * as previews from './hooks/preview'
import * as nlQuery from './hooks/nlQuery'
import * as search from './hooks/search'
import { auth } from 'express-oauth2-jwt-bearer'

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const checkJwt = auth({
    audience: 'https://hanover-cma-api',
    issuerBaseURL: 'https://dev-s638hh1d5ry67sv6.us.auth0.com/'
})

app.get("/api/preview", content.previewContent)

// Protect all routes, ANY ROUTES BEFORE ARE UNPROTECTED
app.use('/api', checkJwt);

// Service Reqs
app.get("/api/servicereqs/unlinked", servicereqs.getUnlinkedServiceReqs)
app.get("/api/servicereqs", servicereqs.allServiceReqs)
app.get("/api/assigned", servicereqs.allAssignedReqs)
app.post("/api/servicereqs",servicereqs.createServiceReq)
app.put("/api/servicereqs", servicereqs.updateServiceReq)
app.patch("/api/servicereqs/:id/link", servicereqs.linkServiceReq)
app.delete("/api/servicereqs/:id", servicereqs.deleteServiceReq)
// Unified search
app.get("/api/search", search.unifiedSearch)
// Content
app.get("/api/content/info/:id", content.getContentInfo)
app.get("/api/content/download/:id", content.downloadContent)
app.get("/api/content/publicUrl/:id", content.getPublicFileUrl)
app.get("/api/content/search", content.searchContent)
app.get("/api/content/tags", content.getAllTags)
app.get("/api/content/transaction-summary", content.getTransactionSummary)
app.get("/api/content/deleted", content.getDeletedContent)
app.get("/api/content/:id/collections", collection.getCollectionsByContentId)
app.get("/api/content/:id/service-requests", servicereqs.getServiceReqsByContentId)
app.patch("/api/content/:id/service-request", content.setContentServiceRequest)
app.get("/api/content/:id", content.getContentById)
app.get("/api/content", content.getAllContent)
app.post("/api/content/:id/checkin", content.checkinContent)
app.post("/api/content/:id/checkout", content.checkoutContent)
app.post("/api/content/:id/restore", content.restoreContent)
app.post("/api/content", upload.single("file"), content.uploadFile)
app.put("/api/content", upload.single("file"), content.updateContent)
app.delete("/api/content/:id/permanent", content.permanentDeleteContent)
app.delete("/api/content/:id", content.deleteContent)
// Bookmarks
app.get("/api/bookmark", bookmark.getBookmarks)
app.post("/api/bookmark/:contentId", bookmark.addBookmark)
app.delete("/api/bookmark/:contentId", bookmark.removeBookmark)
// Previews
app.get("/api/previews", previews.getPreviews)
app.post("/api/previews/:contentId", previews.addPreview)
app.get("/api/previews/hits/:contentId", previews.getHits)
// Collections
app.get("/api/collections/favorites", collection.getFavorites)
app.get("/api/collections/owned", collection.getCollectionByOwnerId)
app.get("/api/collections/:id/service-requests", servicereqs.getServiceReqsByCollectionId)
app.patch("/api/collections/:id/service-request", collection.setCollectionServiceRequest)
app.get("/api/collections/:id", collection.getCollectionById)
app.get("/api/collections", collection.getAllCollections)
app.post("/api/collections/:id/items", collection.appendItemsToCollection)
app.post("/api/collections/:id/favorite", collection.addFavorite)
app.post("/api/collections", collection.createCollection)
app.delete("/api/collections/:id/favorite", collection.removeFavorite)
app.delete("/api/collections/:id", collection.deleteCollection)
app.put("/api/collections/:id", collection.updateCollection)
// Employee
app.get("/api/employee/all", employee.getAllEmployees)
app.get("/api/employee/me", employee.getMe);
app.get("/api/employee/dashboard-layout", employee.getDashboardLayout)
app.put("/api/employee/dashboard-layout", employee.updateDashboardLayout)
app.get("/api/employee/:id", employee.getEmployeeById)
app.get("/api/employee", employee.getAllEmployees)
app.post("/api/employee/auth", employee.createEmployeeWithAuth0)
app.post("/api/employee/photo", upload.single("photo"), employee.uploadProfilePhoto);
app.post("/api/employee", employee.createEmployee)
app.put("/api/employee", employee.updateEmployee)
app.delete("/api/employee", employee.deleteEmployee)
//notifications
app.get("/api/notifications/dismissed", notifications.getDismissedNotifications);
app.get("/api/notifications", notifications.getNotifications)
app.post("/api/notifications/dismiss", notifications.dismissNotification);
// NL Query
app.post("/api/nl-query", nlQuery.generateNLQuery);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(3000, '0.0.0.0', () => {
        console.log(`Server is listening on port 3000`);
        console.log(`    http://localhost:3000`);
})
