import { promises as fs } from 'fs';
import path from 'path';

const ARCHIVE_PATH = path.join('/tmp', 'archive.json');

// Hardcoded fallback archive with Jan 23, 24, 25
const FALLBACK_ARCHIVE = {
  "2026-01-23": [
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
  ],
  "2026-01-24": [
    {
      title: "What If Slack Had a 'Vibe Check' Command?",
      murmur: "Team morale is hard to gauge remotely. What if you could instantly poll the room's energy without forcing anyone to speak up?",
      quest: "Build a Slack bot with a /vibecheck command that sends an anonymous emoji poll. Team members react with their current mood, and the bot aggregates and visualizes the results.",
      worth: [
        "Low-friction way to check in on team wellness",
        "Anonymous participation removes pressure",
        "Could inform meeting timing or workload decisions"
      ],
      difficulty: "Easy",
      sources: []
    },
    {
      title: "Can My Calendar Predict When I'll Burn Out?",
      murmur: "Burnout sneaks up slowly through back-to-back meetings and no breathing room. What if your calendar could warn you before it's too late?",
      quest: "Build a tool that analyzes your calendar patterns and calculates a 'burnout risk score' based on meeting density, late-night work, and recovery time. Send weekly reports with suggestions.",
      worth: [
        "Proactive rather than reactive mental health support",
        "Data-driven insights about work patterns",
        "Could integrate with team scheduling tools"
      ],
      difficulty: "Medium",
      sources: []
    },
    {
      title: "What If Documentation Wrote Itself From Slack?",
      murmur: "The best project context lives in Slack threads, not in Notion docs that get outdated. What if we could automate the translation?",
      quest: "Build a tool that watches designated Slack channels, identifies decision threads or technical explanations, and auto-generates draft documentation that can be reviewed and published to your wiki.",
      worth: [
        "Reduces documentation burden dramatically",
        "Captures decisions in real-time",
        "Could work with existing tools like Notion, Confluence"
      ],
      difficulty: "Hard",
      sources: []
    },
    {
      title: "Can I Gamify My Learning Streak?",
      murmur: "Learning new skills is hard to sustain without external motivation. What if your learning had the same addictive mechanics as Wordle or Duolingo?",
      quest: "Build a personal learning tracker with daily challenges, streak counters, and achievement badges. Connect to resources like Codecademy, YouTube, or books to auto-track progress.",
      worth: [
        "Makes consistent learning feel rewarding",
        "Builds healthy habits through gamification",
        "Could become a community-driven platform"
      ],
      difficulty: "Medium",
      sources: []
    },
    {
      title: "What If My GitHub Profile Was a Trading Card?",
      murmur: "GitHub profiles are functional but boring. What if they could be collectible, shareable, and fun?",
      quest: "Build a service that turns GitHub profiles into collectible trading cards with stats, badges, and rarity levels based on repos, stars, and contributions. Let people share or 'trade' cards.",
      worth: [
        "Playful take on developer identity",
        "Encourages exploration of others' work",
        "Could become a viral developer meme"
      ],
      difficulty: "Easy",
      sources: []
    }
  ],
  "2026-01-25": [
    {
      title: "What If My Todo List Had a Shelf Life?",
      murmur: "Todo lists grow forever because we never delete things. What if tasks expired like groceries, forcing you to either do them or let them go?",
      quest: "Build a todo app where each task has an expiration date. When time runs out, the task fades away and gets archived. Review your 'expired tasks' monthly to see what really mattered.",
      worth: [
        "Encourages prioritization and focus",
        "Reduces guilt from endless lists",
        "Could reveal patterns in what you actually complete"
      ],
      difficulty: "Easy",
      sources: []
    },
    {
      title: "Can My Bookmarks Tell Me What I'm Avoiding?",
      murmur: "We save articles with the best intentions, but most bookmarks go unread. What if your saved links could reflect back your patterns and blind spots?",
      quest: "Build a tool that analyzes your bookmarks by topic, date saved, and reading status. Generate insights like 'You've saved 47 articles about productivity but read 2' with gentle nudges to act or archive.",
      worth: [
        "Self-awareness tool disguised as bookmark manager",
        "Helps declutter digital hoarding",
        "Could integrate with Pocket, Instapaper, browser bookmarks"
      ],
      difficulty: "Medium",
      sources: []
    },
    {
      title: "What If Error Messages Were Encouragement?",
      murmur: "Debugging is already hard enough. What if instead of cold stack traces, your errors gave you a pep talk?",
      quest: "Build a CLI tool or IDE extension that intercepts error messages and wraps them in encouraging language. 'TypeError on line 42' becomes 'Hey, just a small typo on line 42 - you got this!'",
      worth: [
        "Makes debugging less demoralizing for beginners",
        "Fun weekend project with instant gratification",
        "Could become a popular dev tool meme"
      ],
      difficulty: "Easy",
      sources: []
    },
    {
      title: "Can I See How My Code Smells Over Time?",
      murmur: "Code quality degrades slowly, and it's hard to see when a project starts to rot. What if you could track your codebase's 'smell' like a garden that needs weeding?",
      quest: "Build a dashboard that runs linters and complexity analyzers on your codebase weekly, then visualizes trends over time. Show which files are getting messier and which are improving.",
      worth: [
        "Proactive code health monitoring",
        "Great for solo projects or small teams",
        "Could integrate with CI/CD pipelines"
      ],
      difficulty: "Hard",
      sources: []
    },
    {
      title: "What If My Standup Notes Were a Comic Strip?",
      murmur: "Daily standups are repetitive and easy to forget. What if your updates were more visual and memorable?",
      quest: "Build a tool that converts standup notes into auto-generated comic strips using stick figures and simple illustrations. Each day becomes a frame in your project's visual story.",
      worth: [
        "Makes standups more fun and engaging",
        "Creates a visual archive of your project journey",
        "Could use AI art tools like DALL-E for illustrations"
      ],
      difficulty: "Medium",
      sources: []
    }
  ]
};

async function loadArchive() {
  try {
    const data = await fs.readFile(ARCHIVE_PATH, 'utf-8');
    const archive = JSON.parse(data);
    
    // Merge fallback data with any existing archive data
    return { ...FALLBACK_ARCHIVE, ...archive };
  } catch (err) {
    // If no archive exists yet, return fallback
    return FALLBACK_ARCHIVE;
  }
}

export const handler = async (event) => {
  try {
    const archive = await loadArchive();
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(archive)
    };
  } catch (error) {
    console.error('Archive error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load archive' })
    };
  }
};
