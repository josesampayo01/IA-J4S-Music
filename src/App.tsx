import React, { useState, useRef } from 'react';
import { Upload, Music, Mic, Drum, Guitar, Waves, Download, Play, Pause, Loader2, Sparkles, FileAudio, Archive, Sliders, Wand2, AudioWaveform } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ProcessStatus = 'idle' | 'uploading' | 'processing' | 'done';
type AppTab = 'separator' | 'studio';

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
  const [voiceEffect, setVoiceEffect] = useState<string>('none');
  const [aiEnhancement, setAiEnhancement] = useState<boolean>(true);
  const studioFileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <AudioWaveform className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">AudioStudio AI</h1>
              <p className="text-sm text-gray-500">Herramientas profesionales de audio</p>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('separator')}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'separator' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Music className="w-4 h-4" />
              Separador de Pistas
            </button>
            <button 
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'studio' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Mic className="w-4 h-4" />
              Estudio de Voz IA
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {activeTab === 'separator' && status === 'idle' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-3">Extrae voces e instrumentos</h2>
                <p className="text-gray-600">Sube cualquier canción y nuestra IA separará las pistas en Voces, Batería, Bajo y Otros instrumentos en segundos.</p>
              </div>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-indigo-400 transition-colors cursor-pointer group shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Selecciona o arrastra tu audio</h3>
                <p className="text-sm text-gray-500 mb-6">Soporta MP3, WAV, FLAC, M4A (Max 15MB)</p>
                <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <FileAudio className="w-4 h-4" />
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
              className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full text-gray-200" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                </svg>
                <svg className="w-full h-full text-indigo-600 absolute top-0 left-0 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${progress * 2.83} 283`} className="transition-all duration-300 ease-out" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-indigo-600">
                  {progress}%
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                {status === 'uploading' ? (
                  <>Subiendo archivo...</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-indigo-500" /> Separando pistas con IA...
                  </>
                )}
              </h3>
              <p className="text-gray-500 text-sm">{file?.name}</p>
            </motion.div>
          )}

          {activeTab === 'separator' && status === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-1">¡Separación Completada!</h2>
                  <p className="text-gray-500 text-sm">Mostrando resultados para <span className="font-semibold text-gray-700">{file?.name}</span></p>
                </div>
                <button 
                  onClick={reset}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Procesar nueva pista
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STEMS.map((stem, idx) => {
                  const isPlaying = playingStem === stem.name;
                  return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={stem.name} 
                    className={`bg-white border p-5 rounded-xl shadow-sm flex items-center justify-between group transition-colors ${isPlaying ? 'border-indigo-300 ring-1 ring-indigo-300' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg text-white ${stem.color}`}>
                        {stem.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{stem.name}</h4>
                        <p className="text-xs text-gray-500">Separado por IA</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setPlayingStem(isPlaying ? null : stem.name)}
                        className={`p-2 rounded-full transition-colors flex items-center justify-center ${isPlaying ? 'text-indigo-600 bg-indigo-100 ring-2 ring-indigo-200' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        title={isPlaying ? "Pausar" : "Reproducir"}
                      >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-indigo-600 flex items-center gap-1 hover:bg-indigo-50 rounded-full transition-colors"
                        title={`Descargar como ${exportFormat}`}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )})}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label htmlFor="format" className="text-sm font-medium text-gray-700">Formato:</label>
                  <select 
                    id="format"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'MP3' | 'WAV')}
                    className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none flex-1 sm:flex-none cursor-pointer"
                  >
                    <option value="MP3">MP3 (Menor tamaño)</option>
                    <option value="WAV">WAV (Sin pérdida)</option>
                  </select>
                </div>
                <button className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto">
                  <Archive className="w-5 h-5" />
                  Descargar todo (.ZIP)
                </button>
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
                <div className="mt-0.5"><Sparkles className="w-4 h-4" /></div>
                <p>
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
                <h2 className="text-3xl font-bold tracking-tight mb-3">Clonador de Voz IA</h2>
                <p className="text-gray-600">Graba o sube tu voz y la IA la convertirá para que suene exactamente como tu artista favorito.</p>
              </div>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-purple-400 transition-colors shadow-sm"
              >
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110 cursor-pointer">
                  <Mic className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Canta o habla al micrófono</h3>
                <p className="text-sm text-gray-500 mb-6">Permite usar el micrófono para grabar directamente</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      // Fake recording flow for demo
                      setStudioStatus('done');
                      setStudioFile(new File([], "grabacion_voz_01.wav"));
                    }}
                    className="bg-red-500 text-white px-6 py-2.5 rounded-full font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    Comenzar a Grabar
                  </button>
                  <div className="flex items-center text-gray-400 text-sm">o</div>
                  <button 
                    onClick={() => studioFileInputRef.current?.click()}
                    className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
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
              className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full text-gray-200" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                </svg>
                <svg className="w-full h-full text-purple-600 absolute top-0 left-0 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${progress * 2.83} 283`} className="transition-all duration-300 ease-out" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-purple-600">
                  {progress}%
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" /> Aplicando modelos de IA...
              </h3>
              <p className="text-gray-500 text-sm">Mejorando acústica y procesando efectos</p>
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
                  <h2 className="text-2xl font-bold tracking-tight">Editor de Audio en Vivo</h2>
                  <p className="text-gray-500 text-sm">Archivo: <span className="font-medium text-gray-700">{studioFile?.name}</span></p>
                </div>
                <button 
                  onClick={resetStudio}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Editor en Vivo */}
              <div className="bg-gray-900 rounded-2xl p-6 shadow-lg mb-6 overflow-hidden relative">
                <div className="flex justify-between items-center mb-4 text-gray-400">
                  <div className="flex gap-4">
                    <button className="hover:text-white transition-colors">0:00</button>
                    <button className="hover:text-white transition-colors">0:15</button>
                    <button className="hover:text-white transition-colors">0:30</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-sm font-medium">Motor de audio activo</span>
                  </div>
                </div>

                {/* Waveform Fake */}
                <div className="h-32 flex items-center gap-1 w-full opacity-80 overflow-hidden px-2 mb-6">
                  {Array.from({ length: 120 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-gradient-to-t from-purple-500 to-indigo-400 rounded-full"
                      style={{ 
                        height: `${Math.max(10, Math.sin(i * 0.2) * 50 + Math.random() * 40 + 10)}%`,
                        opacity: i % 10 === 0 ? 0.5 : 1
                      }}
                    ></div>
                  ))}
                </div>

                {/* Controles de Reproducción */}
                <div className="flex justify-center items-center gap-6">
                  <button className="p-3 text-white hover:bg-white/10 rounded-full transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                  </button>
                  <button className="p-4 bg-white text-gray-900 hover:bg-gray-200 rounded-full transition-colors shadow-lg shadow-white/10">
                    <Play className="w-6 h-6 fill-current" />
                  </button>
                  <button className="p-3 text-white hover:bg-white/10 rounded-full transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                  </button>
                </div>
              </div>

              {/* Controles IA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel Mejora de Estudio */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Mejora de Estudio (Podcast/Voz)</h3>
                      <p className="text-sm text-gray-500">Reducción de ruido y ecualización IA</p>
                    </div>
                    <label className="ml-auto inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={aiEnhancement}
                        onChange={(e) => setAiEnhancement(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-4 ring-transparent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>

                  <div className={`space-y-4 transition-opacity ${!aiEnhancement ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Aislamiento de voz</span>
                        <span className="text-gray-500">Intenso</span>
                      </div>
                      <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600" defaultValue="85" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Compresión de Estudio</span>
                        <span className="text-gray-500">Radio 4:1</span>
                      </div>
                      <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600" defaultValue="60" />
                    </div>
                  </div>
                </div>

                {/* Panel Cambiador de Voz */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Cover IA (Voces de Artistas)</h3>
                      <p className="text-sm text-gray-500">Haz que tu voz suene como tus cantantes favoritos</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { id: 'none', label: 'Mi Voz Original' },
                      { id: 'bad_bunny', label: 'Bad Bunny' },
                      { id: 'miky_woodz', label: 'Miky Woodz' },
                      { id: 'nengo_flow', label: 'Ñengo Flow' },
                      { id: 'anuel_aa', label: 'Anuel AA' },
                      { id: 'custom', label: 'Otro Artista...' },
                    ].map((effect) => (
                      <button
                        key={effect.id}
                        onClick={() => setVoiceEffect(effect.id)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                          voiceEffect === effect.id 
                            ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-500' 
                            : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-gray-50'
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
                          className="w-full text-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

              </div>
              
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={startStudioProcess}
                  className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Download className="w-5 h-5" />
                  Renderizar y Descargar (MP3)
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="py-6 text-center text-sm text-gray-400 border-t border-gray-100 bg-white mt-auto">
        &copy; {new Date().getFullYear()} AudioStudio AI. Licencia MIT.
      </footer>
    </div>
  );
}
