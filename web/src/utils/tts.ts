import type { TtsClip } from "../lib/api-client";

let playbackToken = 0;
let activeAudio: HTMLAudioElement | null = null;

function stopCurrentPlayback() {
  playbackToken += 1;
  if (!activeAudio) {
    return;
  }
  activeAudio.pause();
  activeAudio.currentTime = 0;
  activeAudio.src = "";
  activeAudio = null;
}

function resolveAudioSource(clip: TtsClip): string | null {
  if (clip.url) {
    return clip.url;
  }
  if (clip.audioBase64) {
    return `data:audio/mpeg;base64,${clip.audioBase64}`;
  }
  return null;
}

async function playAudioSource(src: string, token: number): Promise<void> {
  const audio = new Audio(src);
  activeAudio = audio;

  await new Promise<void>((resolve) => {
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      if (activeAudio === audio) {
        activeAudio = null;
      }
    };

    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      resolve();
    };

    audio
      .play()
      .then(() => {
        if (token !== playbackToken) {
          audio.pause();
          cleanup();
          resolve();
        }
      })
      .catch(() => {
        cleanup();
        resolve();
      });
  });
}

export async function playTtsAnnouncements(
  clips: TtsClip[]
): Promise<void> {
  stopCurrentPlayback();
  const token = playbackToken;

  for (const clip of clips) {
    if (token !== playbackToken) {
      return;
    }

    const src = resolveAudioSource(clip);
    if (!src) {
      continue;
    }

    await playAudioSource(src, token);
  }
}

export function stopTtsAnnouncements() {
  stopCurrentPlayback();
}
