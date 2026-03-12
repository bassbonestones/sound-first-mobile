/**
 * WebView HTML Generator for AudioInput on Mobile
 * Generates a self-contained HTML page for audio capture and pitch detection
 */

/**
 * Configuration for audio processing WebView
 */
export interface AudioWebViewConfig {
  volumeThreshold: number;
  silenceDuration: number;
  targetNote: string | null;
  pitchMargin: number;
  allowOctaveEquivalent: boolean;
}

/**
 * Generate HTML for mobile WebView audio processing
 * @param config - Configuration for audio processing
 * @returns Complete HTML page as string
 */
export function generateAudioWebViewHtml(config: AudioWebViewConfig): string {
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
      const match = noteName.match(/^([A-Ga-g])([#b]?)([0-9])$/);
      if (!match) return null;
      const [, letter, accidental, octaveStr] = match;
      const octave = parseInt(octaveStr, 10);
      const letterMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      let noteIndex = letterMap[letter.toUpperCase()];
      if (noteIndex === undefined) return null;
      if (accidental === '#') noteIndex += 1;
      if (accidental === 'b') noteIndex -= 1;
      noteIndex = ((noteIndex % 12) + 12) % 12;
      return (octave + 1) * 12 + noteIndex;
    }

    function getPitchClass(noteName) {
      const midi = noteNameToMidi(noteName);
      return midi !== null ? midi % 12 : null;
    }

    function isOctaveEquivalent(note1, note2) {
      const pc1 = getPitchClass(note1);
      const pc2 = getPitchClass(note2);
      return pc1 !== null && pc2 !== null && pc1 === pc2;
    }

    function autoCorrelate(buffer, sampleRate) {
      const SIZE = buffer.length;
      let rms = 0;
      for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
      rms = Math.sqrt(rms / SIZE);
      if (rms < 0.01) return { frequency: -1, rms, confidence: 0 };
      
      let r1 = 0, r2 = SIZE - 1;
      const threshold = 0.2;
      for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
      }
      for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buffer[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
      }
      
      const buf2 = buffer.slice(r1, r2);
      const c = new Float32Array(buf2.length);
      for (let i = 0; i < buf2.length; i++) {
        let sum = 0;
        for (let j = 0; j < buf2.length - i; j++) sum += buf2[j] * buf2[j + i];
        c[i] = sum;
      }
      
      let d = 0;
      while (c[d] > c[d + 1] && d < c.length - 1) d++;
      let maxVal = -1, maxPos = -1;
      for (let i = d; i < c.length; i++) {
        if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
      }
      
      let T0 = maxPos;
      if (maxPos > 0 && maxPos < c.length - 1) {
        const y1 = c[maxPos - 1], y2 = c[maxPos], y3 = c[maxPos + 1];
        const a = (y1 + y3 - 2 * y2) / 2;
        const b = (y3 - y1) / 2;
        if (a !== 0) T0 = maxPos - b / (2 * a);
      }
      
      return { frequency: sampleRate / T0, rms, confidence: maxVal / c[0] };
    }

    // State
    let audioContext = null;
    let analyser = null;
    let isSounding = false;
    let silenceTimer = null;
    let soundStartTime = 0;
    let pitchBuffer = [];

    function sendMessage(type, data) {
      const msg = JSON.stringify({ type, ...data });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      }
    }

    async function startAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        document.getElementById('permission-ui').classList.add('hidden');
        document.getElementById('listening-ui').classList.remove('hidden');
        
        processAudio();
      } catch (err) {
        const errorEl = document.getElementById('error');
        errorEl.textContent = 'Microphone error: ' + err.message;
        errorEl.classList.remove('hidden');
        sendMessage('error', { message: err.message });
      }
    }

    function processAudio() {
      if (!analyser) return;
      
      const buffer = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buffer);
      
      const { frequency, rms, confidence } = autoCorrelate(buffer, audioContext.sampleRate);
      const volume = Math.min(1, rms * 10);
      
      // Update UI
      document.getElementById('volume-fill').style.width = (volume * 100) + '%';
      
      // Send volume
      sendMessage('volume', { volume });
      
      // Sound detection
      const isAboveThreshold = volume > CONFIG.volumeThreshold;
      
      if (isAboveThreshold && !isSounding) {
        isSounding = true;
        soundStartTime = Date.now();
        pitchBuffer = [];
        sendMessage('soundStart', {});
        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
      }
      
      if (!isAboveThreshold && isSounding && !silenceTimer) {
        silenceTimer = setTimeout(() => {
          isSounding = false;
          // Calculate dominant pitch from buffer
          const dominantPitch = pitchBuffer.length > 0 
            ? pitchBuffer.reduce((a, b) => a + b) / pitchBuffer.length 
            : null;
          const pitchInfo = dominantPitch ? frequencyToNote(dominantPitch) : null;
          sendMessage('soundEnd', { 
            duration: Date.now() - soundStartTime,
            pitch: pitchInfo 
          });
          silenceTimer = null;
        }, CONFIG.silenceDuration);
      }
      
      // Pitch detection while sounding
      if (isSounding && frequency > 0 && confidence > 0.9) {
        pitchBuffer.push(frequency);
        const pitchInfo = frequencyToNote(frequency);
        if (pitchInfo) {
          document.getElementById('pitch-display').textContent = pitchInfo.noteName;
          sendMessage('pitch', { pitch: pitchInfo });
          
          // Check for pitch match
          if (CONFIG.targetNote) {
            let isMatch = false;
            if (CONFIG.allowOctaveEquivalent) {
              isMatch = isOctaveEquivalent(pitchInfo.noteName, CONFIG.targetNote);
            } else {
              const targetMidi = noteNameToMidi(CONFIG.targetNote);
              isMatch = targetMidi !== null && 
                Math.abs(pitchInfo.midiNote - targetMidi) === 0 &&
                Math.abs(pitchInfo.cents) <= CONFIG.pitchMargin;
            }
            if (isMatch) {
              sendMessage('pitchMatch', { pitch: pitchInfo });
            }
          }
        }
      }
      
      requestAnimationFrame(processAudio);
    }

    document.getElementById('start-btn').addEventListener('click', startAudio);
  </script>
</body>
</html>`;
}
