
import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { Question } from './types';
import { questions } from './data/questions';

// Database connection
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    
    try {
      await mongoose.connect(process.env.MONGODB_URI!, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        family: 4 // Force IPv4
      });
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw new Error('Database connection failed');
    }
  };

// Database schema
const scanResultSchema = new mongoose.Schema({
  name: String,
  verdict: String,
  message: String,
  score: Number,
  country: String,
  timestamp: { type: Date, default: Date.now },
});

const ScanResult = mongoose.model('ScanResult', scanResultSchema);

// CORS headers configuration
const setCorsHeaders = (res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://santas-scanner-frontend.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  };

const handleOptions = (res: VercelResponse) => {
    setCorsHeaders(res);
    res.status(200).end();
  };

// Route handlers
const handleQuestions = async (res: VercelResponse) => {
    try {
        res.status(200).json(questions);
      } catch (error) {
        console.error('Questions handler error:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
      }
};

const handleScanResults = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const scanResult = new ScanResult(req.body);
    await scanResult.save();
    res.status(201).json(scanResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save scan result' });
  }
};

const handleLeaderboard = async (res: VercelResponse) => {
  try {
    const leaderboard = await ScanResult.find().sort({ score: -1 }).exec();
    res.status(200).json(leaderboard || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
};

// Main request handler
export default async (req: VercelRequest, res: VercelResponse) => {
    try {
        // Handle OPTIONS first
        if (req.method === 'OPTIONS') {
          setCorsHeaders(res);
          return res.status(200).end();
        }
    
        setCorsHeaders(res);
    
        // Route requests
        switch (req.url) {
          case '/questions':
            await handleQuestions(res);
            break;
          case '/scan-results':
            await connectDB();
            if (req.method === 'POST') {
              await handleScanResults(req, res);
            } else {
              res.status(405).json({ error: 'Method not allowed' });
            }
            break;
          case '/leaderboard':
            await connectDB();
            if (req.method === 'GET') {
              await handleLeaderboard(res);
            } else {
              res.status(405).json({ error: 'Method not allowed' });
            }
            break;
          default:
            res.status(404).json({ error: 'Endpoint not found' });
        }
      } catch (error) {
        console.error(error);
        setCorsHeaders(res); 
        res.status(500).json({ error: 'Internal server error' });
      }
};