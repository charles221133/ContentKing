export type PromptScript = {
  id?: string;
  name: string;
  original: string;
  user_style: string;
  rewritten: string;
  prompt_version: string;
  created_at?: string;
  user_id: string;
  description?: string;
  video_url?: string;
  status?: { [platform: string]: string };
};