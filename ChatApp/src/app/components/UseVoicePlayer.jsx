import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

export default function useVoicePlayer(uri) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const playVoice = () => {
    if (!uri) return;

    player.play();
  };

  const pauseVoice = () => {
    player.pause();
  };

  return {
    playVoice,
    pauseVoice,
    player,
    playing: status.playing,
  };
}