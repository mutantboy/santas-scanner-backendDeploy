
import { Question } from './types';
import { questions } from './data/questions';

import express, { Express, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from 'mongoose';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

//app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors({
    origin: [
      'https://santasnaughtylist-5t5kgl4of-philipps-projects-fa39e004.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 84600
  }));
app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});



// GET /questions
app.get("/questions", (req: Request, res: Response) => {
  res.json(questions);
});

const { Schema } = mongoose;

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://philippkhachik:root@school.42htl.mongodb.net/?retryWrites=true&w=majority&appName=School', {

});

const scanResultSchema = new Schema({
    name: String,
    verdict: String,
    message: String,
    score: Number,
    country: String,
    timestamp: { type: Date, default: Date.now },
});

const ScanResult = mongoose.model('ScanResult', scanResultSchema);

app.post("/scan-results",  (req: Request, res: Response) => {
    try {
        
        console.log("POST /scan-results");
        console.log(req.body);
        const scanResult = new ScanResult(req.body);
         scanResult.save().then(() => {
            res.status(201).json(scanResult);
         }).catch((error) => {
             console.log(error);
            });
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to save scan result' });
    }
});

app.get("/leaderboard", async (req: Request, res: Response) => {
    try {
        const leaderboard = await ScanResult.find().sort({ score: -1 }).exec();
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve leaderboard' });
    }
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });