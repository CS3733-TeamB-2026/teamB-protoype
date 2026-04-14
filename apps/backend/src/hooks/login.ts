import * as q from "@softeng-app/db";
import bcrypt from 'bcrypt';
import {req, res} from "./types"

export const tryLogin = async (req: req, res: res) => {
    try {
        const { username, password } = req.body;
        const login = await q.Login.queryLoginByUsername(username);

        if (!login) {
            return res.status(401).json({ message: "User not found" });
        }

        const match = await bcrypt.compare(password, login.passwordHash);
        if (!match) {
            return res.status(401).json({ message: "Incorrect Password" });
        }

        const employee = await q.Employee.queryEmployeeById(login.employeeID);
        return res.status(200).json(employee);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const createLogin = async (req: req, res: res) => {
    try {
        const {userName, password, employeeID} = req.body;
        await q.Login.createLogin(userName, password, employeeID);
        return res.status(201).json({message:"Account Created"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Account Creation Failed"});
    }
}

export const deleteLogin = async (req: req, res: res) => {
    const payload = req.body
    try {
        const result = await q.Login.deleteLogin(
            payload.id
        )
        return res.status(204).json(result) // 204 since no object remains
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
}



export const updateLogin = async (req: req, res: res) => {
    const payload = req.body
    try {
        const result = await q.Login.updateLogin(
            payload.userName,
            payload.employeeID
        );
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
}
