/**
 * Records a short voice clip and transcribes it to text. Voice is an input
 * method: the resulting text is handed back via `onText` so the screen can drop
 * it into the generation field for the user to confirm before generating.
 *
 * Recording auto-stops at `MAX_RECORDING_SECONDS` via a timer (whose callback is
 * a legitimate place to update state); the user can also stop early by toggling.
 */

import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MAX_RECORDING_SECONDS } from '@/lib/limits';
import { transcribeAudio, TranscriptionError } from '@/lib/transcribe';

export type VoicePhase = 'idle' | 'recording' | 'transcribing';

export interface VoiceInput {
  phase: VoicePhase;
  /** Elapsed whole seconds, clamped to the cap. */
  seconds: number;
  error: string | null;
  /** Start when idle; stop + transcribe when recording. */
  toggle: () => void;
}

export function useVoiceInput(onText: (text: string) => void): VoiceInput {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against finalizing twice if the auto-stop timer and a manual stop
  // race. Only touched inside callbacks/effects, never read during render.
  const finalizing = useRef(false);

  const seconds = Math.min(Math.floor(recorderState.durationMillis / 1000), MAX_RECORDING_SECONDS);

  const clearTimer = useCallback(() => {
    if (autoStopTimer.current) {
      clearTimeout(autoStopTimer.current);
      autoStopTimer.current = null;
    }
  }, []);

  const finish = useCallback(async () => {
    if (finalizing.current) return;
    finalizing.current = true;
    clearTimer();
    setPhase('transcribing');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new TranscriptionError('No audio was captured. Try again.');
      const text = await transcribeAudio(uri);
      if (text) onText(text);
      else setError('Could not make out any speech. Try again.');
    } catch (e) {
      setError(e instanceof TranscriptionError ? e.message : 'Transcription failed.');
    } finally {
      setPhase('idle');
      finalizing.current = false;
    }
  }, [recorder, onText, clearTimer]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setError('Microphone access is off. Enable it in Settings to record.');
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
      // Auto-stop at the cap. A timer callback is an allowed place to set state.
      autoStopTimer.current = setTimeout(() => void finish(), MAX_RECORDING_SECONDS * 1000);
    } catch {
      setError('Could not start recording.');
      setPhase('idle');
    }
  }, [recorder, finish]);

  // Tidy the timer if the screen unmounts mid-recording.
  useEffect(() => clearTimer, [clearTimer]);

  const toggle = useCallback(() => {
    if (phase === 'recording') void finish();
    else if (phase === 'idle') void start();
  }, [phase, finish, start]);

  return { phase, seconds, error, toggle };
}
