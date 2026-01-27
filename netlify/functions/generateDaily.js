import { promises as fs } from 'fs';
import path from 'path';

const ARCHIVE_PATH = path.join('/tmp', 'archive.json');

async function loadArchive() {
  try {
    const data = await fs.readFile(ARCHIVE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

async function saveArchive(archive) {
  await fs.writeFile(ARCHIVE_PATH, JSON.stringify(archive, null, 2));
}

async function archiveYesterday(todayIdeas) {
  const archive = await loadArchive();
  
  // Get yesterday's date in YYYY-MM-DD format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.getFullYear() + '-' + 
                          String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(yesterday.getDate()).padStart(2, '0');
  
  // Only archive if we don't already have yesterday's data
  if (!archive[yesterdayString] && todayIdeas && todayIdeas.length > 0) {
    console.log(`Archiving yesterday's date: ${yesterdayString}`);
    archive[yesterdayString] = todayIdeas;
    await saveArchive(archive);
  }
  
  return archive;
}

export const handler = async (event) => {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'OpenAI API key not configured',
        ideas: getFallbackIdeas()
      })
    };
  }

  try {
    // Archive yesterday's ideas first (using current latest as yesterday's data)
    try {
      const currentLatest = await loadLatest();
      if (currentLatest && currentLatest.length > 0) {
        await archiveYesterday(currentLatest);
      }
    } catch (err) {
      console.log('No previous data to archive');
    }

    // Generate today's new ideas
    const ideas = await generateIdeas(openaiKey);
    
    // Save as latest
    await saveLatest(ideas);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ideas)
    };

  } catch (error) {
    console.error('Generation failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate ideas',
        ideas: getFallbackIdeas()
      })
    };
  }
};

async function loadLatest() {
  try {
    const data = await fs.readFile(path.join('/tmp', 'latest.json'), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveLatest(ideas) {
  await fs.writeFile(path.join('/tmp', 'latest.json'), JSON.stringify(ideas, null, 2));
}

async function generateIdeas(apiKey) {
  const systemPrompt = `You are an AI assistant that generates playful, vibe-coder-friendly side quest ideas for indie builders.

Generate exactly 5 project ideas with this distribution:
- 2 thoughtful indie hacker / solo builder prompts (40%)
- 1 early-stage product opportunity (20%)
- 2 creative experiments & playful tools (40%)

Each idea should be:
- Conversational and playful in tone
- Concrete and buildable (weekend project scale)
- Specific enough to start immediately
- Inspiring without being intimidating

Format each idea as JSON with:
- title: A conversational question or observation (not a product pitch)
- murmur: Why this exists (2-3 sentences, casual tone)
- quest: What to actually build (concrete, 2-3 sentences)
- worth: Array of 3 short reasons why it's worth building
- difficulty: "Easy", "Medium", or "Hard"
- sources: Empty array (will be filled with actual signals later)

Output ONLY valid JSON array, no markdown fences.`;

  const userPrompt = `Generate 5 diverse side quest ideas for indie builders right now. Make them feel fresh, playful, and immediately buildable.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  const cleanedContent = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const ideas = JSON.parse(cleanedContent);
  
  return ideas;
}

function getFallbackIdeas() {
  return [
    {
      title: "What If My Git Commits Had Moods?",
      murmur: "Every commit tells a story, but most commit messages are dry and functional. What if your commits could express emotion, frustration, or celebration?",
      quest: "Build a CLI tool that analyzes commit messages and assigns them emotional tags (😤 frustrated, 🎉 celebrating, 🤔 exploring). Generate a mood timeline for your projects.",
      worth: [
        "Makes commit history actually fun to look at",
        "Could reveal interesting patterns about your coding sessions",
        "Great conversation starter for team retrospectives"
      ],
      difficulty: "Easy",
      sources: []
    },
    {
      title: "Can I Turn My Browser Tabs Into a Garden?",
      murmur: "Tab hoarding is real, and closing tabs feels like throwing away ideas. What if instead of managing tabs, you could grow them into something beautiful?",
      quest: "Build a browser extension that visualizes open tabs as plants in a garden. The longer a tab stays open, the more it grows. Close tabs to 'harvest' them into a reading list.",
      worth: [
        "Gamifies tab management in a delightful way",
        "Encourages mindful browsing without guilt",
        "Could evolve into a productivity/focus tool"
      ],
      difficulty: "Medium",
      sources: []
    },
    {
      title: "What If Code Reviews Were Voice Memos?",
      murmur: "Text-based code reviews can feel cold and slow. Sometimes you just want to talk through your thoughts while looking at the code.",
      quest: "Build a tool that lets developers record voice memos while reviewing code, with timestamps that link directly to specific lines. Reviewees can listen and respond async.",
      worth: [
        "More human and nuanced than text comments",
        "Faster for complex explanations",
        "Could reduce back-and-forth in PRs"
      ],
      difficulty: "Hard",
      sources: []
    },
    {
      title: "Can My README Predict Its Own Stars?",
      murmur: "Some READMEs are magnetic, others get ignored. What patterns actually drive engagement?",
      quest: "Train a simple ML model on thousands of GitHub READMEs to predict star count based on structure, writing style, and content. Build a tool that scores your README and suggests improvements.",
      worth: [
        "Practical application of ML on real data",
        "Helps builders write better project descriptions",
        "Could surface surprising patterns in developer marketing"
      ],
      difficulty: "Medium",
      sources: []
    },
    {
      title: "What If My Portfolio Was a Choose-Your-Own-Adventure?",
      murmur: "Traditional portfolios are boring linear scrolls. What if visitors could explore your work like a game?",
      quest: "Build an interactive portfolio where each project is a 'room' visitors can enter. Choices lead to different paths, hidden easter eggs, and a unique narrative experience.",
      worth: [
        "Memorable and shareable",
        "Shows creativity and technical skills simultaneously",
        "Could become a template others want to use"
      ],
      difficulty: "Easy",
      sources: []
    }
  ];
}
