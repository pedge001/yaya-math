import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Platform } from "react-native";

// Sound file paths
const SOUNDS = {
  buttonPress: require("@/assets/sounds/button-press.wav"),
  correct: require("@/assets/sounds/correct.wav"),
  incorrect: require("@/assets/sounds/incorrect.wav"),
  highScore: require("@/assets/sounds/high-score.wav"),
};

export type SoundType = keyof typeof SOUNDS;

class SoundManager {
  private players: Map<SoundType, any> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Enable playback in iOS silent mode
      await setAudioModeAsync({ playsInSilentMode: true });
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    }
  }

  async play(soundType: SoundType) {
    // Skip on web for now (can be enabled later)
    if (Platform.OS === "web") return;

    try {
      await this.initialize();

      // Get or create player for this sound
      let player = this.players.get(soundType);
      
      if (!player) {
        // Create audio player with source
        player = createAudioPlayer(SOUNDS[soundType]);
        this.players.set(soundType, player);
      }

      // Reset to beginning and play
      player.seekTo(0);
      player.play();
    } catch (error) {
      console.error(`Failed to play sound ${soundType}:`, error);
    }
  }

  cleanup() {
    for (const [, player] of this.players) {
      try {
        player.remove();
      } catch (error) {
        console.error("Failed to cleanup sound:", error);
      }
    }
    this.players.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Helper function for easy access
export async function playSound(soundType: SoundType) {
  await soundManager.play(soundType);
}
