export interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    naughtyPoints: number;
  }[];
}

export interface ScanResult {
  verdict: 'NAUGHTY' | 'NICE';
  message: string;
  score: number;
}