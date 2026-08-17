// import {
//     AudioRecorder,
//     RecordingPresets,
//     requestRecordingPermissionsAsync,
//     setAudioModeAsync,
// } from "expo-audio";

// // Requires: npx expo install expo-audio
// // (see app.json plugin config in the setup notes)

// // ---- Module-level state ----------------------------------------------
// // A plain function (not a hook) needs somewhere to keep state between
// // calls — since "press once to start, press again to stop" means the
// // second call has to know a recording is already in progress.
// let recorder = null;
// let isRecording = false;
// let recordingStartedAt = null;

// // Lets the Chat screen check recording status any time, without waiting
// // on a VoiceRecorder() call (e.g. for a pulsing mic icon while recording).
// export function isRecordingActive() {
//     return isRecording;
// }

// async function configureAudioMode() {
//     await setAudioModeAsync({
//         allowsRecording: true,
//         playsInSilentMode: true,
//     });
// }

// function formatDuration(ms) {
//     const totalSeconds = Math.max(0, Math.round(ms / 1000));
//     const minutes = Math.floor(totalSeconds / 60);
//     const seconds = totalSeconds % 60;
//     return `${minutes}:${seconds.toString().padStart(2, "0")}`;
// }

// async function startRecording() {
//     try {
//         const { status } = await requestRecordingPermissionsAsync();

//         if (status !== "granted") {
//             // Permission denied — fail gracefully, never throw/crash.
//             return { isRecording: false, error: "permission_denied" };
//         }

//         await configureAudioMode();

//         // console.log(new AudioRecorder(RecordingPresets.HIGH_QUALITY))
//         recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);

//         await recorder.prepareToRecordAsync();
//         recorder.record();

//         isRecording = true;
//         recordingStartedAt = Date.now();

//         return { isRecording: true };
//     } catch (error) {
//         console.error("VoiceRecorder: failed to start recording:", error);
//         isRecording = false;
//         recorder = null;
//         recordingStartedAt = null;
//         return { isRecording: false, error: "start_failed" };
//     }
// }

// async function stopRecording() {
//     try {
//         if (!recorder) {
//             isRecording = false;
//             return { isRecording: false, error: "no_active_recording" };
//         }

//         const uri = await recorder.stop();
//         const durationMs = recordingStartedAt ? Date.now() - recordingStartedAt : 0;

//         isRecording = false;
//         recorder = null;
//         recordingStartedAt = null;

//         return {
//             isRecording: false,
//             uri, // local file URI — pass this to your upload step later
//             durationMs,
//             duration: formatDuration(durationMs), // e.g. "0:12", ready for your VoiceBubble UI
//         };
//     } catch (error) {
//         console.error("VoiceRecorder: failed to stop recording:", error);
//         isRecording = false;
//         recorder = null;
//         recordingStartedAt = null;
//         return { isRecording: false, error: "stop_failed" };
//     }
// }

// // ---- Main exported function --------------------------------------------
// // Toggle behavior:
// //   1st call while idle      -> starts recording, resolves right away
// //                                with { isRecording: true }
// //   2nd call while recording -> stops recording, resolves with
// //                                { isRecording: false, uri, duration, ... }
// //
// // Wrapped in one more try/catch so this can NEVER resolve to `undefined` —
// // even if something unexpected throws outside startRecording/stopRecording's
// // own error handling, the caller always gets a usable object back.
// const VoiceRecorder = async () => {
//     try {
//         return isRecording
//             ? await stopRecording()
//             : await startRecording();
//     } catch (error) {
//         console.error("VoiceRecorder: unexpected error:", error);

//         isRecording = false;
//         recorder = null;
//         recordingStartedAt = null;

//         return {
//             isRecording: false,
//             error: "unexpected_error",
//         };
//     }
// };

// export default VoiceRecorder;

import { useState } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";

export default function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

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

      setIsRecording(true);

      return {
        success: true,
        isRecording: true,
      };
    } catch (error) {
      console.error("Start recording error:", error);

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

      setIsRecording(false);

      return {
        success: true,
        isRecording: false,
        uri: recorder.uri,
      };
    } catch (error) {
      console.error("Stop recording error:", error);

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