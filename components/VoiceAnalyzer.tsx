import React, { useState, useRef } from 'react';
import { Mic, Upload, Activity, Loader2 } from './Icons';
import { analyzeVoice } from '../services/geminiService';
import { VoiceAnalysisData } from '../types';

interface Props {
  onComplete: (data: VoiceAnalysisData) => void;
  onCrisis: () => void;
}

export const VoiceAnalyzer: React.FC<Props> = ({ onComplete, onCrisis }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      drawVisualizer();

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        chunksRef.current = [];
        if (sourceRef.current) sourceRef.current.disconnect();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError("Could not access microphone. Please check permissions.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      // Match background color
      ctx.fillStyle = '#fafafa'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.5;
        // Gradient color for bars from Violet to Blue
        ctx.fillStyle = `rgb(${130 + (barHeight/2)}, ${90 + (barHeight/2)}, 240)`;
        // Soft rounded bars
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const handleAnalyze = async () => {
    if (!audioBlob) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeVoice(audioBlob);
      if (result.isCrisis) {
        onCrisis();
      }
      onComplete(result);
    } catch (err) {
      setError("Analysis failed. Please try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
    }
  };

  return (
    <div className="card-base p-8 w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary-100 p-3 rounded-full">
          <Mic className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Voice Tone Analysis</h2>
          <p className="text-slate-500 text-sm">Detects subtle emotional markers in your speech patterns.</p>
        </div>
      </div>

      <div className="relative w-full h-48 bg-slate-50 rounded-2xl mb-8 overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
        <canvas ref={canvasRef} width="800" height="200" className="absolute inset-0 w-full h-full" />
        
        {!isRecording && !audioBlob && (
          <div className="text-slate-400 z-10 font-medium">Click "Start Recording" to begin</div>
        )}
        
        {audioBlob && !isRecording && (
          <div className="z-10 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             Audio Captured Ready for Analysis
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 shadow-lg shadow-primary-500/25 w-full sm:w-auto justify-center"
          >
            <Mic className="w-5 h-5" /> Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold transition-all animate-pulse w-full sm:w-auto justify-center shadow-lg shadow-red-500/25"
          >
            <Activity className="w-5 h-5" /> Stop Recording
          </button>
        )}

        <div className="relative w-full sm:w-auto">
           <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-primary-300 text-slate-600 hover:text-primary-600 px-8 py-3 rounded-full font-bold transition-colors w-full justify-center">
            <Upload className="w-5 h-5" /> Upload File
          </button>
        </div>
      </div>

      {audioBlob && (
        <div className="mt-8 flex justify-center border-t border-slate-100 pt-8">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-xl flex items-center justify-center gap-3 transition-all hover:-translate-y-1"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processing Audio...
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" /> Analyze Wellness
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100 font-medium">
          {error}
        </div>
      )}
    </div>
  );
};