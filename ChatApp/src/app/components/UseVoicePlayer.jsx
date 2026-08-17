// useVoicePlayer.js (renamed from UseVoicePlayer.js)
import { useAudioPlayer } from "expo-audio";

export default function useVoicePlayer(uri) {
  const player = useAudioPlayer(uri);

  const playVoice = () => {
    if (!uri) return;
    player.seekTo(0);
    player.play();
  };

  const pauseVoice = () => {
    player.pause();
  };

  return { playVoice, pauseVoice, player };
}