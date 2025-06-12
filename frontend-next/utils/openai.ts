// Utility for accessing the OpenAI API. Any UI using this should use a dark theme by default.
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai; 