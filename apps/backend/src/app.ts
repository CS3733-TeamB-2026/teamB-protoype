import 'dotenv/config'
import express from 'express'
import morgan from 'morgan';
import cors from 'cors'
import bcrypt from 'bcrypt';
import * as q from "@softeng-app/db";

const app = express()
app.use(cors())
app.use(morgan('dev'));
app.use(express.json())

// Employee
app.get('/api/employee', async (req, res) => {
    try {
        const employees = await q.Employee.queryAllEmployees()
        return res.status(200).json(employees)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

app.post("/api/employee", async (req, res) => {
    const payload = req.body
    try {
        const result = await q.Employee.createEmployee(
            payload.id,
            payload.firstName,
            payload.lastName,
            payload.persona
        );
        return res.status(201).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

app.put('/api/employee', async (req, res) => {
    const payload = req.body
    try {
        const result = await q.Employee.updateEmployee(
            payload.id,
            payload.firstName,
            payload.lastName,
            payload.persona
        );
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

app.delete('/api/employee', async (req, res) => {
    const payload = req.body
    try {
        const result = await q.Employee.deleteEmployee(
            payload.id
        )
        return res.status(204).json(result) // 204 since no object remains
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

// Service Requests
app.get("/api/servicereqs", async (req, res) => {
    try {
        const servicereqs = await q.ServiceReqs.queryAllServiceReqs()
        return res.status(200).json(servicereqs)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

app.get("/api/assigned", async (req, res) => {
    try {
        const id = parseInt(req.query.id as string)
        const assigned = await q.ServiceReqs.queryAssignedServiceReqs()
        return res.status(200).json(assigned)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

// Bucket
/*
app.get("/api/files", async (req, res) => {
    try{
        const assigned = await q.queryObjectsByBucket("test")
        res.status(200).json(assigned)
    } catch(error){
        console.error(error)
        res.status(500).end()
    }
})
*/

// Content
app.get('/api/content', async (req, res) => {
    try {
        const content = await q.Content.queryAllContent()
        return res.status(200).json(content)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

app.post("/api/content", async (req, res) => {
    const payload = req.body
    try {
        const result = await q.Content.createContent(
            payload.name,
            payload.linkURL,
            payload.fileURI,
            payload.ownerID,
            payload.contentType,
            payload.status,
            payload.lastModified,
            payload.expiration,
            payload.targetPersona
        );
        return res.status(201).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

app.put('/api/employee', async (req, res) => {
    const payload = req.body
    try {
        const result = await q.Content.updateContent(
            payload.name,
            payload.linkURL,
            payload.fileURI,
            payload.ownerID,
            payload.contentType,
            payload.status,
            payload.lastModified,
            payload.expiration,
            payload.targetPersona
        );
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

app.delete('/api/content', async (req, res) => {
    const payload = req.body
    try{
        const result = await q.Content.deleteContent(
            payload.name
        )
        return res.status(204).json(result) // 204 since no object remains
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

// Login
app.post("/api/login", async (req, res) => {
    try{
        const {username, password} = req.body;
        const login = await q.Login.queryLoginByUsername(username);

        if (!login){
            return res.status(401).json({message:"User not found"})
        }

        const match = await bcrypt.compare(password, login.passwordHash)
        if (!match) {
            return res.status(401).json({message:"Incorrect Password"})
        }

        const employee = await q.Employee.queryEmployeeById(login.employeeID);
        return res.status(200).json(employee);
    } catch(error){
        console.error(error)
        return res.status(500).end()
    }
})

app.post("/api/login/create", async (req, res) => {
    try {
        const {userName, password, employeeID} = req.body;
        await q.Login.createLogin(userName, password, employeeID);
        return res.status(201).json({message:"Account Created"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Account Creation Failed"});
    }
})

/*
app.post("/form", (req, res) => {
    addToDB(res)
})
*/

app.listen(3000, () => {
    console.log(`Server is listening on port 3000`);
    console.log(`    http://localhost:3000`);
})
