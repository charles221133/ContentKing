// Prompt Engineering Utility
// All prompt templates should be defined here for versioning, documentation, and easy updates.
// Version: 1.0.0
//
// Best Practices:
// - Use clear variable names for all dynamic parts of the prompt.
// - Document the intent and usage of each prompt.
// - Update the version when making significant changes.
// - All UI using these prompts should use a dark theme by default.

export type PromptTemplate = {
  version: string;
  description: string;
  build: (params: { script: string; userStyle: string; newsNuggets: string[] }) => string;
};

export const personalizeScriptPrompt: PromptTemplate = {
  version: '1.3.0',
  description:
    'Rewrite a script in a personalized, humorous style matching the user\'s style. Generate four different versions, each with a unique joke or punchline, each wrapped in <joke>...</joke> tags, separated by --- lines. Make the jokes as clever, surprising, and funny as possible. Always include at least one <joke>...</joke> tag per version. Example: Input: "Why did the chicken cross the road? To get to the other side." Output: Version 1: Why did the chicken cross the road? <joke>To get to the other side.</joke> --- Version 2: Why did the chicken cross the road? <joke>Because the grass was greener.</joke> --- ...',
  build: ({ script, userStyle, newsNuggets }) => {
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
      "Rewrite the paragraph below in the humour style of ${userStyle}.",
  "### NEWS NUGGETS",
    "- ${newsNuggets[0]}",
    "- ${newsNuggets[1]}",
    "- ${newsNuggets[2]}",
  "### SOURCE",
  "${script}",
  "",
  "### OUTPUT RULES",
  "1 Return **exactly four** distinct rewrites.",
  "2 Each rewrite must embed **one** punchline wrapped in '<joke>…</joke>' tags.",
  "3 Vary your joke framework across the four versions (pick from: Rule-of-Three, Misdirection, Hyperbolic-Analogy, Callback).",
  "4 Punchline ≤ 15 words, punchy one-liner.",
  "6 In the rewrites, if possible try referencing an item from NEWS NUGGETS *or* a classic dev pain-point.",
  "7 Output format:",
  "   [rewritten text with <joke>punchline</joke>]",
  "   ---",
  "   [rewritten text with <joke>punchline</joke>]",
  "   ---",
  "   [rewritten text with <joke>punchline</joke>]",
  "   ---",
  "   [rewritten text with <joke>punchline</joke>]",
  "   (Do not include 'Rewrite 1:', 'Rewrite 2:', etc. Just output the text and punchline, separated by ---.)",
  "",
  "### SELF-CHECK (internal)",
  "• Think through setup → punchline before writing.",
  "• Ensure each framework is actually used.",
  "• If a punchline feels weak, iterate mentally once more before outputting.",
  "Don’t reveal your planning. Only output the four final rewrites in the exact format above."
    ]
  }
]`;
  }
  //`Rewrite the following script in a personalized, humorous style that sounds like ${ userStyle }. Generate four different versions, each with a unique joke or punchline, each wrapped in <joke>...</joke> tags. Separate each version with a line containing only three dashes (---). Make the jokes as clever, surprising, and funny as possible. Always include at least one <joke>...</joke > tag per version.\n\nExample: \nInput: Why did the chicken cross the road ? To get to the other side.\nOutput: \nWhy did the chicken cross the road ? <joke>To get to the other side.< /joke>\n---\nWhy did the chicken cross the road? <joke>Because the grass was greener.</joke >\n-- -\nWhy did the chicken cross the road ? <joke>To escape the Colonel.< /joke>\n---\nWhy did the chicken cross the road? <joke>Because it saw a sign for free WiFi.</joke >\n\nScript: \n${ script } `,
};

// Add more prompt templates here as needed. 