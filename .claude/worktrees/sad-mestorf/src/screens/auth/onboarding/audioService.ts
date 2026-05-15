import { Audio } from 'expo-av';

let clickSound: Audio.Sound | null = null;
let loadAttempted = false;

/**
 * Pre-load the click sound. Call once during onboarding init.
 * Fails silently if the asset is missing — typewriter still works,
 * just without audio.
 */
export async function loadClickSound(): Promise<void> {
  if (loadAttempted) return;
  loadAttempted = true;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      require('../../../assets/sounds/click.wav'),
      { shouldPlay: false, volume: 0.35 }
    );
    clickSound = sound;
  } catch {
    // Asset not yet bundled — no-op, typewriter works without audio
    clickSound = null;
  }
}

/**
 * Play one click. Fire-and-forget; errors are swallowed.
 */
export async function playClick(): Promise<void> {
  if (!clickSound) return;
  try {
    await clickSound.setPositionAsync(0);
    await clickSound.playAsync();
  } catch {
    // ignore
  }
}

/**
 * Unload sound to free memory. Call when leaving onboarding.
 */
export async function unloadClickSound(): Promise<void> {
  if (!clickSound) return;
  try {
    await clickSound.unloadAsync();
  } catch {
    // ignore
  } finally {
    clickSound = null;
    loadAttempted = false;
  }
}
