import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const FREE_MODELS = [
  'deepseek/deepseek-v4-flash:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'openrouter/free',
];

app.get('/api/ai-reflection', (_req, res) => {
  res.json({ message: 'Perspekta AI reflection server is running with OpenRouter' });
});

app.post('/api/ai-reflection', async (req, res) => {
  const { thought, evidence = [], balancedPerspective } = req.body;

  console.log('AI request received:', {
    thought,
    evidence,
    balancedPerspective,
    hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
  });

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: 'Missing OPENROUTER_API_KEY in .env.local',
    });
  }

  if (!thought || !balancedPerspective) {
    return res.status(400).json({
      error: 'Missing reflection data',
    });
  }

  const prompt = `You are Perspekta, a supportive but logical reflection assistant.

Your role is to help the user reframe a difficult thought in a calm, grounded way. You are warm, kind, and encouraging, but you do not coddle the user, exaggerate reassurance, or pretend everything is fine.

You follow therapist-informed communication standards:
- Validate emotions without diagnosing.
- Challenge distorted or extreme thinking gently.
- Encourage realistic, balanced thinking.
- Do not replace therapy or claim to be a therapist.
- If the user seems in serious danger, encourage them to contact a trusted person or emergency support.

User's difficult thought:
"${thought}"

Evidence the user provided:
${evidence.join(', ') || 'their own observations'}

Their balanced perspective:
"${balancedPerspective}"

Write 6-8 short sentences directly to the user using "you."

Structure:
1. Briefly name and validate the emotion.
2. Gently point out where the thought may be too extreme, incomplete, or unsupported.
3. Use the user's evidence to create a more balanced perspective.
4. Encourage the user in a realistic way.
5. End with one small concrete action they can take today.

Tone:
- Comforting but not overly soft.
- Logical but not cold.
- Kind but honest.
- Encouraging but realistic.
- Therapist-informed, but not pretending to be therapy.

Avoid:
- "Everything will be fine."
- "You are perfect."
- "You are enough."
- "Just be positive."
- Toxic positivity.
- Harsh criticism.
- Diagnosis.
- Medical or therapy claims.
- Emojis.
- Exclamation marks.

Keep it clear, gentle, and grounded.`;

  let lastError: any = null;

  for (const model of FREE_MODELS) {
    try {
      console.log(`Trying model: ${model}`);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Perspekta',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 260,
          temperature: 0.45,
          top_p: 0.85,
        }),
      });

      const data = await response.json();
      console.log(`Model ${model} — Status: ${response.status}`);

      if (!response.ok) {
        console.log(`Model ${model} failed:`, data.error?.message || JSON.stringify(data));
        lastError = { model, status: response.status, details: data };
        continue;
      }

      let rawText = data?.choices?.[0]?.message?.content?.trim() || '';
      console.log(`Raw output from ${model}:`, rawText);

      const garbagePatterns = [
        /everything will be fine/gi,
        /you are perfect/gi,
        /you are enough/gi,
        /just be positive/gi,
        /toxic positivity/gi,
        /as a therapist/gi,
        /i am a therapist/gi,
        /diagnosis/gi,
        /structure:/gi,
        /tone:/gi,
        /avoid:/gi,
        /write 6-8/gi,
        /user's difficult thought/gi,
        /evidence the user provided/gi,
        /their balanced perspective/gi,
      ];

      garbagePatterns.forEach((pattern) => {
        rawText = rawText.replace(pattern, '');
      });

      const sentenceMatches = rawText.match(/[^.!?]+[.!?]+/g);
      let sentences: string[] = [];

      if (sentenceMatches && sentenceMatches.length >= 3) {
        sentences = sentenceMatches
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 15)
          .slice(0, 8);
      } else {
        sentences = rawText
          .split(/\n+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 15)
          .slice(0, 8);
      }

      const fallbacks = generateSmartFallbacks(thought, evidence, balancedPerspective);

      while (sentences.length < 6) {
        sentences.push(fallbacks[sentences.length] || fallbacks[fallbacks.length - 1]);
      }

      sentences = sentences.map((s) => {
        return s
          .replace(/^[^a-zA-Z]+/, '')
          .replace(/\s+/g, ' ')
          .replace(/!/g, '.')
          .trim();
      });

      sentences = sentences.map((s) => {
        if (!s.match(/[.!?]$/)) return s + '.';
        return s;
      });

      const formattedReflection = sentences.join(' ');

      console.log('Formatted reflection:', formattedReflection);

      return res.json({
        aiReflection: formattedReflection,
        modelUsed: model,
      });
    } catch (error) {
      console.error(`Model ${model} threw exception:`, error);
      lastError = { model, error: String(error) };
      continue;
    }
  }

  console.error('All models failed. Using fallback.', lastError);

  const fallbackReflection = generateSmartFallbacks(
    thought,
    evidence,
    balancedPerspective
  ).join(' ');

  return res.json({
    aiReflection: fallbackReflection,
    modelUsed: 'fallback',
    warning: 'AI models unavailable. Using generated reflection.',
  });
});

function generateSmartFallbacks(
  thought: string,
  evidence: string[],
  balancedPerspective: string
): string[] {
  const thoughtLower = thought.toLowerCase();
  const evidenceText =
    evidence.length > 0 ? evidence.join(', ') : balancedPerspective;

  const isNotGoodEnough =
    thoughtLower.includes('not good enough') || thoughtLower.includes('not enough');

  const isAlwaysNever =
    thoughtLower.includes('always') ||
    thoughtLower.includes('never') ||
    thoughtLower.includes('everyone') ||
    thoughtLower.includes('no one');

  const isFailure =
    thoughtLower.includes('fail') ||
    thoughtLower.includes('failure') ||
    thoughtLower.includes('worthless') ||
    thoughtLower.includes('useless');

  const isAnxiety =
    thoughtLower.includes('worried') ||
    thoughtLower.includes('anxious') ||
    thoughtLower.includes('scared') ||
    thoughtLower.includes('afraid');

  const isAnger =
    thoughtLower.includes('angry') ||
    thoughtLower.includes('hate') ||
    thoughtLower.includes('mad');

  if (isNotGoodEnough) {
    return [
      'You seem to be feeling discouraged and unsure of yourself right now.',
      'That feeling matters, but it is not the same as proof that you are not good enough.',
      `The evidence you gave points to a more balanced view: ${evidenceText}.`,
      'A hard moment can make your mind ignore the parts that show effort, progress, or ability.',
      'A more realistic thought is that you are struggling with something specific, not failing as a person.',
      'Today, write down one thing you handled adequately and one thing you can improve next.',
    ];
  }

  if (isAlwaysNever) {
    return [
      'You seem overwhelmed, and your mind is using very absolute language.',
      'Words like always, never, everyone, and no one usually make a situation sound more final than it really is.',
      `Your own evidence gives the situation more nuance: ${evidenceText}.`,
      'That means the thought may contain some emotion, but it is not fully accurate.',
      'A more balanced view is that this situation is difficult, but not completely fixed or hopeless.',
      'Today, find one exception to the absolute thought and write it down clearly.',
    ];
  }

  if (isFailure) {
    return [
      'You seem to be judging yourself very harshly right now.',
      'That judgment may feel convincing, but it is broader than the evidence supports.',
      `The evidence you gave shows another side of the situation: ${evidenceText}.`,
      'One mistake, setback, or painful moment does not define your whole ability.',
      'A more balanced view is that you are facing a problem, not that you are the problem.',
      'Today, choose one small task you can complete to create evidence of movement.',
    ];
  }

  if (isAnxiety) {
    return [
      'You seem anxious, and your mind is trying to predict what could go wrong.',
      'That reaction is understandable, but predictions are not the same as facts.',
      `The evidence you gave creates a calmer picture: ${evidenceText}.`,
      'Anxiety often focuses on the worst outcome and makes other possibilities harder to see.',
      'A more balanced view is that something may be uncertain, but it is not automatically unsafe or doomed.',
      'Today, write one worry, one fact, and one action you can take next.',
    ];
  }

  if (isAnger) {
    return [
      'You seem angry, and that may be pointing to something important.',
      'Anger can show that a boundary, need, or expectation matters to you.',
      `The evidence you gave helps slow the situation down: ${evidenceText}.`,
      'The feeling deserves attention, but the first reaction is not always the clearest response.',
      'A more balanced view is that you can respect the feeling without letting it choose your next move.',
      'Today, wait ten minutes before responding and write the main point you want to communicate.',
    ];
  }

  return [
    'You seem to be carrying a difficult thought right now.',
    'That feeling is real, but the thought may not be the full truth.',
    `The evidence you gave points to a more balanced view: ${evidenceText}.`,
    'A painful thought can feel like a fact when emotions are strong.',
    'A more grounded perspective is that this situation has more than one possible interpretation.',
    'Today, take one small action that matches the balanced perspective you already wrote.',
  ];
}

app.listen(PORT, () => {
  console.log(`Perspekta AI server running on http://localhost:${PORT}`);
});