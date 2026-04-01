import express from 'express'
import cors from 'cors'
const app = express()

app.use(cors())
app.use(express.json())

app.get('/employee', (req, res) => {
    res.json(fetchEmployee())
})

app.get("/servicereqs", (req, res) => {
    res.json(fetchServiceRequest())
})

app.post("/form", (req, res) => {
    addToDB(res)
})

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
    return {"Service Requests": {"name": "Fix Something", "url": "https://example.com/", "owner": "12345",
            "deadline": "12/34/56", "createdDate": "1/2/34", "type": "Review Insurance Claim", }}
}