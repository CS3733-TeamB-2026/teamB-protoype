import * as q from "@softeng-app/db";
import express from "express";
const app = express();
import {req, res} from "./types"

export const getAllEmployeesWithLogin = async (req: req, res: res) => {
    try {
        const employees = await q.Employee.queryAllEmployeesWithLogin();
        return res.status(200).json(employees);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
}


export const getAllEmployees = async (req: req, res: res) => {
    try {
        const employees = await q.Employee.queryAllEmployees();
        return res.status(200).json(employees);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getEmployeeById = async (req: req, res: res) => {
    try {
        const id = parseInt(req.params.id);
        const employees = await q.Employee.queryEmployeeById(id);
        return res.status(200).json(employees);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const createEmployee = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const result = await q.Employee.createEmployee(
            payload.id,
            payload.firstName,
            payload.lastName,
            payload.persona
        );
        return res.status(201).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const updateEmployee = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const result = await q.Employee.updateEmployee(
            payload.id,
            payload.firstName,
            payload.lastName,
            payload.persona,
        );
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const deleteEmployee = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const result = await q.Employee.deleteEmployee(payload.id);
        return res.status(204).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};