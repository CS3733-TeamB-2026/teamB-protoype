import 'dotenv/config'
import express from 'express'
import morgan from 'morgan';
import cors from 'cors'
import path from 'path';
import { fileURLToPath } from 'url';

import * as q from "@softeng-app/db";
import {createContent, createEmployee} from "@softeng-app/db";

const app = express()
app.use(cors())
app.use(morgan('dev'));
app.use(express.json())

app.get('/api/employee', async (req, res) => {
    try {
        const employees = await q.queryAllEmployees()
        res.status(200).json(employees)
    } catch (error) {
        console.error(error)
        res.status(500).end()
    }
})

app.get('/api/content', async (req, res) => {
    try {
        const employees = await q.queryAllContent()
        res.status(200).json(employees)
    } catch (error) {
        console.error(error)
        res.status(500).end()
    }
})

app.get("/api/servicereqs", async (req, res) => {
    try {
        const servicereqs = await q.queryAllServiceReqs()
        res.status(200).json(servicereqs)
    } catch (error) {
        console.error(error)
        res.status(500).end()
    }
})

app.get("/api/assigned", async (req, res) => {
    try {
        const id = parseInt(req.query.id as string)
        const assigned = await q.queryAssignedServiceReqs()
        res.status(200).json(assigned)
    } catch (error) {
        console.error(error)
        res.status(500).end()
    }
})
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

app.post('/api/create-employee', async (req, res) => {
    try{
        const id = parseInt(req.query.id as string)
        const first = req.query.firstName as string
        const last = req.query.lastName as string
        const persona = req.query.persona as string
        await q.createEmployee(id, first, last, persona)
    } catch(error){
        console.error(error)
        res.status(500).end()
    }
})
*/

app.post("/api/login", async (req, res) => {
    try{
        const {username, password} = req.body;
        const login = await q.queryLoginByUsername(username);

        if (!login){
            res.status(401).json({message:"User not found"})
        }

        if (login.password !== password) {
            res.status(401).json({message:"Incorrect Password"})
        }

        const employee = await q.queryEmployeeById(login.id);
        res.status(200).json(employee);
    } catch(error){
        console.error(error)
        res.status(500).end()
    }
})

app.post('/api/update-employee', async (req, res) => {
    try {
        const id = parseInt(req.query.id as string)
        const first = req.query.firstName as string
        const last = req.query.lastName as string
        const persona = req.query.persona as string
        await q.updateEmployee(id, first, last, persona)
    } catch (error){
    console.error(error)
    res.status(500).end()}
    }
)

    app.post("/api/employee", (req, res) => {
        const payload = req.body
        try {
            createEmployee(
                payload.firstName,
                payload.lastName,
                payload.id,
                payload.persona
            );
        } catch (error) {
            console.error(error)
            res.status(500).end()
        }
    })

    app.post('/api/delete-employee', async (req, res) => {
        try {
            const id = parseInt(req.query.id as string)
            await q.deleteEmployee(id)
        } catch (error) {
            console.error(error)
            res.status(500).end()
        }
    })

app.post('/api/delete-employee', async (req, res) => {
    try{
        const id = parseInt(req.query.id as string)
        await q.deleteEmployee(id)
    } catch(error){
        console.error(error)
        res.status(500).end()
    }
})
   
app.post("/api/content", async (req, res) => {
    const payload = req.body
    try {
        const result = await createContent(
            payload.name,
            payload.linkURL,
            payload.ownerID,
            payload.contentType,
            payload.status,
            payload.lastModified,
            payload.expiration,
            payload.jobPosition
        );
        res.status(201).json(result)
    } catch(error){
        console.error(error)
        res.status(500).end()
    }
})

    /*
    app.post("/form", (req, res) => {
        addToDB(res)
    })
    */
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
