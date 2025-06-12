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
  build: (params: { script: string; userStyle: string }) => string;
};

export const personalizeScriptPrompt: PromptTemplate = {
  version: '1.3.0',
  description:
    'Rewrite a script in a personalized, humorous style matching the user\'s style. Generate four different versions, each with a unique joke or punchline, each wrapped in <joke>...</joke> tags, separated by --- lines. Make the jokes as clever, surprising, and funny as possible. Always include at least one <joke>...</joke> tag per version. Example: Input: "Why did the chicken cross the road? To get to the other side." Output: Version 1: Why did the chicken cross the road? <joke>To get to the other side.</joke> --- Version 2: Why did the chicken cross the road? <joke>Because the grass was greener.</joke> --- ...',
  build: ({ script, userStyle }) =>
    `Rewrite the following script in a personalized, humorous style that sounds like ${userStyle}. Generate four different versions, each with a unique joke or punchline, each wrapped in <joke>...</joke> tags. Separate each version with a line containing only three dashes (---). Make the jokes as clever, surprising, and funny as possible. Always include at least one <joke>...</joke> tag per version.\n\nExample:\nInput: Why did the chicken cross the road? To get to the other side.\nOutput:\nWhy did the chicken cross the road? <joke>To get to the other side.</joke>\n---\nWhy did the chicken cross the road? <joke>Because the grass was greener.</joke>\n---\nWhy did the chicken cross the road? <joke>To escape the Colonel.</joke>\n---\nWhy did the chicken cross the road? <joke>Because it saw a sign for free WiFi.</joke>\n\nScript:\n${script}`,
};

// Add more prompt templates here as needed. 