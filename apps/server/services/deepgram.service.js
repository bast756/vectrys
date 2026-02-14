// ============================================================================
// VECTRYS — Deepgram Service (Streaming Speech-to-Text)
// Uses Deepgram Nova-2 for real-time audio transcription
// ============================================================================

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

let deepgram = null;
if (process.env.DEEPGRAM_API_KEY) {
  deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  console.log('✅ Service Deepgram initialisé');
} else {
  console.warn('⚠️  DEEPGRAM_API_KEY manquante — transcription désactivée');
}

/**
 * Create a live transcription connection
 * @param {Object} options
 * @param {string} [options.language='fr'] - Language code
 * @param {Function} options.onTranscript - Callback for final transcripts: (text, confidence, isFinal)
 * @param {Function} options.onInterim - Callback for interim results: (text)
 * @param {Function} [options.onError] - Callback for errors
 * @param {Function} [options.onClose] - Callback when connection closes
 * @returns {Object} - { connection, send(audioBuffer), close() }
 */
function createLiveTranscription({ language = 'fr', onTranscript, onInterim, onError, onClose }) {
  if (!deepgram) {
    throw new Error('Deepgram non configuré — ajoutez DEEPGRAM_API_KEY dans .env');
  }

  const connection = deepgram.listen.live({
    model: 'nova-2',
    language,
    smart_format: true,
    interim_results: true,
    utterance_end_ms: 1500,
    vad_events: true,
    encoding: 'linear16',
    sample_rate: 16000,
    channels: 1,
    keywords: [
      'VECTRYS:5', 'conciergerie:3', 'check-in:3', 'check-out:3',
      'housekeeping:3', 'ménage:2', 'réservation:2', 'property management:3',
    ],
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log('[Deepgram] Connection opened');
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel?.alternatives?.[0];
    if (!transcript?.transcript) return;

    const text = transcript.transcript.trim();
    if (!text) return;

    if (data.is_final) {
      onTranscript(text, transcript.confidence, true);
    } else if (onInterim) {
      onInterim(text);
    }
  });

  connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
    // Utterance boundary detected — useful for sentence segmentation
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error('[Deepgram] Error:', err);
    if (onError) onError(err);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log('[Deepgram] Connection closed');
    if (onClose) onClose();
  });

  return {
    connection,
    send(audioBuffer) {
      if (connection.getReadyState() === 1) {
        connection.send(audioBuffer);
      }
    },
    close() {
      connection.finish();
    },
  };
}

export default {
  createLiveTranscription,
};
