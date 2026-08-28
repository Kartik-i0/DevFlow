import { Request ,Response } from "express";
import prisma from "../config/db";

// POST /api/v1/tasks/create - create a task under a project 
export const createTask = async (req:Request, res:Response) => { 
    try{
        const {title, status, priority, projectId} = req.body;

        const task = await prisma.task.create({
            data:{
                title,
                status,
                priority,
                projectId
            }
        });

        res.status(201).json({
            status:"success",
            data: task
        });

    }catch(error: any){
        res.status(400).json({
            status:"error",
            message:error.message
        });
    }
};

// GET /api/v1/tasks/all - getAll tasks for a project
export const getTasksByProject = async (req:Request ,res:Response)=>{
    try {
        const {projectId} = req.params;

        const tasks = await prisma.task.findMany({
            where:{projectId: projectId as string}
        });

        res.status(200).json({
            status:"success",
            count:tasks.length,
            data:tasks    
        });
        
    } catch (error:any) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};


// PATCH /api/v1/tasks/update/:id/status -update task staus (TODO, IN_PROGRESS, DONE, CANCELLED)
export const updateTaskStatus = async (req:Request, res:Response) => {
    try {
        const {id} = req.params;
        const {status} = req.body;

        const updatedTask = await prisma.task.update({
            where: { id: id as string },
            data: { status: status as string }
        });

        return res.status(200).json({
            status: "success",
            data: updatedTask
        });

    }catch(error:any){
        res.status(400).json({
            status:"error",
            message:error.message
        });
    }
};

//DELETE api/v1/tasks/:id - delete a task
export const deleteTask = async (req:Request ,res:Response) => {
    try{
        const {id} = req.params;

        await prisma.task.delete({
            where: {id: id as string}
        });

        res.status(200).json({
            status:'success',
            message: "Task deleted successfully."
        });
    }catch(error:any){
        res.status(400).json({
            status:'error',
            message: error.message
        });
    }
 };
