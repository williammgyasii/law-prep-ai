import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function summarizeNotes(notes: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return getMockResponse("summary", notes);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an LSAT study assistant. Summarize the following study notes into a clear, concise summary. Use simple language and highlight key takeaways. Label your response as AI-generated study support.",
      },
      { role: "user", content: notes },
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || "Unable to generate summary.";
}

export async function explainSimply(
  title: string,
  notes: string,
  tags: string[]
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return getMockResponse("explain", notes);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an LSAT tutor. Explain the following concept as if teaching a beginner. Use analogies, examples, and simple language. Label your response as AI-generated study support.",
      },
      {
        role: "user",
        content: `Topic: ${title}\nTags: ${tags.join(", ")}\nNotes: ${notes}`,
      },
    ],
    max_tokens: 600,
  });

  return response.choices[0]?.message?.content || "Unable to generate explanation.";
}

export async function generateQuiz(
  title: string,
  type: string,
  notes: string,
  tags: string[]
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return getMockResponse("quiz", title);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an LSAT study assistant. Generate 5 multiple-choice study questions based on the user's notes and topic. Format each question with A-D options and indicate the correct answer. These are study questions inspired by the topic, not official LSAT questions. Label your response as AI-generated study support.",
      },
      {
        role: "user",
        content: `Topic: ${title}\nType: ${type}\nTags: ${tags.join(", ")}\nNotes: ${notes}`,
      },
    ],
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || "Unable to generate quiz.";
}

export async function suggestNextLesson(
  completedTitles: string[],
  weakAreas: string[],
  availableTitles: string[]
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return getMockResponse("suggest", completedTitles.join(", "));
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an LSAT study planner. Based on what the student has completed and their weak areas, recommend the single best next lesson from the available options. Explain your reasoning briefly. Label your response as AI-generated study support.",
      },
      {
        role: "user",
        content: `Completed: ${completedTitles.join(", ")}\nWeak areas: ${weakAreas.join(", ")}\nAvailable: ${availableTitles.join(", ")}`,
      },
    ],
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || "Unable to suggest next lesson.";
}

export async function generateStudyPlan(input: {
  availableDays: string[];
  minutesPerDay: number;
  examDate: string;
  modules: string[];
  totalResources: number;
}): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return getMockResponse("plan", JSON.stringify(input));
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an LSAT study planner. Generate a structured weekly study plan based on the student's availability and modules. Be specific about which days to study which topics. Label your response as AI-generated study support.",
      },
      {
        role: "user",
        content: `Available days: ${input.availableDays.join(", ")}\nMinutes per day: ${input.minutesPerDay}\nExam date: ${input.examDate}\nModules: ${input.modules.join(", ")}\nTotal resources: ${input.totalResources}`,
      },
    ],
    max_tokens: 800,
  });

  return response.choices[0]?.message?.content || "Unable to generate study plan.";
}

function getMockResponse(type: string, _input: string): string {
  const prefix = "⚠️ *AI-Generated Study Support (Mock — no API key set)*\n\n";

  switch (type) {
    case "summary":
      return `${prefix}**Summary of Your Notes:**\n\n• The key concept here involves identifying the logical structure of arguments\n• Focus on finding the conclusion first, then map the supporting premises\n• Watch for common flaws: correlation vs causation, hasty generalizations\n• Practice identifying assumption gaps between premises and conclusions`;

    case "explain":
      return `${prefix}**Simple Explanation:**\n\nThink of a logical argument like a bridge. The conclusion is where you want to get to (the other side), and the premises are the planks that get you there. An assumption is a missing plank — the argument only works if that plank exists, even though nobody mentioned it.\n\nFor example: "It rained, so the game is cancelled." The hidden assumption? That games get cancelled when it rains. If they play rain or shine, the argument falls apart.`;

    case "quiz":
      return `${prefix}**Practice Quiz:**\n\n1. What is the primary purpose of identifying the conclusion in an LSAT argument?\n   A) To find the author's opinion\n   B) To determine what the premises are trying to support\n   C) To identify factual errors\n   D) To summarize the passage\n   **Answer: B**\n\n2. Which of the following is a necessary assumption?\n   A) A statement that must be true for the conclusion to follow\n   B) A statement that strengthens the argument\n   C) A restatement of the conclusion\n   D) Evidence that contradicts the premise\n   **Answer: A**\n\n3. "All dogs are mammals. Rex is a dog. Therefore, Rex is a mammal." This is an example of:\n   A) Inductive reasoning\n   B) Deductive reasoning\n   C) Analogical reasoning\n   D) Causal reasoning\n   **Answer: B**`;

    case "suggest":
      return `${prefix}**Recommended Next Lesson:**\n\nBased on your progress, I recommend focusing on **Strengthen & Weaken Questions** next. You've built a solid foundation with argument structure, and this topic directly builds on identifying assumptions — which is where many students need the most practice.`;

    case "plan":
      return `${prefix}**Your Weekly Study Plan:**\n\n**Monday** — Logical Reasoning: Assumption Questions (45 min)\n**Tuesday** — Reading Comprehension: Main Point & Structure (45 min)\n**Wednesday** — Logic Games: Sequencing Basics (45 min)\n**Thursday** — Logical Reasoning: Strengthen/Weaken (45 min)\n**Friday** — Timed Practice Set (60 min)\n**Saturday** — Review Mistakes & Weak Areas (30 min)\n**Sunday** — Rest or light review`;

    default:
      return `${prefix}Mock response for: ${type}`;
  }
}
