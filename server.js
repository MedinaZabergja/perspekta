import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash'; // or 'gemini-2.5-flash-preview-04-17' for latest

app.post('/api/reflect', async (req, res) => {
  const { thought, evidence, balancedPerspective } = req.body;

  const prompt = `The user had this negative thought: "${thought}"
Evidence against it: ${evidence.join(', ')}
Their balanced perspective: "${balancedPerspective}"

Write a brief, compassionate AI reflection (2-3 sentences) validating their effort and perspective. Be warm, encouraging, and human.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    const reflection = result.candidates?.[0]?.content?.parts?.[0]?.text || 
      'Your balanced perspective shows real strength and self-awareness.';

    res.json({ reflection });
  } catch (error) {
    console.error('AI Reflection Error:', error);
    res.status(500).json({ 
      error: 'AI reflection could not be generated, but your balanced perspective is still saved.' 
    });
  }
});

app.listen(3001, () => console.log('✅ Proxy server running on http://localhost:3001'));