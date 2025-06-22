// --- Hardcoded values for video generation ---
// Replace "YOUR_VOICE_ID_HERE" with the correct ID for your specific voice.
const AVATAR_ID = "638e445ab239450009596637";
const VOICE_ID = "YOUR_VOICE_ID_HERE"; // Example: "21m00Tcm4TlvDq8ikWAM"

interface VideoRequestBody {
  script: string;
  avatar_id: string;
  voice_id: string;
}

/**
 * Creates the request body for the HeyGen video generation API call.
 * This function encapsulates the hardcoded avatar and voice IDs.
 *
 * @param script The text content of the script.
 * @returns The request body object.
 */
export function createVideoRequestBody(script: string): VideoRequestBody {
  if (!script) {
    throw new Error("Script content cannot be empty.");
  }

  // Ensure the hardcoded IDs are set.
  if (AVATAR_ID.includes('YOUR_') || VOICE_ID.includes('YOUR_')) {
      console.error("Avatar ID or Voice ID is not set in frontend-next/utils/videoGenerator.ts");
      throw new Error("Video generation is not configured. Please set the IDs.");
  }

  return {
    script,
    avatar_id: AVATAR_ID,
    voice_id: VOICE_ID,
  };
} 