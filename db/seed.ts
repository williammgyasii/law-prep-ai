import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  modules,
  resources,
} from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("Cleaning existing module/resource data...");
  await db.delete(resources);
  await db.delete(modules);

  console.log("Creating modules...");

  const [foundations] = await db
    .insert(modules)
    .values({
      title: "LSAT Foundations",
      description: "Core LSAT concepts, test format, scoring, and argument structure basics.",
      order: 1,
      color: "#4f46e5",
      icon: "BookOpen",
      source: "lsac",
      sourceUrl: "https://www.lsac.org/lsat",
    })
    .returning();

  const [logicalReasoning] = await db
    .insert(modules)
    .values({
      title: "Logical Reasoning",
      description: "Master the most heavily tested section: identify conclusions, assumptions, flaws, and strengthen/weaken patterns.",
      order: 2,
      color: "#06b6d4",
      icon: "Brain",
      source: "lsac",
      sourceUrl: "https://www.lsac.org/lsat/taking-lsat/test-format/logical-reasoning",
    })
    .returning();

  const [readingComp] = await db
    .insert(modules)
    .values({
      title: "Reading Comprehension",
      description: "Develop strategies for dense academic passages, main point identification, and inference questions.",
      order: 3,
      color: "#f59e0b",
      icon: "FileText",
      source: "lsac",
      sourceUrl: "https://www.lsac.org/lsat/taking-lsat/test-format/reading-comprehension",
    })
    .returning();

  const [logicGames] = await db
    .insert(modules)
    .values({
      title: "Analytical Reasoning (Logic Games)",
      description: "Sequencing, grouping, matching, and hybrid games with diagramming techniques.",
      order: 4,
      color: "#10b981",
      icon: "Puzzle",
      source: "lsac",
      sourceUrl: "https://www.lsac.org/lsat/taking-lsat/test-format/analytical-reasoning",
    })
    .returning();

  const [writing] = await db
    .insert(modules)
    .values({
      title: "LSAT Argumentative Writing",
      description: "Practice the 50-minute timed argumentative essay that law schools receive with your LSAT score.",
      order: 5,
      color: "#8b5cf6",
      icon: "PenLine",
      source: "lsac",
      sourceUrl: "https://www.lsac.org/lsat/lsat-dates-deadlines-score-release-dates/lsat-argumentative-writing",
    })
    .returning();

  const [testStrategy] = await db
    .insert(modules)
    .values({
      title: "Test Strategy & Scoring",
      description: "Timing strategies, score conversion, section management, and test-day preparation.",
      order: 6,
      color: "#f43f5e",
      icon: "Target",
      source: "lsac",
      sourceUrl: "https://www.lsac.org/lsat/taking-lsat/about-the-lsat",
    })
    .returning();

  console.log("Creating resources with content...");

  const resourceData = [
    // ─── FOUNDATIONS ─────────────────────────────────────
    {
      title: "Understanding the LSAT Format",
      description: "Complete overview of the LSAT format, sections, timing, and what to expect on test day.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format",
      type: "article" as const,
      difficulty: "easy" as const,
      estimatedMinutes: 15,
      moduleId: foundations.id,
      tags: ["intro", "format", "overview"],
      order: 1,
      source: "lsac",
      content: `# Understanding the LSAT Format

The Law School Admission Test (LSAT) is the standardized test required for admission to law schools approved by the American Bar Association. Understanding its format is your first step toward effective preparation.

## Test Structure

The LSAT consists of multiple-choice sections and a writing sample:

- **Logical Reasoning (2 sections):** Each section contains 24-26 questions to be completed in 35 minutes. These sections test your ability to analyze, evaluate, and complete arguments.

- **Reading Comprehension (1 section):** Contains 4 sets of reading passages with 26-28 questions total, completed in 35 minutes. One set is a comparative reading pair.

- **Analytical Reasoning / Logic Games (1 section):** Contains 4 games with 22-24 questions, completed in 35 minutes. Tests your ability to understand relationships and draw conclusions.

- **Unscored Variable Section:** One additional section (LR, RC, or AR) that is unscored and used for test development. You won't know which section is unscored.

- **LSAT Argumentative Writing:** A 50-minute essay administered separately. Not scored but sent to law schools.

## Scoring

The LSAT is scored on a scale of 120-180. Your raw score (number of correct answers) is converted to this scaled score. There is no penalty for wrong answers, so you should answer every question.

## Key Facts

- Total test time: approximately 3 hours 30 minutes (plus breaks)
- All questions are multiple choice with 5 answer choices
- The test is administered digitally on a tablet
- You can take the LSAT up to 3 times in a single testing year
- Most law schools accept the highest score`,
    },
    {
      title: "How LSAT Scoring Works",
      description: "Understanding raw scores, scaled scores, percentiles, and what your target score should be.",
      url: "https://www.lsac.org/lsat/taking-lsat/about-the-lsat/scoring",
      type: "article" as const,
      difficulty: "easy" as const,
      estimatedMinutes: 12,
      moduleId: foundations.id,
      tags: ["scoring", "percentiles", "target-score"],
      order: 2,
      source: "lsac",
      content: `# How LSAT Scoring Works

## Raw Score to Scaled Score

Your raw score is simply the total number of questions you answered correctly across all scored sections (approximately 99-102 questions). This raw score is then converted to the LSAT scaled score (120-180) using a conversion table that varies slightly between test administrations.

## Score Percentiles

Your percentile indicates what percentage of test-takers scored below you:

- 180: 99.9th percentile
- 175: 99th percentile
- 170: 97th percentile
- 165: 92nd percentile
- 160: 80th percentile
- 155: 67th percentile
- 150: 44th percentile
- The median score is approximately 151

## Setting Your Target Score

Research the median LSAT scores for your target law schools. Top-14 law schools typically require scores of 170+, while most accredited schools have medians between 150-165.

## Important Scoring Facts

- There is NO penalty for guessing — answer every question
- Each question is worth the same amount regardless of difficulty
- The unscored section does not affect your score
- Score bands: LSAC reports a score band (±3 points) to account for measurement error
- Score cancellation: You can cancel your score within 6 calendar days after the test`,
    },
    {
      title: "Argument Structure Fundamentals",
      description: "Learn to identify conclusions, premises, and assumptions — the building blocks of LSAT reasoning.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/logical-reasoning",
      type: "lesson" as const,
      difficulty: "easy" as const,
      estimatedMinutes: 30,
      moduleId: foundations.id,
      tags: ["arguments", "premises", "conclusions", "assumptions"],
      order: 3,
      source: "lsac",
      content: `# Argument Structure Fundamentals

Every LSAT argument has the same basic structure. Mastering this structure is essential for Logical Reasoning success.

## The Three Components

### 1. Conclusion
The main point the author is trying to establish. Signal words include: therefore, thus, hence, consequently, so, it follows that, this shows that, clearly, must be.

### 2. Premises
The evidence or reasons offered in support of the conclusion. Signal words include: because, since, given that, for, as indicated by, due to, after all.

### 3. Assumptions
Unstated beliefs that must be true for the argument to work. The gap between what the premises state and what the conclusion claims.

## How to Identify the Conclusion

Ask yourself: "What is the author trying to convince me of?" The conclusion is the claim being argued for, not the evidence being cited.

Common traps:
- The conclusion is not always the last sentence
- Subsidiary conclusions can support the main conclusion
- Some passages are just descriptions with no argument

## The Role of Assumptions

An assumption bridges the gap between premises and conclusion. For example:

Premise: All dogs are mammals.
Premise: Rex is a dog.
Conclusion: Rex needs food and water.

The assumption here is that all mammals need food and water. The argument doesn't state this — it assumes it.

## Practice Strategy

For every argument you encounter:
1. Find the conclusion first
2. Identify the premises that support it
3. Ask: "What must be true for this argument to work?"
4. That gap is the assumption`,
    },
    {
      title: "Formal Logic: Conditional Reasoning",
      description: "If-then statements, contrapositives, and sufficient vs. necessary conditions on the LSAT.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/logical-reasoning",
      type: "lesson" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 40,
      moduleId: foundations.id,
      tags: ["formal-logic", "conditionals", "contrapositive", "sufficient", "necessary"],
      order: 4,
      source: "lsac",
      content: `# Formal Logic: Conditional Reasoning

Conditional reasoning appears throughout the LSAT. Understanding it thoroughly gives you a major advantage.

## The Basic Conditional

"If A, then B" means: whenever A occurs, B must also occur.

- A is the SUFFICIENT condition (it's enough to guarantee B)
- B is the NECESSARY condition (it must happen if A happens)

Notation: A → B

## Valid Inferences

From "If A, then B" you can validly conclude:

### Contrapositive (ALWAYS VALID)
If not B, then not A.
~B → ~A

Example: "If it rains, the ground is wet."
Contrapositive: "If the ground is not wet, it did not rain."

## Invalid Inferences

### Converse (INVALID)
If B, then A.
Just because the ground is wet doesn't mean it rained (could be a sprinkler).

### Inverse (INVALID)
If not A, then not B.
Just because it didn't rain doesn't mean the ground isn't wet.

## Sufficient vs. Necessary on the LSAT

"Only if" introduces a NECESSARY condition:
"You can vote only if you are 18" → Vote → 18+

"If" introduces a SUFFICIENT condition:
"If you are a citizen, you can vote" → Citizen → Can vote

"Unless" = "If not":
"You can't vote unless you register" → ~Register → ~Vote
Equivalent to: Vote → Register

## Common LSAT Conditional Indicators

Sufficient triggers: if, when, whenever, every, all, any, each
Necessary triggers: only if, must, required, necessary, unless (= if not)

## Chain Reasoning

If A → B and B → C, then A → C
Contrapositive: ~C → ~A`,
    },

    // ─── LOGICAL REASONING ──────────────────────────────
    {
      title: "Logical Reasoning: Question Types Overview",
      description: "Comprehensive guide to all LR question types and how to approach each one.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/logical-reasoning",
      type: "lesson" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 35,
      moduleId: logicalReasoning.id,
      tags: ["question-types", "strategy", "overview"],
      order: 1,
      source: "lsac",
      content: `# Logical Reasoning Question Types

The LR section tests your ability to analyze, evaluate, and complete arguments. Here are the major question types:

## 1. Must Be True / Inference Questions (~15%)
"Which of the following can be properly inferred?"
Strategy: Find what MUST follow from the given information. Eliminate anything that goes beyond the stated facts.

## 2. Assumption Questions (~14%)
"The argument assumes which of the following?"
Two subtypes:
- Necessary Assumption: Use the Negation Test — negate each answer; the one that destroys the argument is correct.
- Sufficient Assumption: The correct answer, combined with the premises, guarantees the conclusion.

## 3. Strengthen Questions (~10%)
"Which of the following, if true, most strengthens the argument?"
Strategy: Identify the assumption, then find the answer that makes the assumption more likely to be true.

## 4. Weaken Questions (~12%)
"Which of the following, if true, most weakens the argument?"
Strategy: Find the answer that attacks the assumption or shows the conclusion doesn't follow.

## 5. Flaw Questions (~14%)
"The reasoning is flawed because it..."
Strategy: Identify the logical error. Common flaws include: confusing necessary/sufficient, ad hominem, false dichotomy, hasty generalization, circular reasoning.

## 6. Method of Reasoning (~5%)
"The argument proceeds by..."
Strategy: Describe the structure abstractly. Focus on what the author DOES, not what they say.

## 7. Parallel Reasoning (~4%)
"Which argument is most similar in pattern?"
Strategy: Match the structure (conditional, causal, statistical) and the conclusion type.

## 8. Point at Issue / Disagree (~4%)
"The speakers disagree about..."
Strategy: Find a claim where one speaker would say YES and the other would say NO.

## 9. Principle Questions (~8%)
"Which principle most helps justify the argument?"
Strategy: Find a general rule that, when applied, supports the specific conclusion.

## 10. Resolve the Paradox (~5%)
"Which of the following resolves the apparent discrepancy?"
Strategy: Find the answer that explains how both seemingly contradictory facts can be true.`,
    },
    {
      title: "Mastering Assumption Questions",
      description: "Deep dive into necessary and sufficient assumptions with the Negation Test technique.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/logical-reasoning",
      type: "lesson" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 40,
      moduleId: logicalReasoning.id,
      tags: ["assumptions", "necessary", "sufficient", "negation-test"],
      order: 2,
      source: "lsac",
      content: `# Mastering Assumption Questions

Assumption questions are among the most important on the LSAT. They test whether you can identify the unstated link between premises and conclusion.

## Necessary vs. Sufficient Assumptions

### Necessary Assumption
A claim that MUST be true for the argument to work. Without it, the argument falls apart.

Question stems: "The argument assumes...", "The argument depends on the assumption that...", "Which is an assumption required by the argument?"

### Sufficient Assumption
A claim that, if true, GUARANTEES the conclusion follows. It completely fills the logical gap.

Question stems: "The conclusion follows logically if which of the following is assumed?", "Which assumption allows the conclusion to be properly drawn?"

## The Negation Test (for Necessary Assumptions)

This is your most powerful tool:
1. Negate (logically deny) each answer choice
2. If negating an answer choice destroys the argument, that's your answer
3. If negating it has no effect, eliminate it

Example:
Premise: All students who pass the bar exam studied hard.
Conclusion: Maria will pass the bar exam.

Test answer: "Maria studied hard"
Negate: "Maria did NOT study hard"
Result: The argument is destroyed — she can't pass without studying hard.
This IS a necessary assumption.

## Common Assumption Patterns

1. **Term Shift:** The conclusion uses a term not in the premises. The assumption connects them.
2. **Overlooked Possibility:** The argument ignores an alternative explanation.
3. **Representativeness:** The argument assumes a sample represents the whole.
4. **Causation from Correlation:** The argument assumes A causes B just because they occur together.

## Strategy Summary

For Necessary Assumptions: Use the Negation Test
For Sufficient Assumptions: Find the answer that bridges the COMPLETE gap between premises and conclusion`,
    },
    {
      title: "Strengthen and Weaken Questions",
      description: "Techniques for evaluating answer choices that strengthen or weaken arguments.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/logical-reasoning",
      type: "lesson" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 35,
      moduleId: logicalReasoning.id,
      tags: ["strengthen", "weaken", "evaluation"],
      order: 3,
      source: "lsac",
      content: `# Strengthen and Weaken Questions

These questions ask you to find information that makes an argument more or less convincing.

## Strengthen Questions

"Which of the following, if true, most strengthens the argument?"

Strategy:
1. Identify the conclusion and the assumption
2. The correct answer supports the assumption or provides additional evidence for the conclusion
3. The answer doesn't need to PROVE the conclusion — just make it more likely

## Weaken Questions

"Which of the following, if true, most seriously undermines the argument?"

Strategy:
1. Identify the conclusion and the assumption
2. The correct answer attacks the assumption or shows an alternative explanation
3. The answer doesn't need to DISPROVE the conclusion — just make it less likely

## Key Principle: "If True"

Always accept the answer choices as true. Don't evaluate whether an answer choice is actually true in the real world. Your job is to determine its EFFECT on the argument.

## Common Weakening Patterns

- **Alternative Cause:** Shows another explanation for the observed effect
- **Broken Analogy:** Shows the comparison doesn't hold
- **Statistical Problem:** Shows the data is flawed or unrepresentative
- **Counterexample:** Provides a case that contradicts the conclusion

## Common Strengthening Patterns

- **Eliminates Alternative:** Rules out other explanations
- **Confirms Assumption:** Directly supports the unstated link
- **Additional Evidence:** Provides more data supporting the conclusion
- **Addresses Weakness:** Preemptively handles a potential objection

## Trap Answers

- Answers that are true but irrelevant to the specific argument
- Answers that strengthen when you need to weaken (or vice versa)
- Answers that address a different conclusion than the one in the argument`,
    },
    {
      title: "Identifying Logical Flaws",
      description: "Common logical fallacies tested on the LSAT and how to recognize them.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/logical-reasoning",
      type: "lesson" as const,
      difficulty: "hard" as const,
      estimatedMinutes: 40,
      moduleId: logicalReasoning.id,
      tags: ["flaws", "fallacies", "reasoning-errors"],
      order: 4,
      source: "lsac",
      content: `# Identifying Logical Flaws

Flaw questions ask you to identify the error in reasoning. These are among the most common LR question types.

## The Most Common LSAT Flaws

### 1. Confusing Necessary and Sufficient Conditions
"Because A is sufficient for B, the argument concludes that A is necessary for B."
Example: "Everyone who passes studied. Therefore, studying guarantees passing."

### 2. Correlation vs. Causation
"The argument treats a correlation as evidence of causation."
Just because two things occur together doesn't mean one causes the other.

### 3. Hasty Generalization / Unrepresentative Sample
"The argument draws a broad conclusion from insufficient or unrepresentative evidence."
A survey of 10 people doesn't represent a city of millions.

### 4. Part-to-Whole / Whole-to-Part
"What is true of the parts must be true of the whole" (or vice versa).
Each player being excellent doesn't mean the team is excellent.

### 5. Equivocation / Ambiguity
"The argument uses a term in two different senses."
"Light" can mean "not heavy" or "illumination."

### 6. Ad Hominem
"The argument attacks the person making the claim rather than the claim itself."
"You can't trust her argument about taxes because she's wealthy."

### 7. False Dichotomy
"The argument presents only two options when more exist."
"Either we ban all cars or accept pollution" ignores electric vehicles, regulations, etc.

### 8. Circular Reasoning
"The argument's conclusion is essentially a restatement of its premise."
"This policy is good because it produces positive outcomes" (good = positive outcomes).

### 9. Appeal to Authority / Popularity
"The argument assumes something is true because an authority says so or many people believe it."

### 10. Straw Man
"The argument misrepresents an opposing position to make it easier to attack."

## Strategy for Flaw Questions

1. Read the argument and identify the conclusion
2. Find the logical gap or error
3. Describe the flaw in your own words BEFORE looking at answers
4. Match your description to the answer choices (they'll be stated abstractly)`,
    },

    // ─── READING COMPREHENSION ──────────────────────────
    {
      title: "Reading Comprehension: Suggested Approach",
      description: "LSAC's official suggested approach to RC passages and question types.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/reading-comprehension",
      type: "article" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 25,
      moduleId: readingComp.id,
      tags: ["strategy", "approach", "reading-method"],
      order: 1,
      source: "lsac",
      content: `# Reading Comprehension: Suggested Approach

The Reading Comprehension section presents four sets of passages (including one comparative reading set) with 5-8 questions each.

## The LSAC Suggested Approach

### Reading the Passage

1. **Read for structure, not memorization.** You can always refer back to the passage. Focus on understanding the author's main point, the purpose of each paragraph, and the overall organization.

2. **Identify the author's attitude.** Is the author neutral, supportive, critical, or ambivalent? This is frequently tested.

3. **Note key structural elements:**
   - Main thesis/argument
   - Supporting evidence and examples
   - Counterarguments or opposing views
   - Transitions and shifts in focus

4. **Don't get bogged down in details.** Note WHERE details are discussed so you can find them quickly, but don't try to memorize them.

## Question Types

### Main Point Questions
"Which of the following best expresses the main idea?"
The correct answer captures the central thesis without being too broad or too narrow.

### Detail/Specific Information Questions
"According to the passage, which of the following is true?"
Go back to the passage and find the specific reference. The answer will be directly stated or closely paraphrased.

### Inference Questions
"It can be inferred from the passage that the author would agree with..."
The answer must be supported by the passage but may not be explicitly stated. Be conservative — don't go beyond what the text supports.

### Author's Attitude/Tone Questions
"The author's attitude toward X can best be described as..."
Look for evaluative language: adjectives, adverbs, and qualifying phrases that reveal the author's perspective.

### Function/Purpose Questions
"The author mentions X primarily in order to..."
Ask WHY the author included this information. What role does it play in the argument?

### Organization Questions
"Which of the following best describes the organization of the passage?"
Map the purpose of each paragraph and match it to the answer choice.

## Comparative Reading

One set will have two shorter passages on a related topic. Additional question types include:
- How the passages relate to each other
- Points of agreement or disagreement between the authors
- How one author would respond to the other's argument`,
    },
    {
      title: "Tackling Dense Academic Passages",
      description: "Strategies for science, law, and humanities passages that use complex vocabulary.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/reading-comprehension",
      type: "lesson" as const,
      difficulty: "hard" as const,
      estimatedMinutes: 30,
      moduleId: readingComp.id,
      tags: ["science", "technical", "dense-passages", "vocabulary"],
      order: 2,
      source: "lsac",
      content: `# Tackling Dense Academic Passages

LSAT RC passages come from four broad subject areas: law, humanities, natural sciences, and social sciences. Dense passages can be intimidating, but the questions test comprehension, not subject expertise.

## Science Passages

These often describe experiments, theories, or natural phenomena. Strategy:
- Focus on the CONCLUSION of the research, not the methodology details
- Understand cause-and-effect relationships
- Note any competing theories or explanations
- Don't panic about technical terms — they're usually defined or explained in context

## Law Passages

These discuss legal principles, court decisions, or policy debates. Strategy:
- Identify the legal rule or principle being discussed
- Note any exceptions or limitations
- Understand the different positions (majority vs. dissent, proponents vs. critics)
- Pay attention to the author's evaluation of the legal reasoning

## Humanities Passages

These cover art, literature, philosophy, or history. Strategy:
- Identify the author's thesis about the subject
- Note evaluative language (the author's opinion matters here)
- Understand the relationship between specific examples and broader claims

## General Tips for Dense Passages

1. **First read = big picture.** Don't try to understand every sentence. Get the main point and paragraph structure.
2. **Use paragraph purpose notes.** Mentally tag each paragraph: "introduces theory," "provides evidence," "raises objection," "author's response."
3. **Unknown terms:** If a term is defined in the passage, note the definition. If not, use context clues and move on.
4. **Time management:** Spend about 3-4 minutes reading, 4-5 minutes on questions. If a passage is extremely difficult, consider doing it last.`,
    },
    {
      title: "Comparative Reading Technique",
      description: "Strategy for paired passage questions and comparative analysis.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/reading-comprehension",
      type: "lesson" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 25,
      moduleId: readingComp.id,
      tags: ["comparative", "paired-passages", "strategy"],
      order: 3,
      source: "lsac",
      content: `# Comparative Reading Technique

One of the four RC sets features two shorter passages (Passage A and Passage B) on a related topic. These require you to understand each passage individually AND their relationship to each other.

## Reading Strategy

1. Read Passage A first and note its main point and the author's position
2. Read Passage B and note how it relates to Passage A
3. Before answering questions, identify:
   - The shared topic
   - Where the authors agree
   - Where they disagree
   - The key difference in their approaches or conclusions

## Relationship Types

The two passages typically relate in one of these ways:
- **Agreement with different emphasis:** Both support a position but focus on different aspects
- **Direct disagreement:** Authors take opposing positions on the same issue
- **General vs. specific:** One provides a broad theory, the other a specific application or counterexample
- **Problem and solution:** One identifies a problem, the other proposes a solution
- **Different methodologies:** Both study the same topic but use different approaches

## Question Types Unique to Comparative Reading

### Relationship Questions
"The relationship between the two passages is most accurately described as..."
Match the relationship to one of the types above.

### Cross-Passage Inference
"The author of Passage B would most likely respond to the argument in Passage A by..."
Put yourself in the shoes of Passage B's author and evaluate Passage A's claims.

### Agreement/Disagreement
"Both authors would most likely agree that..."
The correct answer must be supported by BOTH passages.

## Common Mistakes

- Confusing which passage said what
- Assuming the authors disagree when they actually agree (or vice versa)
- Choosing an answer supported by only one passage when the question asks about both`,
    },

    // ─── ANALYTICAL REASONING ───────────────────────────
    {
      title: "Analytical Reasoning: Suggested Approach",
      description: "LSAC's official approach to logic games including setup, rules, and deductions.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/analytical-reasoning",
      type: "article" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 30,
      moduleId: logicGames.id,
      tags: ["strategy", "setup", "diagramming", "approach"],
      order: 1,
      source: "lsac",
      content: `# Analytical Reasoning: Suggested Approach

The Analytical Reasoning section (commonly called "Logic Games") presents four games, each with a set of conditions and 5-7 questions.

## The LSAC Suggested Approach

### Step 1: Read the Setup
Carefully read the scenario to understand:
- What entities are being organized (people, events, items)
- What the task is (ordering, grouping, assigning, selecting)
- Any global constraints

### Step 2: Identify the Game Type

**Sequencing/Ordering:** Arrange entities in a specific order (linear or circular)
**Grouping:** Divide entities into groups or categories
**Matching/Assignment:** Pair entities with attributes or assign them to positions
**Selection:** Choose a subset of entities from a larger group
**Hybrid:** Combines two or more of the above

### Step 3: Diagram the Rules
Create a visual representation:
- Draw a framework (slots, groups, grid)
- Symbolize each rule consistently
- Note rules that can be combined

### Step 4: Make Deductions
Before answering questions, look for:
- **Restricted positions:** Entities that can only go in certain spots
- **Blocks:** Entities that must be together or in a specific relative order
- **Splits:** If X is in Group 1, then Y must be in Group 2
- **Not-laws:** Positions where specific entities CANNOT go

### Step 5: Answer the Questions
- "Must be true" = true in every valid scenario
- "Could be true" = true in at least one valid scenario
- "Cannot be true" = false in every valid scenario
- "If" questions: Add the new condition to your diagram and work out the implications

## Time Management

Aim for about 8-9 minutes per game. If a game seems very difficult, skip it and return to it after completing the easier ones. The games are not always in order of difficulty.`,
    },
    {
      title: "Sequencing Games Fundamentals",
      description: "Linear ordering games: setup, rules, and deduction strategies.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/analytical-reasoning",
      type: "lesson" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 45,
      moduleId: logicGames.id,
      tags: ["sequencing", "ordering", "linear", "diagramming"],
      order: 2,
      source: "lsac",
      content: `# Sequencing Games Fundamentals

Sequencing games are the most common game type on the LSAT. They ask you to arrange entities in a specific order.

## Basic Setup

Draw numbered slots representing positions:
___ ___ ___ ___ ___ ___ ___
 1   2   3   4   5   6   7

List the entities to be placed (e.g., A, B, C, D, E, F, G).

## Common Rule Types

### Fixed Position
"A is third" → Place A directly in slot 3.

### Relative Order
"B comes before D" → B...D (B is somewhere to the left of D)
This does NOT mean they're adjacent.

### Adjacency / Block
"C and E are consecutive" → CE or EC (they must be next to each other)

### Not Adjacent
"F and G are not adjacent" → There must be at least one slot between F and G.

### Conditional
"If B is second, then D is fifth" → B₂ → D₅

### Range / Distance
"B is exactly two positions before E" → B _ E (always two slots apart)

## Making Deductions

After diagramming all rules:

1. **Look for the most constrained entities** — those mentioned in multiple rules
2. **Combine rules:** If A is before B, and B is before C, then A...B...C
3. **Count available positions:** If a block of 3 must fit and there are only 7 slots, the block can only start in positions 1-5
4. **Create not-laws:** Mark positions where entities CANNOT go based on the rules

## Answering Questions

For "must be true" questions: Test scenarios. If you can find ONE valid arrangement where the answer is false, eliminate it.

For "could be true" questions: You only need ONE valid arrangement where the answer is true.

For "if" questions: Add the new condition and make all possible deductions before checking answers.`,
    },
    {
      title: "Grouping Games Strategy",
      description: "In/out games, assignment games, and distribution setups.",
      url: "https://www.lsac.org/lsat/taking-lsat/test-format/analytical-reasoning",
      type: "lesson" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 40,
      moduleId: logicGames.id,
      tags: ["grouping", "assignment", "distribution", "in-out"],
      order: 3,
      source: "lsac",
      content: `# Grouping Games Strategy

Grouping games ask you to divide entities into groups, select subsets, or assign entities to categories.

## Types of Grouping Games

### Selection (In/Out)
Choose which entities are selected and which are not.
Example: "A committee of 4 is selected from 7 candidates."

### Distribution
Divide all entities into defined groups.
Example: "7 students are assigned to 3 study groups."

### Assignment
Assign attributes or roles to entities.
Example: "Each of 5 employees is assigned to morning or afternoon shift."

## Setup

Create columns for each group:
Group 1 | Group 2 | Group 3
   ___  |   ___   |   ___
   ___  |   ___   |   ___

Note the size constraints: Are groups fixed size? Minimum/maximum?

## Common Rule Types

### Conditional
"If A is selected, then B is selected" → A → B (Contrapositive: ~B → ~A)

### Biconditional
"A and B are in the same group" → They always go together

### Anti-Block
"C and D cannot be in the same group" → They must be separated

### Numerical
"Group 1 has exactly 3 members" → Fixed count constraint

## Key Deductions

1. **Conditional chains:** If A → B and B → C, then A → C
2. **Contrapositive chains:** ~C → ~B → ~A
3. **Forced placements:** If most entities are constrained, the remaining ones may have only one valid position
4. **Numerical deductions:** If 7 entities go into 3 groups of sizes 2, 2, and 3, and you know 2 entities must be together, they fill one group

## Strategy

- Map out ALL conditional relationships before answering questions
- Create a "chain" diagram showing which selections force other selections
- For "if" questions, trace through the conditional chain completely`,
    },

    // ─── WRITING ────────────────────────────────────────
    {
      title: "LSAT Argumentative Writing Overview",
      description: "Understanding the writing section format, timing, and what law schools look for.",
      url: "https://www.lsac.org/lsat/lsat-dates-deadlines-score-release-dates/lsat-argumentative-writing",
      type: "article" as const,
      difficulty: "easy" as const,
      estimatedMinutes: 15,
      moduleId: writing.id,
      tags: ["writing", "format", "overview", "law-schools"],
      order: 1,
      source: "lsac",
      content: `# LSAT Argumentative Writing Overview

LSAT Argumentative Writing is a 50-minute essay section administered separately from the multiple-choice LSAT. Your essay is sent to every law school you apply to along with your LSAT score.

## Format

You receive:
- A debatable topic with background information
- A key question framing the debate
- 3-4 perspectives from different sources
- Prewriting questions to help you plan

## Timing

- **15 minutes:** Prewriting phase with guided questions and digital scratch paper
- **35 minutes:** Essay writing phase

## What Law Schools Look For

While the writing sample is not scored numerically, admissions committees evaluate:

1. **Clear thesis:** Do you take a definitive position?
2. **Reasoning quality:** Do you support your position with logical arguments?
3. **Engagement with perspectives:** Do you address the provided perspectives?
4. **Counterargument handling:** Do you acknowledge and respond to opposing views?
5. **Organization:** Is your essay well-structured with clear paragraphs?
6. **Writing quality:** Is your prose clear, concise, and grammatically sound?

## Important Notes

- You MUST take a position — fence-sitting is not acceptable
- You should reference at least one of the provided perspectives
- Quality of reasoning matters more than length
- Spelling and grammar errors are noted but minor ones won't hurt you
- You cannot use outside sources — only the provided material
- The essay is available to law schools for 5 years`,
    },
    {
      title: "Writing a Strong Argumentative Essay",
      description: "Step-by-step guide to crafting a compelling LSAT writing response.",
      url: "https://www.lsac.org/lsat-argumentative-writing-example",
      type: "lesson" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 30,
      moduleId: writing.id,
      tags: ["writing", "strategy", "essay-structure", "tips"],
      order: 2,
      source: "lsac",
      content: `# Writing a Strong Argumentative Essay

## Prewriting Phase (15 minutes)

Use this time wisely:

1. **Read the topic carefully** (2-3 minutes)
   - Understand the key question
   - Identify what's being debated

2. **Analyze the perspectives** (5-6 minutes)
   - Note the main claim of each perspective
   - Identify which perspectives you agree/disagree with
   - Find points of tension between perspectives

3. **Plan your essay** (5-6 minutes)
   - Choose your position
   - Outline your main arguments (2-3 points)
   - Plan which perspectives you'll engage with
   - Think about counterarguments you'll address

## Essay Structure

### Introduction (1 paragraph)
- Briefly acknowledge the complexity of the issue
- State your thesis clearly
- Preview your main arguments

### Body Paragraphs (2-3 paragraphs)
Each paragraph should:
- Start with a clear topic sentence
- Develop one main argument
- Reference specific perspectives where relevant
- Use reasoning and examples to support your point

### Counterargument Paragraph (1 paragraph)
- Acknowledge the strongest opposing argument
- Explain why your position is still stronger
- This shows sophisticated thinking

### Conclusion (1 paragraph)
- Restate your thesis in light of your arguments
- Briefly summarize why your position is most compelling
- End with a strong closing statement

## Tips for Success

- **Be decisive:** Take a clear position. Don't waffle.
- **Be specific:** Vague arguments are weak arguments.
- **Engage the perspectives:** Reference them by name or source.
- **Manage time:** Leave 3-5 minutes to review and edit.
- **Don't over-edit:** A few minor errors are fine. Focus on substance.
- **Aim for 400-600 words:** Quality over quantity, but very short essays look rushed.`,
    },

    // ─── TEST STRATEGY ──────────────────────────────────
    {
      title: "LSAT Timing Strategy",
      description: "How to manage your time across sections and avoid common timing pitfalls.",
      url: "https://www.lsac.org/lsat/taking-lsat/about-the-lsat",
      type: "lesson" as const,
      difficulty: "medium" as const,
      estimatedMinutes: 20,
      moduleId: testStrategy.id,
      tags: ["timing", "strategy", "pacing", "test-day"],
      order: 1,
      source: "lsac",
      content: `# LSAT Timing Strategy

Time management is one of the biggest challenges on the LSAT. Here's how to master it.

## Section Timing

### Logical Reasoning (35 minutes, ~25 questions)
- Target: ~1 minute 20 seconds per question
- Questions generally get harder as you go
- Don't spend more than 2 minutes on any single question
- If stuck, make your best guess and move on

### Reading Comprehension (35 minutes, 4 passages)
- Target: ~8 minutes 45 seconds per passage set
- Spend 3-4 minutes reading, 4-5 minutes on questions
- If one passage is extremely difficult, do it last

### Analytical Reasoning (35 minutes, 4 games)
- Target: ~8 minutes 45 seconds per game
- Games vary widely in difficulty
- Scan all four games first and start with the easiest
- A well-set-up diagram saves time on questions

## General Timing Tips

1. **Wear a watch:** Digital watches are not allowed, but analog watches are. Track time by section, not by question.

2. **Use the 5-minute warning wisely:** When 5 minutes remain, stop working on difficult questions and make sure every question has an answer.

3. **Skip strategically:** If a question is taking too long, circle it and move on. Come back if time permits.

4. **Never leave blanks:** There's no penalty for wrong answers. If time is running out, fill in remaining answers with your "letter of the day."

5. **Practice under timed conditions:** Every practice session should simulate real timing. Untimed practice builds bad habits.

## Building Speed

- Speed comes from pattern recognition, not rushing
- The more question types you've seen, the faster you'll recognize them
- Drill individual question types before doing full timed sections
- Review wrong answers to understand WHY you were slow`,
    },
    {
      title: "Test Day Preparation",
      description: "What to bring, what to expect, and how to perform your best on LSAT day.",
      url: "https://www.lsac.org/lsat/taking-lsat/getting-ready-lsat-test-day",
      type: "article" as const,
      difficulty: "easy" as const,
      estimatedMinutes: 15,
      moduleId: testStrategy.id,
      tags: ["test-day", "preparation", "logistics"],
      order: 2,
      source: "lsac",
      content: `# Test Day Preparation

## What to Bring

- Valid government-issued photo ID
- LSAC admission ticket (printed or digital)
- Analog wristwatch (no digital, no smart watches)
- Approved clear plastic bag with:
  - Tissues
  - Cough drops
  - Medication
- Snacks and drinks for the break (stored in your locker)

## What NOT to Bring

- Cell phones or electronic devices (must be turned off and stored)
- Digital watches or fitness trackers
- Earplugs (unless approved accommodation)
- Scratch paper (provided by the test center)
- Pencils or pens (stylus provided for the tablet)

## The Night Before

- Get 7-8 hours of sleep
- Prepare everything you need to bring
- Know your test center location and plan to arrive early
- Don't cram — light review at most
- Eat a normal dinner

## Test Day Morning

- Eat a balanced breakfast (protein + complex carbs)
- Arrive at the test center 30 minutes early
- Use the restroom before the test begins
- Stay calm — nervousness is normal

## During the Test

- Read each question carefully before answering
- Don't change answers unless you have a clear reason
- Use the break to eat a snack, drink water, and use the restroom
- If you feel anxious, take 3 deep breaths and refocus
- Remember: one difficult question won't make or break your score

## After the Test

- Your score will be available in about 3-4 weeks
- You can cancel your score within 6 calendar days
- If you're unhappy with your performance, remember you can retake the test`,
    },
    {
      title: "Building a Study Schedule",
      description: "How to create an effective LSAT study plan based on your timeline and goals.",
      url: "https://www.lsac.org/lsat/taking-lsat/about-the-lsat",
      type: "lesson" as const,
      difficulty: "easy" as const,
      estimatedMinutes: 20,
      moduleId: testStrategy.id,
      tags: ["study-plan", "schedule", "preparation", "timeline"],
      order: 3,
      source: "lsac",
      content: `# Building a Study Schedule

## Recommended Timelines

### 3-Month Plan (Intensive)
- 20-25 hours per week
- Best for: Students who can study full-time or near full-time
- Week 1-4: Learn fundamentals of each section
- Week 5-8: Drill individual question types and games
- Week 9-12: Full practice tests and targeted review

### 4-6 Month Plan (Standard)
- 10-15 hours per week
- Best for: Working professionals or students with other commitments
- Month 1-2: Fundamentals and question type introduction
- Month 3-4: Intensive drilling and timed practice
- Month 5-6: Full practice tests and weak area review

### 6-12 Month Plan (Extended)
- 5-10 hours per week
- Best for: Those starting early or aiming for significant score improvement
- Allows for deeper learning and more gradual skill building

## Weekly Structure

A balanced week should include:
- 2-3 sessions of Logical Reasoning practice
- 1-2 sessions of Reading Comprehension
- 1-2 sessions of Analytical Reasoning
- 1 full timed section or practice test (on weekends)
- 1 review session (analyzing mistakes)

## Key Principles

1. **Diagnose first:** Take a diagnostic test to identify your starting point
2. **Focus on weaknesses:** Spend more time on your weakest areas
3. **Review every mistake:** Understanding WHY you got something wrong is more valuable than doing more questions
4. **Simulate test conditions:** Practice under timed conditions regularly
5. **Take breaks:** Burnout is real. Schedule rest days.
6. **Track progress:** Monitor your accuracy by section and question type`,
    },
  ];

  await db.insert(resources).values(resourceData);

  console.log("\nSeed complete!");
  console.log(`  Modules: 6`);
  console.log(`  Resources: ${resourceData.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
