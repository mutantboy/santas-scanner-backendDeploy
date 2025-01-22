
import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { Question } from './types';
import { questions } from './data/questions';
import axios from 'axios';

// Database connection
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    
    try {
      await mongoose.connect("mongodb+srv://philippkhachik:root@school.42htl.mongodb.net/santas_scanner?retryWrites=true&w=majority&ssl=true&authSource=admin", {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        family: 4, // Force IPv4
        ssl: true,
        tlsAllowInvalidCertificates: false,
      });
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw new Error('Database connection failed');
    }
  };

// Database schema
const scanResultSchema = new mongoose.Schema({
    name: { type: String, required: true },
    verdict: { type: String, enum: ['NAUGHTY', 'NICE'], required: true },
    message: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    country: String,
    timestamp: { type: Date, default: Date.now }
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
      // Add validation
      const requiredFields = ['name', 'verdict', 'message', 'score'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({ error: `Missing ${field} field` });
        }
      }
  
      const scanResult = new ScanResult({
        ...req.body,
        score: Math.min(100, Math.max(0, req.body.score)) // Clamp score
      });
      
      await scanResult.validate(); // Explicit validation
      await scanResult.save();
      
      res.status(201).json(scanResult);
    } catch (error) {
      console.error('Scan result error:', error);
      res.status(400).json({ 
        error: 'Validation failed',
        details: error instanceof mongoose.Error.ValidationError 
          ? error.errors 
          : error
      });
    }
  };

const handleLeaderboard = async (res: VercelResponse) => {
    try {
      const leaderboard = await ScanResult.find()
        .sort({ score: -1 })
        .limit(100)
        .lean()
        .exec();
        
      console.log('Leaderboard results:', leaderboard);
      res.status(200).json(leaderboard);
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ error: 'Failed to retrieve leaderboard' });
    }
  };

  const handleCountry = async (req: VercelRequest, res: VercelResponse) => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,countryCode`);
      
      if (response.data.status !== 'success') {
        throw new Error('IP API failed');
      }
      
      res.status(200).json({
        countryCode: response.data.countryCode || 'XX'
      });
    } catch (error) {
      console.error('Country error:', error);
      res.status(200).json({ countryCode: 'XX' }); // Fail gracefully
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
          case '/country':
            if (req.method === 'GET') {
                await handleCountry(req, res);
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