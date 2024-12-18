
import { Question } from './types';
import { questions } from './data/questions';

import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use((req: Request, res: Response, next: NextFunction) => {
    next();
  }, cors({ maxAge: 84600 }));
app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// GET /questions
app.get("/questions", (req: Request, res: Response) => {
  res.json(questions);
});

/node_modules
/dist
.env
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*

