import { useState, useRef } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  // useRef so it survives re-renders without triggering them,
  // and is scoped to this hook instance (not shared at module level).
  const recordingStartedAt = useRef(null);

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        return {
          success: false,
          error: "permission_denied",
        };
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();

      recorder.record();

      recordingStartedAt.current = Date.now();
      setIsRecording(true);

      return {
        success: true,
        isRecording: true,
      };
    } catch (error) {
      console.error("Start recording error:", error);

      recordingStartedAt.current = null;
      setIsRecording(false);

      return {
        success: false,
        isRecording: false,
        error: "start_failed",
      };
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();

      const durationMs = recordingStartedAt.current
        ? Date.now() - recordingStartedAt.current
        : 0;

      // Reset after reading so the next recording starts fresh
      recordingStartedAt.current = null;
      setIsRecording(false);

      return {
        success: true,
        isRecording: false,
        uri: recorder.uri,
        duration: formatDuration(durationMs),
      };
    } catch (error) {
      console.error("Stop recording error:", error);

      recordingStartedAt.current = null;
      setIsRecording(false);

      return {
        success: false,
        isRecording: false,
        error: "stop_failed",
      };
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      return await stopRecording();
    }
    return await startRecording();
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}