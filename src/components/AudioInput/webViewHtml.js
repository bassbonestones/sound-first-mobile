/**
 * WebView HTML Generator for AudioInput on Mobile
 * Generates a self-contained HTML page for audio capture and pitch detection
 */

/**
 * Generate HTML for mobile WebView audio processing
 * @param {Object} config - Configuration for audio processing
 * @param {number} config.volumeThreshold - Volume threshold for sound detection
 * @param {number} config.silenceDuration - Duration of silence before sound end
 * @param {string|null} config.targetNote - Target note for matching (e.g., "Bb3")
 * @param {number} config.pitchMargin - Cents margin for pitch matching
 * @param {boolean} config.allowOctaveEquivalent - Allow octave equivalence
 * @returns {string} Complete HTML page as string
 */
export function generateAudioWebViewHtml(config) {
  const {
    volumeThreshold,
    silenceDuration,
    targetNote,
    pitchMargin,
    allowOctaveEquivalent,
  } = config;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #1a1a2e;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .status { font-size: 16px; margin-bottom: 15px; text-align: center; }
    .error { color: #FF6B6B; }
    .btn {
      background: #4A90D9;
      color: white;
      padding: 14px 28px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin: 10px;
    }
    .btn:disabled { opacity: 0.5; }
    .listening { color: #4ADE80; }
    .volume-bar {
      width: 200px;
      height: 10px;
      background: #333;
      border-radius: 5px;
      overflow: hidden;
      margin: 10px 0;
    }
    .volume-fill {
      height: 100%;
      background: #4ADE80;
      transition: width 0.05s;
    }
    .pitch-display { font-size: 24px; font-weight: bold; color: #FFD700; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div id="permission-ui">
    <p class="status">Microphone access needed to hear you play</p>
    <button class="btn" id="start-btn">Enable Microphone</button>
  </div>
  <div id="listening-ui" class="hidden">
    <p class="status listening">🎤 Listening...</p>
    <div class="volume-bar"><div class="volume-fill" id="volume-fill"></div></div>
    <p class="pitch-display" id="pitch-display">--</p>
  </div>
  <p id="error" class="status error hidden"></p>

  <script>
    const CONFIG = {
      volumeThreshold: ${volumeThreshold},
      silenceDuration: ${silenceDuration},
      targetNote: ${targetNote ? `"${targetNote}"` : "null"},
      pitchMargin: ${pitchMargin},
      allowOctaveEquivalent: ${allowOctaveEquivalent},
    };

    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    function frequencyToNote(frequency) {
      if (!frequency || frequency < 20 || frequency > 5000) return null;
      const semitones = 12 * Math.log2(frequency / 440);
      const midiNote = Math.round(semitones) + 69;
      const noteIndex = ((midiNote % 12) + 12) % 12;
      const octave = Math.floor(midiNote / 12) - 1;
      const noteName = NOTE_NAMES[noteIndex];
      const exactMidi = semitones + 69;
      const cents = Math.round((exactMidi - midiNote) * 100);
      return {
        frequency,
        noteName: noteName + octave,
        noteNameShort: noteName,
        octave,
        midiNote,
        cents,
        isInTune: Math.abs(cents) < 20,
      };
    }
    
    function noteNameToMidi(noteName) {
      if (!noteName) return null;
      const match = noteName.match(/^([A-Ga-g])([#b]?)(\\d)$/);
      if (!match) return null;
      const [, letter, accidental, octaveStr] = match;
      const octave = parseInt(octaveStr, 10);
      const letterIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter.toUpperCase()];
      if (letterIndex === undefined) return null;
      let noteIndex = letterIndex;
      if (accidental === '#') noteIndex += 1;
      if (accidental === 'b') noteIndex -= 1;
      noteIndex = ((noteIndex % 12) + 12) % 12;
      return (octave + 1) * 12 + noteIndex;
    }
    
    function autoCorrelate(buffer, sampleRate) {
      const SIZE = buffer.length;
      let rms = 0;
      for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
      rms = Math.sqrt(rms / SIZE);
      if (rms < 0.005) return { frequency: -1, rms, confidence: 0 };
      
      const minPeriod = Math.floor(sampleRate / 1400);
      const maxPeriod = Math.floor(sampleRate / 70);
      let correlations = [];
      
      for (let lag = minPeriod; lag <= maxPeriod && lag < SIZE / 2; lag++) {
        let sum = 0, norm1 = 0, norm2 = 0;
        for (let i = 0; i < SIZE - lag; i++) {
          sum += buffer[i] * buffer[i + lag];
          norm1 += buffer[i] * buffer[i];
          norm2 += buffer[i + lag] * buffer[i + lag];
        }
        const norm = Math.sqrt(norm1 * norm2);
        const correlation = norm > 0 ? sum / norm : 0;
        correlations.push({ lag, correlation });
      }
      
      if (correlations.length === 0) return { frequency: -1, rms, confidence: 0 };
      
      let bestLag = -1, bestCorrelation = 0;
      for (let i = 1; i < correlations.length - 1; i++) {
        const prev = correlations[i - 1].correlation;
        const curr = correlations[i].correlation;
        const next = correlations[i + 1].correlation;
        if (curr > prev && curr > next && curr > 0.3 && curr > bestCorrelation) {
          bestCorrelation = curr;
          bestLag = correlations[i].lag;
          const denom = 2 * curr - prev - next;
          if (denom !== 0) bestLag += (next - prev) / (2 * denom);
          if (bestCorrelation > 0.5) break;
        }
      }
      
      if (bestCorrelation > 0.3 && bestLag > 0) {
        return { frequency: sampleRate / bestLag, rms, confidence: bestCorrelation };
      }
      return { frequency: -1, rms, confidence: 0 };
    }
    
    // Send message to React Native
    function postMessage(type, data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
      }
    }
    
    let audioContext, analyser, mediaStream, animationFrame;
    let silenceTimer = null;
    let soundStarted = false;
    let pitchBuffer = [];
    const targetMidi = noteNameToMidi(CONFIG.targetNote);
    
    async function startListening() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        });
        mediaStream = stream;
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        document.getElementById('permission-ui').classList.add('hidden');
        document.getElementById('listening-ui').classList.remove('hidden');
        postMessage('permissionGranted', {});
        
        analyze();
      } catch (err) {
        const msg = err.name === 'NotAllowedError' 
          ? 'Microphone permission denied. Please allow access.'
          : 'Microphone error: ' + err.message;
        document.getElementById('error').textContent = msg;
        document.getElementById('error').classList.remove('hidden');
        postMessage('error', { message: msg });
      }
    }
    
    function analyze() {
      if (!analyser || !audioContext) return;
      
      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);
      const sampleRate = audioContext.sampleRate;
      
      function processAudio() {
        if (!analyser) return;
        
        analyser.getFloatTimeDomainData(dataArray);
        const result = autoCorrelate(dataArray, sampleRate);
        const rms = result.rms || 0;
        const normalizedVolume = Math.min(1, rms * 10);
        
        postMessage('volumeChange', { volume: normalizedVolume });
        document.getElementById('volume-fill').style.width = (normalizedVolume * 100) + '%';
        
        const isAboveThreshold = normalizedVolume > CONFIG.volumeThreshold;
        
        if (isAboveThreshold) {
          if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
          
          if (!soundStarted) {
            soundStarted = true;
            postMessage('soundStart', {});
          }
          
          if (result.frequency > 0 && result.confidence > 0.3) {
            const noteInfo = frequencyToNote(result.frequency);
            if (noteInfo) {
              pitchBuffer.push({ midi: noteInfo.midiNote, timestamp: Date.now() });
              document.getElementById('pitch-display').textContent = noteInfo.noteName;
              postMessage('realtimePitch', { pitch: noteInfo });
              
              if (targetMidi !== null) {
                const diff = Math.abs(noteInfo.midiNote - targetMidi);
                const noteMatches = CONFIG.allowOctaveEquivalent ? diff % 12 === 0 : diff === 0;
                const isMatch = noteMatches && Math.abs(noteInfo.cents) < CONFIG.pitchMargin;
                postMessage('pitchMatch', { isMatch, pitch: noteInfo });
              }
            }
          }
        } else {
          if (soundStarted && !silenceTimer) {
            silenceTimer = setTimeout(() => {
              soundStarted = false;
              const cutoff = Date.now() - 1000;
              const recent = pitchBuffer.filter(r => r.timestamp >= cutoff);
              
              if (recent.length > 0) {
                const counts = {};
                recent.forEach(r => counts[r.midi] = (counts[r.midi] || 0) + 1);
                let mostCommon = null, maxCount = 0;
                Object.entries(counts).forEach(([midi, count]) => {
                  if (count > maxCount) { maxCount = count; mostCommon = parseInt(midi); }
                });
                if (mostCommon !== null) {
                  const finalNote = frequencyToNote(440 * Math.pow(2, (mostCommon - 69) / 12));
                  if (finalNote) postMessage('pitchDetected', { pitch: finalNote });
                }
              }
              
              pitchBuffer = [];
              document.getElementById('pitch-display').textContent = '--';
              postMessage('soundEnd', {});
            }, CONFIG.silenceDuration);
          }
        }
        
        animationFrame = requestAnimationFrame(processAudio);
      }
      
      processAudio();
    }
    
    document.getElementById('start-btn').addEventListener('click', startListening);
    
    // Auto-start message from React Native
    window.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'start') startListening();
    });
  </script>
</body>
</html>`;
}
