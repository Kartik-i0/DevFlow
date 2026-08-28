import bcrypt from 'bcryptjs'
import { Request , Response } from "express";
import prisma from "../config/db";


// POST /api/v1/users/create  - create a new user
export const createUser = async(req:Request, res:Response ) => {
    try{
        const {name, email, password} = req.body;

        const hashedPassword = await bcrypt.hash(password,10);  

        const user = await prisma.user.create({
            data:{
                name,
                email,
                password:hashedPassword
            }
        });

        res.status(201).json({
            status: "success",
            message:"user created successfully",
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        })
    }catch(error: any){
        res.status(400).json({
            status:"error",
            message:error.message
        });
    }
};

// GET /api/v1/users/all - get all users
export const getUsers =  async (req:Request, res:Response) => {
    try{
        const users = await prisma.user.findMany();
        res.status(200).json({
            status:"success",
            count: users.length,
            data:users
        });  
    }catch(err){
        res.status(500).json({
            status:"success",
            message:"unable to fetch user"
        });
    }
};

// POST  /api/v1/user/login  
export const loginUser = async (req:Request , res:Response) => {
    try {
     const {email, password} = req.body;
     
     const user = await prisma.user.findUnique({
        where: {email}
     });

     if(!user){
        return res.status(401).json({
            status:"error",
            message:"User not found."
        });
     }

     const isPasswordValid = await bcrypt.compare(password , user.password);
     
     if(!isPasswordValid){
        return res.status(401).json({
            status:"error",
            message:"Invalid email or password"
        });
     }

     return res.status(200).json({
        status:"success",
        message:"login successful",
        data:{
            id: user.id,
            name: user.name,
            email: user.email
        }
    });

    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};



