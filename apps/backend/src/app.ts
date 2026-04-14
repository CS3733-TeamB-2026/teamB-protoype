import 'dotenv/config'
import express from 'express'
import morgan from 'morgan';
import cors from 'cors'
import path from 'path';
import { fileURLToPath } from 'url';
import multer from "multer";
import * as login from './hooks/login'
import * as servicereqs from './hooks/servicereqs'
import * as content from './hooks/content'
import * as employee from './hooks/employee'
import { auth } from 'express-oauth2-jwt-bearer'

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });
const LOCK_TIMEOUT_MS = 2 * 60 * 1000;

const checkJwt = auth({
    audience: 'https://hanover-cma-api',
    issuerBaseURL: 'https://dev-s638hh1d5ry67sv6.us.auth0.com/'
})

app.get("/api/preview", content.previewContent)

// Protect all routes, ANY ROUTES BEFORE ARE UNPROTECTED
app.use('/api', checkJwt);

// Login
app.post("/api/login", login.tryLogin);
app.post("/api/login/create", login.createLogin)
app.delete('/api/login', login.deleteLogin)
app.put('/api/login', login.updateLogin)
// Service Reqs
app.get("/api/servicereqs", servicereqs.allServiceReqs)
app.get("/api/assigned", servicereqs.allAssignedReqs)
// Content
app.get("/api/content", content.getAllContent)
app.post("/api/content/checkin", content.checkinContent)
app.post("/api/content/checkout", content.checkoutContent)
app.get("/api/content/info/:id", content.getContentInfo)
app.get("/api/content/download/:id", content.downloadContent)
app.get("/api/content/bookmark/:id", content.getContentByBookmarkerId)
app.get("/api/content/:id", content.getContentById)
app.post("/api/content", upload.single("file"), content.uploadFile)
app.put("/api/content", upload.single("file"), content.updateContent)
app.delete("/api/content/:id", content.deleteContent)
// Employee
app.get("/api/employee/all", employee.getAllEmployeesWithLogin)
app.get("/api/employee", employee.getAllEmployees)
app.get("/api/employee/me", employee.getMe);
app.get("/api/employee/:id", employee.getEmployeeById)
app.post("/api/employee", employee.createEmployee)
app.put("/api/employee", employee.updateEmployee)
app.delete("/api/employee", employee.deleteEmployee)

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

setInterval(async () => {
    await content.clearExpiredLocks();
}, 30 * 1000);