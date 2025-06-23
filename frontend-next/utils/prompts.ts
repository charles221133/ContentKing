// Prompt Engineering Utility
// All prompt templates should be defined here for versioning, documentation, and easy updates.
// Version: 1.0.0
//
// Best Practices:
// - Use clear variable names for all dynamic parts of the prompt.
// - Document the intent and usage of each prompt.
// - Update the version when making significant changes.
// - All UI using these prompts should use a dark theme by default.

class Prompt {
  name: string;
  build: (params: any) => string;
  details: string;
  version: string;

  constructor(params: {
    name: string;
    build: (params: any) => string;
    details: string;
    version: string;
  }) {
    this.name = params.name;
    this.build = params.build;
    this.details = params.details;
    this.version = params.version;
  }
}

export const personalizeScriptPrompt = new Prompt({
  name: 'Personalize Full Script',
  build: ({ script, userStyle, newsNuggets }: { script: string; userStyle: string; newsNuggets: string[] }) => {
    return `[
  {
    "role": "system",
    "content": [
      "You are a stand-up ghost-writer who channels Fireship-style tech satire:",
      "• Voice → dry, dead-pan, caffeine-fuelled DevOps ranting.",
      "• Humour levers → cloud-bill misery, framework fatigue, AWS product sprawl, pop-culture callbacks.",
      "• Red lines → keep it PG-13, no dad-puns, no bodily-fluid jokes, no hate speech."
    ]
  },
  {
    "role": "user",
    "content": [
      "### TASK",
      "Rewrite the entire script below in the humour style of ${userStyle}.",
  "### NEWS NUGGETS",
    "- ${newsNuggets[0]}",
    "- ${newsNuggets[1]}",
    "- ${newsNuggets[2]}",
  "### SOURCE",
  "${script}",
  "",
  "### OUTPUT RULES",
  "1  Return a single, cohesive rewritten script.",
  "2  Embed punchlines naturally within the text, wrapped in '<joke>…</joke>' tags.",
  "3  Vary your joke framework across the four versions (pick from: Rule-of-Three, Misdirection, Hyperbolic-Analogy, Callback).",
  "4  Punchline ≤ 15 words, punchy one-liner.",
  "6 In the rewrites, if possible try referencing an item from NEWS NUGGETS *or* a classic dev pain-point.",
  "",
  "### SELF-CHECK (internal)",
  "• Think through setup → punchline before writing.",
  "• Ensure each framework is actually used.",
  "• If a punchline feels weak, iterate mentally once more before outputting.",
  "Don't reveal your planning. Only output the final rewritten script."
    ]
  }
]`;
  },
  details: 'Rewrites a given script in a specified style.',
  version: '1.2',
});

export const generateVariantsPrompt = new Prompt({
  name: 'Generate Paragraph Variants',
  build: (params: { paragraph: string; userStyle: string; newsNuggets: string[] }) => {
    return `[
  {
    "role": "system",
    "content": [
      "You are a stand-up ghost-writer who channels Fireship-style tech satire:",
      "• Voice → dry, dead-pan, caffeine-fuelled DevOps ranting.",
      "• Humour levers → cloud-bill misery, framework fatigue, AWS product sprawl, pop-culture callbacks.",
      "• Red lines → keep it PG-13, no dad-puns, no bodily-fluid jokes, no hate speech."
    ]
  },
  {
    "role": "user",
    "content": [
      "### TASK",
      "Rewrite the paragraph below in the humour style of ${params.userStyle}, creating four distinct, humorous variants.",
      "### NEWS NUGGETS (Optional)",
      "${params.newsNuggets.length > 0 ? params.newsNuggets.map(n => `- ${n}`).join('\\n') : '  - None provided.'}",
      "### SOURCE PARAGRAPH",
      "'${params.paragraph}'",
      "",
      "### OUTPUT FORMAT EXAMPLE",
      "First rewritten paragraph with <joke>punchline</joke>",
      "---",
      "Second rewritten paragraph with <joke>punchline</joke>",
      "---",
      "Third rewritten paragraph with <joke>punchline</joke>",
      "---",
      "Fourth rewritten paragraph with <joke>punchline</joke>",
      "",
      "### OUTPUT RULES",
      "1. Return **exactly four** distinct rewrites.",
      "2. Each rewrite must embed **one** punchline wrapped in '<joke>…</joke>' tags.",
      "3. Vary your joke framework across the four versions (e.g., Rule-of-Three, Misdirection, Hyperbolic-Analogy, Callback).",
      "4. Punchline should be ≤ 15 words and punchy.",
      "5. In the rewrites, try referencing a news nugget or a classic dev pain-point.",
      "6. Separate each of the four variants with a triple-dashed line on its own line: '---'.",
      "7. Do NOT include any other text, conversational filler, or explanations.",
      "",
      "### SELF-CHECK (internal)",
      "• Think through setup → punchline before writing.",
      "• Ensure each joke framework is actually used.",
      "• If a punchline feels weak, iterate mentally once more before outputting."
    ]
  }
]`;
  },
  details: 'Generates four humorous variants for a single paragraph in a specified style, separated by ---.',
  version: '1.3',
});

// Add more prompt templates here as needed. 