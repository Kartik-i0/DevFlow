import { Request, Response } from 'express';
import prisma from '../config/db';

//POST /api/v1/projects - Create a new  project 
export const createProject = async (req: Request, res: Response) => {
    try {
        const { title, description, status, userId } = req.body;

        const project = await prisma.project.create({
            data: {
                title,
                description,
                status,
                userId
            }
        });

        res.status(201).json({
            status: 'success',
            data: project
        });

    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
};

// GET /api/v1/projects - Get all projects
export const getProjects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
                tasks: true
            }
        });

        res.status(200).json({
            status: 'success',
            count: projects.length,
            data: projects
        });

    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
};


//GET /api/v1/projects/:id - fetch singlee project with tasks. 
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findUnique({
            where: { id: id as string},
            include: {
                tasks: true,
                user: { select: { id: true, name: true, email: true } }
            }
        });

        if(!project) {
            return res.status(404).json({
                status: 'fail',
                message: 'Project not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: project
        });
    } catch (error: any) {
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};