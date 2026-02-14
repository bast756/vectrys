// ============================================================================
// VECTRYS — Audio Capture Hook
// Captures browser audio (screen share or microphone) as PCM 16-bit 16kHz
// ============================================================================

import { useState, useRef, useCallback } from 'react';

interface AudioCaptureState {
  isCapturing: boolean;
  source: 'screen' | 'microphone' | null;
  error: string | null;
}

export function useAudioCapture(onAudioChunk: (data: ArrayBuffer) => void) {
  const [state, setState] = useState<AudioCaptureState>({
    isCapturing: false,
    source: null,
    error: null,
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<ScriptProcessorNode | null>(null);

  const TARGET_SAMPLE_RATE = 16000;

  /**
   * Downsample audio buffer from source rate to target rate (16kHz)
   * and convert to Int16 PCM
   */
  const processAudioBuffer = useCallback(
    (inputBuffer: Float32Array, inputSampleRate: number): ArrayBuffer => {
      const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
      const outputLength = Math.floor(inputBuffer.length / ratio);
      const output = new Int16Array(outputLength);

      for (let i = 0; i < outputLength; i++) {
        const srcIndex = Math.floor(i * ratio);
        // Clamp and convert float32 [-1, 1] to int16 [-32768, 32767]
        const sample = Math.max(-1, Math.min(1, inputBuffer[srcIndex]));
        output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }

      return output.buffer;
    },
    []
  );

  /**
   * Start capturing system audio via screen sharing
   */
  const startScreenCapture = useCallback(async () => {
    try {
      setState({ isCapturing: false, source: null, error: null });

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Required for getDisplayMedia
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Check if audio track is available
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        // Stop video tracks since we don't need them
        stream.getTracks().forEach(t => t.stop());
        throw new Error('Aucune piste audio. Cochez "Partager l\'audio" lors du partage d\'écran.');
      }

      // Stop video tracks — we only need audio
      stream.getVideoTracks().forEach(t => t.stop());

      // Create audio-only stream
      const audioStream = new MediaStream(audioTracks);
      setupAudioProcessing(audioStream, 'screen');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setState({ isCapturing: false, source: null, error: 'Partage d\'écran refusé' });
      } else {
        setState({ isCapturing: false, source: null, error: err.message });
      }
    }
  }, []);

  /**
   * Start capturing from microphone
   */
  const startMicCapture = useCallback(async () => {
    try {
      setState({ isCapturing: false, source: null, error: null });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: TARGET_SAMPLE_RATE,
        },
      });

      setupAudioProcessing(stream, 'microphone');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setState({ isCapturing: false, source: null, error: 'Accès microphone refusé' });
      } else {
        setState({ isCapturing: false, source: null, error: err.message });
      }
    }
  }, []);

  /**
   * Setup Web Audio API processing pipeline
   */
  const setupAudioProcessing = useCallback(
    (stream: MediaStream, source: 'screen' | 'microphone') => {
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const sourceNode = audioContext.createMediaStreamSource(stream);

      // Use ScriptProcessorNode for PCM access (deprecated but widely supported)
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      workletNodeRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const pcmBuffer = processAudioBuffer(inputData, audioContext.sampleRate);
        onAudioChunk(pcmBuffer);
      };

      sourceNode.connect(processor);
      processor.connect(audioContext.destination);

      // Listen for track ending (user stops screen share)
      stream.getAudioTracks()[0].addEventListener('ended', () => {
        stopCapture();
      });

      setState({ isCapturing: true, source, error: null });
    },
    [onAudioChunk, processAudioBuffer]
  );

  /**
   * Stop audio capture and clean up
   */
  const stopCapture = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    setState({ isCapturing: false, source: null, error: null });
  }, []);

  return {
    ...state,
    startScreenCapture,
    startMicCapture,
    stopCapture,
  };
}
