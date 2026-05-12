import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Mic, Drum, Guitar, Waves, Download, Play, Pause, Loader2, Sparkles, FileAudio, Archive, Sliders, Wand2, AudioWaveform, Piano, LayoutGrid, Type, Send, Settings, FastForward } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Web Audio Global Context
let globalAudioCtx: AudioContext | null = null;
const getAudioCtx = () => {
    if (!window.AudioContext && !(window as any).webkitAudioContext) return null;
    if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume();
    }
    return globalAudioCtx;
};

const createKick = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.start(time);
    osc.stop(time + 0.3);
};

const createSnare = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(250, time);
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    osc.start(time);
    osc.stop(time + 0.2);
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);
    const noiseGain = ctx.createGain();
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.start(time);
};

const createHiHat = (ctx: AudioContext, time: number) => {
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    noise.connect(bandpass);
    const gain = ctx.createGain();
    bandpass.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    noise.start(time);
};

const createBass = (ctx: AudioContext, time: number, step: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(50, time);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.linearRampToValueAtTime(0.01, time + 0.4);
    osc.start(time);
    osc.stop(time + 0.4);
};

const createSynth = (ctx: AudioContext, time: number, step: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, time);
    filter.frequency.exponentialRampToValueAtTime(2000, time + 0.1);
    gain.connect(filter);
    filter.connect(ctx.destination);
    const notes = [220, 261.63, 293.66, 329.63, 392.00];
    osc.frequency.setValueAtTime(notes[step % notes.length], time);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    osc.start(time);
    osc.stop(time + 0.2);
};

const playSoundsForStep = (step: number, currentGrid: boolean[][]) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    if (currentGrid[0][step]) createKick(ctx, t);
    if (currentGrid[1][step]) createSnare(ctx, t);
    if (currentGrid[2][step]) createHiHat(ctx, t);
    if (currentGrid[3][step]) createBass(ctx, t, step);
    if (currentGrid[4][step]) createSynth(ctx, t, step);
};

type ProcessStatus = 'idle' | 'uploading' | 'processing' | 'done';
type AppTab = 'separator' | 'studio' | 'producer';

interface Stem {
  name: string;
  icon: React.ReactNode;
  color: string;
}

const STEMS: Stem[] = [
  { name: 'Voces', icon: <Mic className="w-5 h-5" />, color: 'bg-pink-500' },
  { name: 'Batería', icon: <Drum className="w-5 h-5" />, color: 'bg-amber-500' },
  { name: 'Bajo', icon: <Guitar className="w-5 h-5" />, color: 'bg-emerald-500' },
  { name: 'Otros', icon: <Waves className="w-5 h-5" />, color: 'bg-blue-500' },
];

const LiveWaveform = ({ isPlaying }: { isPlaying: boolean }) => {
  const [bars, setBars] = React.useState<number[]>(Array.from({ length: 120 }, () => 10));

  React.useEffect(() => {
    if (!isPlaying) return;
    
    let animationFrameId: number;
    let lastUpdate = Date.now();

    const updateBars = () => {
      const now = Date.now();
      if (now - lastUpdate > 50) {
        setBars(prev => prev.map((_, i) => {
          const baseHeight = Math.sin(i * 0.2 + now * 0.005) * 30 + 40;
          const randomSpike = Math.random() * 30;
          return Math.max(10, Math.min(100, baseHeight + randomSpike));
        }));
        lastUpdate = now;
      }
      animationFrameId = requestAnimationFrame(updateBars);
    };

    updateBars();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  return (
    <div className="h-32 flex items-center gap-1 w-full opacity-80 overflow-hidden px-2 mb-6">
      {bars.map((height, i) => (
        <div 
          key={i} 
          className="w-1.5 bg-gradient-to-t from-purple-500 to-indigo-400 rounded-full transition-all duration-75"
          style={{ 
            height: `${isPlaying ? height : Math.max(10, Math.sin(i * 0.2) * 50 + 10)}%`,
            opacity: i % 10 === 0 ? 0.5 : 1
          }}
        ></div>
      ))}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('separator');
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [playingStem, setPlayingStem] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'MP3' | 'WAV'>('MP3');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estudio State
  const [studioStatus, setStudioStatus] = useState<ProcessStatus>('idle');
  const [studioFile, setStudioFile] = useState<File | null>(null);
  const [isStudioPlaying, setIsStudioPlaying] = useState(false);
  const [voiceEffect, setVoiceEffect] = useState<string>('none');
  const [aiEnhancement, setAiEnhancement] = useState<boolean>(true);
  const [spatialEffects, setSpatialEffects] = useState<boolean>(false);
  const [reverbMix, setReverbMix] = useState<number>(30);
  const [reverbDecay, setReverbDecay] = useState<number>(1.5);
  const [delayMix, setDelayMix] = useState<number>(20);
  const [delayFeedback, setDelayFeedback] = useState<number>(40);
  const studioFileInputRef = useRef<HTMLInputElement>(null);

  // Producer State
  const [lyricsPrompt, setLyricsPrompt] = useState<string>('');
  const [generatedLyrics, setGeneratedLyrics] = useState<string>('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [beatPrompt, setBeatPrompt] = useState<string>('');
  const [isGeneratingBeat, setIsGeneratingBeat] = useState(false);
  const [isPlayingBeat, setIsPlayingBeat] = useState(false);
  const [bpm, setBpm] = useState<number>(95);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [grid, setGrid] = useState<boolean[][]>(() => {
    const defaultGrid = Array.from({ length: 6 }, () => Array(16).fill(false));
    defaultGrid[0][0] = true; defaultGrid[0][8] = true;
    defaultGrid[1][4] = true; defaultGrid[1][12] = true;
    for(let i=0; i<16; i+=2) defaultGrid[2][i] = true;
    return defaultGrid;
  });
  const gridRef = useRef(grid);
  useEffect(() => { gridRef.current = grid; }, [grid]);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const studioAudioRef = useRef<HTMLAudioElement | null>(null);
  const effectChainRef = useRef<{
    filter: BiquadFilterNode;
    delay: DelayNode;
    feedback: GainNode;
    dryGain: GainNode;
    wetGain: GainNode;
  } | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize and route studio audio
  useEffect(() => {
    if (studioFile && !studioAudioRef.current) {
        studioAudioRef.current = new Audio();
        studioAudioRef.current.loop = true;
        
        const ctx = getAudioCtx();
        if (ctx) {
            mediaSourceRef.current = ctx.createMediaElementSource(studioAudioRef.current);
            const filter = ctx.createBiquadFilter();
            const delay = ctx.createDelay();
            const feedback = ctx.createGain();
            const dryGain = ctx.createGain();
            const wetGain = ctx.createGain();
            
            mediaSourceRef.current.connect(filter);
            
            // Ruta directa (Dry)
            filter.connect(dryGain);
            dryGain.connect(ctx.destination);
            
            // Ruta de efectos (Wet)
            filter.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wetGain);
            wetGain.connect(ctx.destination);
            
            effectChainRef.current = { filter, delay, feedback, dryGain, wetGain };
        }
    }
    if (studioFile && studioAudioRef.current) {
        studioAudioRef.current.src = URL.createObjectURL(studioFile);
    }
  }, [studioFile]);

  // Update effects
  useEffect(() => {
    if (!effectChainRef.current) return;
    const { filter, delay, feedback, dryGain, wetGain } = effectChainRef.current;
    
    if (voiceEffect === 'bad_bunny') {
        filter.type = 'lowshelf';
        filter.frequency.value = 500;
        filter.gain.value = 10;
        // Simulamos bajando un poco la velocidad (pitch shift simple)
        if (studioAudioRef.current) studioAudioRef.current.playbackRate = 0.85;
    } else if (voiceEffect === 'miky_woodz') {
        filter.type = 'highshelf';
        filter.frequency.value = 1500;
        filter.gain.value = 8;
        if (studioAudioRef.current) studioAudioRef.current.playbackRate = 1.05;
    } else if (voiceEffect === 'nengo_flow') {
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        if (studioAudioRef.current) studioAudioRef.current.playbackRate = 1.15;
    } else {
        filter.type = 'allpass';
        if (studioAudioRef.current) studioAudioRef.current.playbackRate = 1.0;
    }
    
    if (spatialEffects) {
        delay.delayTime.value = reverbDecay * 0.2;
        feedback.gain.value = Math.min((delayFeedback / 100) * 0.9, 0.9); 
        wetGain.gain.value = delayMix / 100;
        dryGain.gain.value = 1 - ((delayMix / 100) * 0.5);
    } else {
        feedback.gain.value = 0;
        wetGain.gain.value = 0;
        dryGain.gain.value = 1;
    }
    
  }, [voiceEffect, spatialEffects, delayFeedback, reverbMix, delayMix, reverbDecay]);

  // Playback control
  useEffect(() => {
    if (isStudioPlaying) {
        getAudioCtx();
        studioAudioRef.current?.play().catch(e => console.error(e));
    } else {
        studioAudioRef.current?.pause();
    }
  }, [isStudioPlaying]);

  // Sequencer Engine
  useEffect(() => {
    if (!isPlayingBeat) {
        setCurrentStep(-1);
        return;
    }
    const ctx = getAudioCtx();
    if (!ctx) return;
    
    const intervalTime = (60 / bpm) * 1000 / 4;
    let step = 0;
    setCurrentStep(0);
    playSoundsForStep(0, gridRef.current);
    
    const interval = setInterval(() => {
      step = (step + 1) % 16;
      setCurrentStep(step);
      playSoundsForStep(step, gridRef.current);
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [isPlayingBeat, bpm]);

  // Matrix for FL Studio clone (simplified)
  const tracks = ['Kick', 'Snare', 'Hi-Hat', '808 Bass', 'Synth', 'Vocals'];
  const steps = Array.from({ length: 16 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      startProcess();
    }
  };

  const handleStudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setStudioFile(selectedFile);
      setStudioStatus('done'); // Skip loading for demo purposes, straight to editor
    }
  };

  const toggleRecording = async () => {
      if (isRecording) {
          mediaRecorderRef.current?.stop();
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                  echoCancellation: true, 
                  noiseSuppression: true, 
                  autoGainControl: true,
                } 
              });
              mediaRecorderRef.current = new MediaRecorder(stream);
              mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
              mediaRecorderRef.current.onstop = () => {
                  const blob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' });
                  const newFile = new File([blob], 'grabacion_voz.ogg', { type: blob.type });
                  setStudioFile(newFile);
                  setStudioStatus('done');
                  chunksRef.current = [];
              };
              mediaRecorderRef.current.start();
              setIsRecording(true);
          } catch (e) {
              console.error(e);
              alert("No se pudo acceder al micrófono.");
          }
      }
  };

  const startProcess = () => {
    setStatus('uploading');
    setProgress(0);
    setPlayingStem(null);
    
    // Simular el proceso de subida y separación
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStatus('done');
          return 100;
        }
        if (p === 30 && status !== 'processing') {
          setStatus('processing');
        }
        return p + 2; // Incrementar progreso
      });
    }, 100);
  };

  const startStudioProcess = () => {
    setStudioStatus('processing');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStudioStatus('done');
          return 100;
        }
        return p + 5;
      });
    }, 100);
  };
  
  const generateLyrics = () => {
    if (!lyricsPrompt) return;
    setIsGeneratingLyrics(true);
    setTimeout(() => {
      setGeneratedLyrics(`(Intro)\nYeah, yeah\nDirecto desde arriba\nTú sabes quién...\n\n(Coro)\nMe dejaste en visto pero estoy brillando\nFlow cabrón, la calle la tamo' controlando\nTú te fuiste y ahora todos me están tirando\nPero sigo firme, billetes contando\n\n(Verso)\nTrataste de opacarme pero nací estrella\nTu recuerdo se borró como la huella\nEn la arena, cuando sube la marea...\nLa combi completa siempre me sella.`);
      setIsGeneratingLyrics(false);
    }, 2000);
  };
  
  const generateBeat = () => {
    if (!beatPrompt) return;
    setIsGeneratingBeat(true);
    setTimeout(() => {
      setIsGeneratingBeat(false);
      
      const newGrid = Array.from({ length: 6 }, () => Array(16).fill(false));
      for (let s = 0; s < 16; s++) {
         if (Math.random() > 0.6) newGrid[0][s] = true; // Kick
         if (s % 8 === 4) newGrid[1][s] = true; // Snare
         if (Math.random() > 0.3) newGrid[2][s] = true; // HiHats
         if (Math.random() > 0.8) newGrid[3][s] = true; // Bass
         if (Math.random() > 0.8) newGrid[4][s] = true; // Synth
      }
      setGrid(newGrid);

      setIsPlayingBeat(true);
    }, 2500);
  };

  const reset = () => {
    setStatus('idle');
    setFile(null);
    setProgress(0);
    setPlayingStem(null);
  };

  const resetStudio = () => {
    setStudioStatus('idle');
    setStudioFile(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans selection:bg-indigo-500/30 flex flex-col relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[url('https://i.imgur.com/3q174vj.png')] bg-repeat opacity-[0.03] z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="bg-[#0f0f13]/80 backdrop-blur-md border-b border-white/5 py-4 relative z-10 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
              <AudioWaveform className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">AudioStudio AI</h1>
              <p className="text-sm text-gray-400">Herramientas profesionales de audio</p>
            </div>
          </div>
          
          <div className="flex flex-wrap bg-white/5 p-1.5 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('separator')}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'separator' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              <Music className="w-4 h-4" />
              Separador
            </button>
            <button 
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'studio' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              <Mic className="w-4 h-4" />
              Estudio de Voz
            </button>
            <button 
              onClick={() => setActiveTab('producer')}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'producer' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              <Piano className="w-4 h-4" />
              Productor IA / Beatmaker
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'separator' && status === 'idle' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl mx-auto my-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold tracking-tight mb-3 text-white drop-shadow-md">Extrae voces e instrumentos</h2>
                <p className="text-gray-400 text-lg">Sube cualquier canción y nuestra IA separará las pistas en Voces, Batería, Bajo y Otros instrumentos en segundos.</p>
              </div>

              <div 
                className="border-2 border-dashed border-white/10 rounded-3xl p-12 bg-[#121217]/50 backdrop-blur-sm flex flex-col items-center justify-center text-center hover:bg-[#1a1a24]/50 hover:border-indigo-500/50 transition-all cursor-pointer group shadow-2xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Selecciona o arrastra tu audio</h3>
                <p className="text-sm text-gray-500 mb-8">Soporta MP3, WAV, FLAC, M4A (Max 15MB)</p>
                <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                  <FileAudio className="w-5 h-5" />
                  Elegir Archivo
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="audio/*" 
                  onChange={handleFileSelect} 
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'separator' && (status === 'uploading' || status === 'processing') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-md bg-[#121217]/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/10 text-center mx-auto"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full text-gray-800" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                </svg>
                <svg className="w-full h-full text-indigo-500 absolute top-0 left-0 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${progress * 2.83} 283`} className="transition-all duration-300 ease-out drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-indigo-400">
                  {progress}%
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2 text-white">
                {status === 'uploading' ? (
                  <>Subiendo archivo...</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-indigo-400" /> Separando pistas con IA...
                  </>
                )}
              </h3>
              <p className="text-gray-400 text-sm">{file?.name}</p>
            </motion.div>
          )}

          {activeTab === 'separator' && status === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl"
            >
              <div className="flex items-center justify-between mb-8 text-white">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-1 text-white">¡Separación Completada!</h2>
                  <p className="text-gray-400 text-sm">Mostrando resultados para <span className="font-semibold text-gray-200">{file?.name}</span></p>
                </div>
                <button 
                  onClick={reset}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-all text-gray-200"
                >
                  Procesar nueva pista
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {STEMS.map((stem, idx) => {
                  const isPlaying = playingStem === stem.name;
                  return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={stem.name} 
                    className={`bg-[#121217]/60 backdrop-blur-sm border p-6 rounded-2xl flex items-center justify-between group transition-all shadow-lg ${isPlaying ? 'border-indigo-500/50 shadow-indigo-500/10' : 'border-white/5'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-xl text-white shadow-lg ${stem.color}`}>
                        {stem.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white tracking-tight">{stem.name}</h4>
                        <p className="text-xs text-gray-400 font-medium">Separado por IA (Demucs v4)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setPlayingStem(isPlaying ? null : stem.name)}
                        className={`p-3 rounded-full transition-all flex items-center justify-center ${isPlaying ? 'text-white bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title={isPlaying ? "Pausar" : "Reproducir"}
                      >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>
                      <button 
                        className="p-3 text-gray-400 hover:text-white flex items-center gap-1 hover:bg-white/10 rounded-full transition-colors"
                        title={`Descargar como ${exportFormat}`}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )})}
              </div>

              <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-[#121217]/50 border border-white/5 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <label htmlFor="format" className="text-sm font-semibold text-gray-300">Formato HD:</label>
                  <select 
                    id="format"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'MP3' | 'WAV')}
                    className="border border-white/10 rounded-xl text-sm px-4 py-2 bg-black/40 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none flex-1 md:flex-none cursor-pointer"
                  >
                    <option value="MP3">MP3 (320 kbps)</option>
                    <option value="WAV">WAV (24-bit 48kHz Sin pérdida)</option>
                  </select>
                </div>
                <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:from-indigo-400 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] w-full md:w-auto">
                  <Archive className="w-5 h-5" />
                  Descargar Multi-track (.ZIP)
                </button>
              </div>

              <div className="mt-8 bg-blue-900/20 border border-blue-500/20 rounded-xl p-5 flex gap-3 text-sm text-blue-200 backdrop-blur-sm">
                <div className="mt-0.5 text-blue-400"><Sparkles className="w-5 h-5" /></div>
                <p className="leading-relaxed">
                  <strong>Demostración del frontend:</strong> En esta versión alojada, la subida y procesamiento se visualizan como maqueta (mockup). Para habilitar la separación real requiere conectarse a un modelo backend en Python (ej. Demucs o Spleeter).
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'studio' && studioStatus === 'idle' && (
            <motion.div
              key="studio-upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold tracking-tight mb-3 text-white drop-shadow-md">Clonador de Voz IA</h2>
                <p className="text-gray-400 text-lg">Graba o sube tu voz y la IA la convertirá para que suene exactamente como tu artista favorito.</p>
              </div>

              <div 
                className="border-2 border-dashed border-white/10 rounded-3xl p-12 bg-[#121217]/50 backdrop-blur-sm flex flex-col items-center justify-center text-center hover:bg-[#1a1a24]/50 hover:border-purple-500/50 transition-all shadow-2xl"
              >
                <div className="w-20 h-20 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mb-6 transition-all hover:scale-110 hover:bg-purple-500/20 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <Mic className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Canta o habla al micrófono</h3>
                <p className="text-sm text-gray-500 mb-8">Permite usar el micrófono para grabar directamente o importar tu voz</p>
                
                <div className="flex flex-col sm:flex-row gap-5">
                  <button 
                    onClick={toggleRecording}
                    className={`px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg ${isRecording ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-red-500/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white shadow-red-500/10'}`}
                  >
                    <div className={`w-3 h-3 bg-current rounded-full shadow-[0_0_8px_currentColor] ${isRecording ? 'animate-pulse' : ''}`}></div>
                    {isRecording ? 'Detener Grabación' : 'Comenzar a Grabar'}
                  </button>
                  <div className="flex items-center text-gray-600 text-sm font-medium">O</div>
                  <button 
                    onClick={() => studioFileInputRef.current?.click()}
                    className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Subir Archivo
                  </button>
                </div>
                
                <input 
                  type="file" 
                  ref={studioFileInputRef} 
                  className="hidden" 
                  accept="audio/*" 
                  onChange={handleStudioFileSelect} 
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'studio' && studioStatus === 'processing' && (
            <motion.div
              key="studio-processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-md bg-[#121217]/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/10 text-center mx-auto"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full text-gray-800" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                </svg>
                <svg className="w-full h-full text-purple-500 absolute top-0 left-0 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${progress * 2.83} 283`} className="transition-all duration-300 ease-out drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-purple-400">
                  {progress}%
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2 text-white">
                <Wand2 className="w-5 h-5 text-purple-400" /> Aplicando modelos de IA...
              </h3>
              <p className="text-gray-400 text-sm">Mejorando acústica y procesando efectos</p>
            </motion.div>
          )}

          {activeTab === 'studio' && studioStatus === 'done' && (
            <motion.div
              key="studio-editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-4xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">Editor de Audio en Vivo</h2>
                  <p className="text-gray-400 text-sm">Archivo: <span className="font-medium text-gray-200">{studioFile?.name}</span></p>
                </div>
                <button 
                  onClick={resetStudio}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors text-gray-300"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Editor en Vivo */}
              <div className="bg-[#0f0f13]/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-6 overflow-hidden relative border border-white/5">
                <div className="flex justify-between items-center mb-4 text-gray-500 font-mono text-sm">
                  <div className="flex gap-4">
                    <button className="hover:text-white transition-colors">0:00</button>
                    <button className="hover:text-white transition-colors">0:15</button>
                    <button className="hover:text-white transition-colors">0:30</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-500/80">Motor Activo</span>
                  </div>
                </div>

                {/* Waveform Real-time */}
                <LiveWaveform isPlaying={isStudioPlaying} />

                {/* Controles de Reproducción */}
                <div className="flex justify-center items-center gap-6">
                  <button className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                  </button>
                  <button 
                    onClick={() => setIsStudioPlaying(!isStudioPlaying)}
                    className="p-4 bg-white text-gray-900 hover:bg-gray-200 rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
                  >
                    {isStudioPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                  </button>
                  <button className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                  </button>
                </div>
              </div>

              {/* Controles IA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel Mejora de Estudio */}
                <div className="bg-[#121217]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-500/10 text-green-400 rounded-xl shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Mejora de Estudio (Podcast/Voz)</h3>
                      <p className="text-sm text-gray-400">Reducción de ruido y ecualización IA</p>
                    </div>
                    <label className="ml-auto inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={aiEnhancement}
                        onChange={(e) => setAiEnhancement(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>

                  <div className={`space-y-4 transition-opacity ${!aiEnhancement ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-300">Aislamiento de voz</span>
                        <span className="text-gray-500 font-mono">Intenso</span>
                      </div>
                      <input type="range" className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500" defaultValue="85" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-300">Compresión de Estudio</span>
                        <span className="text-gray-500 font-mono">Ratio 4:1</span>
                      </div>
                      <input type="range" className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500" defaultValue="60" />
                    </div>
                  </div>
                </div>

                {/* Panel Cambiador de Voz */}
                <div className="bg-[#121217]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Cover IA (Voces de Artistas)</h3>
                      <p className="text-sm text-gray-400">Efectos de emulación de artistas</p>
                    </div>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3 mb-5 flex gap-2 text-xs text-purple-200">
                    <div className="mt-0.5"><Settings className="w-4 h-4" /></div>
                    <p className="leading-tight">
                      <strong>Nota de IA:</strong> Esta interfaz utiliza filtros de navegador (Tono, EQ). Replicar voces de forma perfecta (Zero-Shot) requiere implementar un servidor backend con GPU (ej. Python, RVC o ElevenLabs).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { id: 'none', label: 'Mi Voz Original' },
                      { id: 'bad_bunny', label: 'Bad Bunny (Grave)' },
                      { id: 'miky_woodz', label: 'Miky Woodz (Brillo)' },
                      { id: 'nengo_flow', label: 'Ñengo (Agudo)' },
                      { id: 'anuel_aa', label: 'Anuel AA' },
                      { id: 'custom', label: 'Otro Artista...' },
                    ].map((effect) => (
                      <button
                        key={effect.id}
                        onClick={() => setVoiceEffect(effect.id)}
                        className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                          voiceEffect === effect.id 
                            ? 'border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                            : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/10 hover:bg-white/10 hover:text-gray-200'
                        }`}
                      >
                        {effect.label}
                      </button>
                    ))}
                  </div>
                  
                  <AnimatePresence>
                    {voiceEffect === 'custom' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2"
                      >
                        <input 
                          type="text" 
                          placeholder="Buscar otro artista (ej. Drake, Rosalía)" 
                          className="w-full text-sm px-4 py-2 border border-white/10 bg-black/40 text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder:text-gray-600"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* Panel Efectos Espaciales */}
                <div className="bg-[#121217]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl md:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                      <Waves className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Efectos Espaciales</h3>
                      <p className="text-sm text-gray-400">Ajusta Reverb y Delay para mayor profundidad</p>
                    </div>
                    <label className="ml-auto inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={spatialEffects}
                        onChange={(e) => setSpatialEffects(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity ${!spatialEffects ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Controles de Reverb */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-300 border-b border-white/10 pb-2">Reverb</h4>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-400">Mix (Mezcla)</span>
                          <span className="text-gray-500 font-mono">{reverbMix}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={reverbMix} onChange={e => setReverbMix(Number(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-400">Decay Time</span>
                          <span className="text-gray-500 font-mono">{reverbDecay}s</span>
                        </div>
                        <input type="range" min="0.1" max="5" step="0.1" value={reverbDecay} onChange={e => setReverbDecay(Number(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      </div>
                    </div>

                    {/* Controles de Delay */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-300 border-b border-white/10 pb-2">Delay</h4>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-400">Mix (Mezcla)</span>
                          <span className="text-gray-500 font-mono">{delayMix}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={delayMix} onChange={e => setDelayMix(Number(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-400">Feedback</span>
                          <span className="text-gray-500 font-mono">{delayFeedback}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={delayFeedback} onChange={e => setDelayFeedback(Number(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={startStudioProcess}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  <Download className="w-5 h-5" />
                  Renderizar y Descargar (MP3)
                </button>
              </div>

            </motion.div>
          )}

          {activeTab === 'producer' && (
            <motion.div
              key="producer-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col lg:flex-row gap-6 mt-4"
            >
              {/* Left Column: AI Ghostwriter */}
              <div className="w-full lg:w-1/3 flex flex-col gap-6">
                
                {/* Panel Letras IA */}
                <div className="bg-[#121217]/50 backdrop-blur-sm border border-white/5 rounded-2xl shadow-xl p-6 flex flex-col h-1/2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                      <Type className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Letras IA</h3>
                      <p className="text-sm text-gray-400">Genera versos y rimas</p>
                    </div>
                  </div>

                  <div className="mb-4 relative">
                    <textarea 
                      placeholder="Ej: Letra de rap sobre ganar..."
                      value={lyricsPrompt}
                      onChange={(e) => setLyricsPrompt(e.target.value)}
                      className="w-full h-24 p-3 text-sm border border-white/10 bg-black/40 text-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
                    />
                    <button 
                      onClick={generateLyrics}
                      disabled={!lyricsPrompt || isGeneratingLyrics}
                      className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/30"
                    >
                      {isGeneratingLyrics ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-4 relative overflow-y-auto min-h-[150px]">
                    {generatedLyrics ? (
                      <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                        {generatedLyrics}
                      </pre>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                        La letra aparecerá aquí
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel Mastering de Estudio AI */}
                <div className="bg-[#121217]/50 backdrop-blur-sm border border-white/5 rounded-2xl shadow-xl p-6 flex-col flex h-1/2 mt-auto">
                   <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Mastering Studio AI</h3>
                      <p className="text-sm text-gray-400">Automatiza la mezcla final</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-300 text-xs uppercase tracking-wider">Compresión Final</span>
                      </div>
                      <input type="range" className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500" defaultValue="70" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-300 text-xs uppercase tracking-wider">Ecualizador Inteligente</span>
                      </div>
                      <input type="range" className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500" defaultValue="50" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-300 text-xs uppercase tracking-wider">Limitador de Volumen</span>
                      </div>
                      <input type="range" className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500" defaultValue="90" />
                    </div>
                  </div>
                  <button className="w-full mt-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold tracking-wide border border-white/10 transition-colors flex items-center justify-center gap-2">
                     <Sparkles className="w-4 h-4" /> Finalizar Master
                  </button>
                </div>

              </div>

              {/* Right Column: FL Studio Clone */}
              <div className="w-full lg:w-2/3 flex flex-col gap-6">
                <div className="bg-[#1e1e24] border border-gray-800 rounded-2xl shadow-xl p-4 flex-1 flex flex-col text-gray-300 font-mono">
                  {/* Top Toolbar */}
                  <div className="flex flex-wrap items-center justify-between border-b border-gray-700 pb-4 mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-[#ff6b00]">
                        <LayoutGrid className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-white text-lg tracking-tight">AI Studio <span className="opacity-50">v24</span></span>
                    </div>

                    <div className="flex items-center gap-4 bg-black/30 p-2 rounded-lg border border-gray-700/50">
                      <div className="flex items-center gap-2 px-3">
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">BPM</span>
                        <input 
                          type="number" 
                          value={bpm} 
                          onChange={(e) => setBpm(Number(e.target.value))}
                          className="bg-transparent text-amber-500 font-bold w-12 outline-none text-center" 
                        />
                      </div>
                      <div className="w-px h-6 bg-gray-700"></div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setIsPlayingBeat(!isPlayingBeat)}
                          className={`p-1.5 rounded transition-colors ${isPlayingBeat ? 'text-amber-500 bg-amber-500/20' : 'hover:bg-gray-700'}`}
                        >
                          {isPlayingBeat ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Beat Generation Prompt */}
                  <div className="bg-[#2a2a35] rounded-xl p-4 mb-6 border border-gray-700 flex flex-col md:flex-row gap-3 items-center relative overflow-hidden">
                    {/* Fake Loading Overlay inside generator */}
                    {isGeneratingBeat && (
                      <div className="absolute inset-0 bg-[#2a2a35]/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                        <span className="text-amber-500 mb-2"><Loader2 className="w-6 h-6 animate-spin" /></span>
                        <span className="text-xs text-amber-500/80 uppercase tracking-widest font-bold">Generando Secuencia...</span>
                      </div>
                    )}
                    
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg text-white shrink-0 shadow-lg">
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 w-full">
                      <input 
                        type="text" 
                        placeholder="Describe un beat para generar los patrones (ej. Drill oscuro tipo Pop Smoke)"
                        value={beatPrompt}
                        onChange={(e) => setBeatPrompt(e.target.value)}
                        className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-gray-500"
                        onKeyDown={(e) => e.key === 'Enter' && generateBeat()}
                      />
                    </div>
                    <button 
                      onClick={generateBeat}
                      disabled={!beatPrompt || isGeneratingBeat}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase shrink-0 w-full md:w-auto tracking-wide"
                    >
                      Generar Beat
                    </button>
                  </div>

                  {/* Sequencer Grid */}
                  <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <div className="min-w-max border border-gray-800 rounded-lg overflow-hidden bg-black/20">
                      {/* Timeline Header */}
                      <div className="flex border-b border-gray-800 bg-[#1a1a20]">
                        <div className="w-24 shrink-0 border-r border-gray-800 flex items-center justify-center">
                          <Settings className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 flex">
                          {steps.map((_, i) => (
                            <div key={i} className={`flex-1 h-6 border-r border-gray-800/50 flex items-end px-1 pb-0.5 ${i % 4 === 0 ? 'bg-white/5' : ''}`}>
                              {i % 4 === 0 && <span className="text-[10px] text-gray-500">{i/4 + 1}</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tracks */}
                      {tracks.map((track, trackIndex) => (
                        <div key={track} className="flex border-b border-gray-800/80 group hover:bg-white/5">
                          {/* Track Info */}
                          <div className="w-24 shrink-0 border-r border-gray-800 bg-[#25252e] flex items-center px-2 z-10 transition-colors">
                            <span className="text-[11px] font-semibold text-gray-300 truncate" title={track}>{track}</span>
                          </div>
                          {/* Step Buttons */}
                          <div className="flex-1 flex cursor-pointer">
                            {steps.map((_, stepIndex) => {
                              const isActive = grid[trackIndex][stepIndex];
                              const isCurrentStep = currentStep === stepIndex;

                              return (
                                <div 
                                  key={stepIndex} 
                                  onClick={() => {
                                    const newGrid = [...grid];
                                    newGrid[trackIndex] = [...newGrid[trackIndex]];
                                    newGrid[trackIndex][stepIndex] = !newGrid[trackIndex][stepIndex];
                                    setGrid(newGrid);
                                  }}
                                  className={`flex-1 h-10 border-r border-gray-800/30 m-[1px] md:m-[2px] rounded-sm transition-colors duration-75
                                    ${stepIndex % 4 === 0 ? 'border-l-gray-700' : ''} 
                                    ${isActive 
                                      ? (isCurrentStep ? 'bg-[#ffeb3b] shadow-[0_0_12px_rgba(255,235,59,0.8)]' : 'bg-gradient-to-b from-[#ff8c00] to-[#e04000] shadow-[0_0_8px_rgba(255,140,0,0.4)]') 
                                      : (isCurrentStep ? 'bg-[#404050]' : 'bg-[#32323e] hover:bg-[#404050]')}`
                                  }
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="py-6 text-center text-xs text-gray-500 border-t border-white/5 bg-[#09090b] mt-auto relative z-10 backdrop-blur-md">
        &copy; {new Date().getFullYear()} AudioStudio AI. Licencia MIT. Construido para demostrar el uso de IA en producción musical.
      </footer>
    </div>
  );
}
