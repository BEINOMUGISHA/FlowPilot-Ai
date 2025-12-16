
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Loader2, Sparkles, Square, AlertCircle, RefreshCw, X, Keyboard } from 'lucide-react';
import { parseNaturalLanguageTask, transcribeAudio } from '../services/geminiService';
import { Task } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

interface SmartTaskCaptureProps {
  onTaskAdded: (task: Task) => void;
}

const MAX_DURATION_MS = 30000; // 30 seconds
const SILENCE_DURATION_MS = 2500; // 2.5 seconds of silence triggers stop
const SILENCE_WARNING_MS = 1000; // Show warning after 1s of silence
const VAD_WARMUP_MS = 1000; // Ignore silence for first second
const VAD_THRESHOLD = 0.02; // RMS Threshold for silence (0.02 = ~ -34dB)

export const SmartTaskCapture: React.FC<SmartTaskCaptureProps> = ({ onTaskAdded }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [silenceDetected, setSilenceDetected] = useState(false);
  const [retryBlob, setRetryBlob] = useState<{ blob: Blob, mimeType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useTranslation();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Data Buffers Refs
  const dataArrayTimeRef = useRef<Uint8Array | null>(null);
  const dataArrayFreqRef = useRef<Uint8Array | null>(null);

  // VAD & Timer Refs
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const silenceDetectedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingAndCleanup(false);
    };
  }, []);

  const stopRecordingAndCleanup = (shouldProcess: boolean) => {
    // 1. Stop MediaRecorder if still running (rare if called from onstop)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Failed to stop media recorder:", e);
      }
    }
    
    // 2. Stop Microphone Stream Tracks to release hardware
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Failed to stop track:", e);
        }
      });
      streamRef.current = null;
    }

    // 3. Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    // 4. Reset UI state if not processing
    if (!shouldProcess) {
      setIsRecording(false);
      setSilenceDetected(false);
    }

    // 5. Clear Timers & Animation
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // 6. Reset logic refs
    silenceStartRef.current = null;
    recordingStartRef.current = null;
    silenceDetectedRef.current = false;
    // Don't nullify mediaRecorderRef here immediately as onstop needs it, 
    // but onstop runs after stop(), so it's usually fine. 
  };

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser || !dataArrayTimeRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    
    const draw = () => {
      // Safety check: stop drawing if recording stopped
      if (!isRecording && !streamRef.current) return;

      animationFrameRef.current = requestAnimationFrame(draw);
      
      // 1. Get Data (Time Domain)
      analyser.getByteTimeDomainData(dataArrayTimeRef.current!);

      // 2. VAD Logic (RMS from Time Domain)
      const currentTime = Date.now();
      const recordingDuration = currentTime - (recordingStartRef.current || currentTime);

      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArrayTimeRef.current![i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);

      if (recordingDuration >= MAX_DURATION_MS) {
        stopRecording();
        return;
      }

      if (recordingDuration > VAD_WARMUP_MS) {
        if (rms < VAD_THRESHOLD) {
          if (!silenceStartRef.current) {
            silenceStartRef.current = currentTime;
          } else {
            const silenceDuration = currentTime - silenceStartRef.current;
            if (silenceDuration > SILENCE_DURATION_MS) {
              stopRecording();
              return;
            }
            if (silenceDuration > SILENCE_WARNING_MS && !silenceDetectedRef.current) {
              silenceDetectedRef.current = true;
              setSilenceDetected(true);
            }
          }
        } else {
          silenceStartRef.current = null;
          if (silenceDetectedRef.current) {
            silenceDetectedRef.current = false;
            setSilenceDetected(false);
          }
        }
      }

      // 3. Drawing Logic (Waveform)
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = silenceDetectedRef.current ? '#f59e0b' : '#ef4444';

      ctx.beginPath();

      const sliceWidth = width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArrayTimeRef.current![i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, height / 2);
      ctx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(t('capture.error_support'));
      return;
    }
    
    setRetryBlob(null);
    setInput('');
    setRecordingTime(0);
    setSilenceDetected(false);
    silenceDetectedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; 
      analyser.smoothingTimeConstant = 0.8; 
      analyserRef.current = analyser;
      
      dataArrayTimeRef.current = new Uint8Array(analyser.frequencyBinCount);
      dataArrayFreqRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all hardware access immediately
        stopRecordingAndCleanup(true);
        setIsRecording(false);
        setSilenceDetected(false);

        const recordedChunks = chunksRef.current;
        if (recordedChunks.length > 0) {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(recordedChunks, { type: mimeType });
          await handleAudioProcess(blob, mimeType);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsExpanded(true);
      recordingStartRef.current = Date.now();
      
      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - (recordingStartRef.current || Date.now());
        setRecordingTime(Math.min(elapsed, MAX_DURATION_MS));
      }, 100);

      setTimeout(drawVisualizer, 100);

    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      let msg = t('capture.error_mic');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Microphone access denied. Check your browser permissions.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "No microphone found.";
      } else if (err.name === 'NotReadableError') {
        msg = "Microphone is busy or inaccessible.";
      }
      setError(msg);
      setIsRecording(false);
      stopRecordingAndCleanup(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleAudioProcess = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setRetryBlob(null);
    setError(null);
    
    try {
      const base64 = await blobToBase64(blob);
      const text = await transcribeAudio(base64, mimeType);
      
      if (text) {
        setInput(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${text}` : text;
        });
      } else {
        throw new Error("No transcription received");
      }
    } catch (e) {
      console.error("Audio processing error:", e);
      setError("Transcription failed. Please retry or type manually.");
      setRetryBlob({ blob, mimeType });
    } finally {
      setIsProcessing(false);
      stopRecordingAndCleanup(false); // Ensure full cleanup
    }
  };

  const handleRetry = () => {
    if (retryBlob) {
      handleAudioProcess(retryBlob.blob, retryBlob.mimeType);
    }
  };

  const handleManualFallback = () => {
    setError(null);
    setRetryBlob(null);
    setIsProcessing(false);
    stopRecordingAndCleanup(false);
    setIsRecording(false);

    setTimeout(() => {
      inputRef.current?.focus();
      setIsExpanded(true);
    }, 100);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);
    try {
      const parsed = await parseNaturalLanguageTask(input);
      const newTask: Task = {
        id: uuidv4(),
        title: parsed.title,
        status: 'pending',
        priority: parsed.priority,
        dueDate: parsed.dueDate || new Date().toISOString(),
        category: parsed.category || 'General',
        source: 'manual',
        description: parsed.description,
        aiConfidence: 0.95
      };
      onTaskAdded(newTask);
      setInput('');
      setIsExpanded(false);
      setRetryBlob(null);
    } catch (error) {
      console.error("Failed to add task", error);
      setError("Failed to create task. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`
      relative bg-white rounded-2xl shadow-lg border border-slate-100 transition-all duration-300 overflow-hidden
      ${isExpanded ? 'ring-2 ring-indigo-500/30 transform scale-[1.01]' : 'hover:shadow-xl'}
      ${error ? 'ring-2 ring-red-100 border-red-200' : ''}
    `}>
      <form onSubmit={handleSubmit} className="relative">
        
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 px-4 py-2 flex items-center justify-between text-sm text-red-700 border-b border-red-100 animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                type="button" 
                onClick={handleManualFallback}
                className="flex items-center space-x-1 font-medium hover:underline text-red-800"
              >
                <Keyboard size={14} /> <span>{t('capture.type')}</span>
              </button>
              <div className="h-4 w-px bg-red-200"></div>
              <button 
                type="button" 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Retry Banner */}
        {retryBlob && !isProcessing && !error && (
          <div className="bg-amber-50 px-4 py-2 flex items-center justify-between text-sm text-amber-800 border-b border-amber-100 animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>Transcription failed.</span>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                type="button" 
                onClick={handleRetry}
                className="flex items-center space-x-1 font-medium hover:underline"
              >
                <RefreshCw size={14} /> <span>{t('capture.retry')}</span>
              </button>
              <div className="h-4 w-px bg-amber-200"></div>
              <button 
                type="button" 
                onClick={handleManualFallback}
                className="flex items-center space-x-1 text-amber-700 hover:underline"
              >
                 <Keyboard size={14} />
                 <span>{t('capture.type')}</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center px-4 py-4">
          <div className={`flex-shrink-0 mr-4 transition-colors duration-300 ${isRecording ? 'text-red-500 animate-pulse' : 'text-indigo-500'}`}>
            {isProcessing ? (
              <Loader2 className="animate-spin text-indigo-600" size={24} />
            ) : (
              <Sparkles size={24} className={isExpanded ? 'text-fuchsia-500' : ''} />
            )}
          </div>
          
          {isRecording ? (
            <div className="flex-1 flex items-center space-x-4 h-9 overflow-hidden">
              {/* Timer */}
              <div className="text-sm font-mono text-red-600 font-bold w-12 flex-shrink-0">
                {formatTime(recordingTime)}
              </div>
              
              {/* Waveform Canvas */}
              <div className="flex-1 h-full relative flex items-center justify-center">
                 <canvas 
                   ref={canvasRef} 
                   width={200} 
                   height={36} 
                   className="w-full h-full"
                 />
              </div>

              {/* Status Text */}
              <span className={`text-xs font-bold animate-pulse hidden sm:inline-block whitespace-nowrap uppercase tracking-wider ${silenceDetected ? 'text-amber-500' : 'text-red-500'}`}>
                {silenceDetected ? t('capture.silence') : t('capture.listening')}
              </span>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setRetryBlob(null);
                setError(null);
              }}
              onFocus={() => setIsExpanded(true)}
              onBlur={() => !input && !isRecording && !retryBlob && !error && setIsExpanded(false)}
              placeholder={isProcessing ? t('capture.processing') : t('capture.placeholder')}
              className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-lg disabled:opacity-50 font-medium"
              disabled={isProcessing}
            />
          )}
          
          <div className="flex items-center space-x-3 ml-2">
            <button
              type="button"
              className={`
                p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isRecording 
                  ? 'text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 ring-2 ring-red-100 scale-110' 
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}
              `}
              title={isRecording ? "Stop Recording" : "Voice Input"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={22} />}
            </button>
            
            <button
              type="submit"
              disabled={!input.trim() || isProcessing || isRecording}
              className={`
                px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center font-medium shadow-md
                ${input.trim() && !isRecording && !isProcessing
                  ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:shadow-lg hover:scale-105 transform active:scale-95' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'}
              `}
            >
              <Send size={18} className="mr-2" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* AI Hint Area */}
        {isExpanded && !isProcessing && !isRecording && !retryBlob && !error && (
          <div className="px-14 pb-4 text-xs font-medium text-slate-400 flex items-center space-x-4 animate-in fade-in slide-in-from-top-1">
            <span className="bg-slate-50 px-2 py-1 rounded text-slate-500 border border-slate-100">{t('capture.try')}</span>
          </div>
        )}
      </form>
    </div>
  );
};
