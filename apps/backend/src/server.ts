import express from 'express'
import cors from 'cors'
import { queryAllEmployees } from "db/db-queries";
import {prisma} from "db/lib/prisma";

const app = express()
app.use(cors())
app.use(express.json())

app.get('/employee', async (req, res) => {
    try{
        const employees = await queryAllEmployees()
        res.status(200).json(employees)
    } catch(error){
        console.error(error)
        res.status(500).end()
    }
    console.log(res.json(fetchEmployee(12345)))
})

app.get("/servicereqs", (req, res) => {
    console.log(res.json(fetchServiceRequest()))
})

app.get("/assigned", (req, res) => {
    console.log(res.json(fetchAssignment()))
})

/*
app.post("/form", (req, res) => {
    addToDB(res)
})
*/

app.listen(3000, () => {
    console.log(`Server is listening on port 3000`);
})

function addToDB(res) {
    //TODO Implement with DB
}

function fetchEmployee(employeeId : number){
    return {"Employee": {"firstName": "John", "lastName": "Doe", "id": 12345, "persona": "JoeDoe"}}
}

function fetchServiceRequest(){
    return {"Service Requests": {"name": "Fix Something", "owner": "12345", "deadline": "12/34/56",
            "createdDate": "1/2/34", "type": "Review Insurance Claim"}}
}

function fetchAssignment(){
    return {"Service Requests": {"name": "Fix Something", "owner": "12345", "deadline": "12/34/56",
            "createdDate": "1/2/34", "type": "Review Insurance Claim"}}
}