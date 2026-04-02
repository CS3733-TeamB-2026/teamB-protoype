import express from 'express'
import cors from 'cors'
import { queryAllEmployees } from "db/db-queries";
import { queryServiceReqs } from "db/db-queries";
import { queryServiceByAssigned } from "db/db-queries";

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
        const assigned = await queryServiceByAssigned(req.params.id)
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