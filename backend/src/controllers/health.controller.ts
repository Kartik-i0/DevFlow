import {Request, Response} from 'express'

export const getHealth = (req: Request, res: Response) => {
    console.log('health Ok');
    res.status(200).json({
        status:"success",
        message:'health is ok',
        timeStamp : new Date().toISOString()
    });
};