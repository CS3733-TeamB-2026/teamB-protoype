import 'dotenv/config'
import express from 'express'
import morgan from 'morgan';
import cors from 'cors'

import {
    queryAllEmployees,
    queryServiceReqs,
    queryServiceByAssigned,
    queryObjectsByBucket,
} from "@softeng-app/db";

const app = express()
app.use(cors())
app.use(morgan('dev'));
app.use(express.json())

app.get('/employee', async (req, res) => {
    try{
        const employees = await queryAllEmployees()
        res.status(200).json(employees)
    } catch(error){
        console.error(error)
        res.status(500).end()
    }
})

app.get("/servicereqs", async (req, res) => {
    try{
        const servicereqs = await queryServiceReqs()
        res.status(200).json(servicereqs)
    } catch(error){
        console.error(error)
        res.status(500).end()
    }
})

app.get("/assigned", async (req, res) => {
    try{
        const id = parseInt(req.query.id as string)
        const assigned = await queryServiceByAssigned(id)
        res.status(200).json(assigned)
    } catch(error){
        console.error(error)
        res.status(500).end()
    }
})

app.get("/files", async (req, res) => {
    try{
        const assigned = await queryObjectsByBucket("test")
        res.status(200).json(assigned)
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

app.listen(3000, () => {
    console.log(`Server is listening on port 3000`);
})
