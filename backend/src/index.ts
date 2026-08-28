import express ,{Request, Response} from 'express';
import  dotenv from 'dotenv';

//Load environment variables from .env 
dotenv.config();


import healthRouter from './routes/health.routes'
import userRouter from './routes/user.routes';

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());

//API routes 
app.use("/health", healthRouter);
app.use("/api/v1/users", userRouter);


app.get('/',(req:Request,res:Response)=>{
    res.json("server is running...");
    console.log(".........working");
});

app.listen(PORT, ()=>{
    console.log(`App is Listening on the port ${PORT}`)
})