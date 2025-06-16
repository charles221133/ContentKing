// Simple file-based prompt script storage for MVP/demo purposes only.
// Not for production use. All UI using this should use a dark theme by default.
import { promises as fs } from 'fs';
import path from 'path';

export type PromptScriptRecord = {
  id: string;
  name: string;
  original: string;
  userStyle: string;
  rewritten: string;
  createdAt: string;
  promptVersion: string;
  url?: string;
  videoUrl?: string;
  description?: string;
};

const DATA_PATH = path.join(process.cwd(), 'data', 'prompt-scripts.json');

export async function addPromptScript(record: Omit<PromptScriptRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<PromptScriptRecord> {
  const all = await listPromptScripts();
  let updated = false;
  let newRecord: PromptScriptRecord | undefined = undefined;
  if (record.id) {
    // Try to update existing
    const idx = all.findIndex(s => s.id === record.id);
    if (idx !== -1) {
      newRecord = {
        ...all[idx],
        ...record,
        id: record.id,
        createdAt: all[idx].createdAt,
        videoUrl: record.videoUrl || all[idx].videoUrl,
        description: record.description || all[idx].description
      };
      all[idx] = newRecord;
      updated = true;
    }
  }
  if (!updated) {
    newRecord = {
      id: record.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: record.name || '',
      original: record.original,
      userStyle: record.userStyle,
      rewritten: record.rewritten,
      createdAt: record.createdAt || new Date().toISOString(),
      promptVersion: record.promptVersion,
      url: record.url || undefined,
      videoUrl: record.videoUrl || undefined,
      description: record.description || undefined
    };
    all.push(newRecord);
  }
  await fs.writeFile(DATA_PATH, JSON.stringify(all, null, 2), 'utf-8');
  return newRecord!;
}

export async function listPromptScripts(): Promise<PromptScriptRecord[]> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data) as PromptScriptRecord[];
  } catch {
    return [];
  }
}

export async function findPromptScript(original: string, userStyle: string): Promise<PromptScriptRecord | undefined> {
  const all = await listPromptScripts();
  return all.find(r => r.original === original && r.userStyle === userStyle);
} 