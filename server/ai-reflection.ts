import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/api/ai-reflection', (_req, res) => {
  res.json({ message: 'AI reflection server is running' });
});

app.post('/api/ai-reflection', async (req, res) => {
  const { thought, evidence, balancedPerspective } = req.body;

  console.log('AI request received:', {
    thought,
    evidence,
    balancedPerspective,
    hasToken: Boolean(process.env.HF_TOKEN),
  });

  if (!process.env.HF_TOKEN) {
    return res.status(500).json({
      error: 'Missing HF_TOKEN in .env.local',
    });
  }

  if (!thought || !balancedPerspective) {
    return res.status(400).json({
      error: 'Missing reflection data',
    });
  }

  const prompt = `
You are Perspekta's AI Balanced Reflection assistant.

Write a realistic, compassionate, non-coddling reflection.

Rules:
- Do not exaggerate praise.
- Do not say everything is okay.
- Do not give therapy, diagnosis, or medical advice.
- Use the user's evidence.
- Gently challenge extreme words like always, never, everything, nothing.
- Keep it 4-6 sentences.
- End with one small realistic next step.

Original thought:
"${thought}"

Evidence:
${evidence.map((item: string) => `- ${item}`).join('\n')}

User's balanced perspective:
"${balancedPerspective}"
`;

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 220,
            temperature: 0.6,
            return_full_text: false,
          },
        }),
      }
    );

    const data = await response.json();

    console.log('HF status:', response.status);
    console.log('HF response:', data);

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Hugging Face request failed',
        details: data,
      });
    }

    const aiReflection =
      data?.[0]?.generated_text ||
      'AI reflection could not be generated right now. Your own balanced perspective is still saved.';

    return res.json({ aiReflection });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'AI reflection failed',
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI server running on http://localhost:${PORT}`);
});