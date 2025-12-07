import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from './Icons';
import { analyzeFace } from '../services/geminiService';
import { FaceAnalysisData } from '../types';

interface Props {
  onComplete: (data: FaceAnalysisData) => void;
  onCrisis: () => void;
}

export const FaceAnalyzer: React.FC<Props> = ({ onComplete, onCrisis }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError("Unable to access camera. Please allow permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeFace(image);
      if (result.isCrisis) {
        onCrisis();
      }
      onComplete(result);
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="card-base p-8 w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-3 rounded-full">
          <Camera className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Facial Expression</h2>
          <p className="text-slate-500 text-sm">Analyzes micro-expressions to gauge emotional state.</p>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-slate-100 rounded-3xl overflow-hidden mb-8 flex items-center justify-center border border-slate-200 shadow-inner group">
        {!image && !isCameraActive && (
          <div className="text-center text-slate-400 group-hover:scale-105 transition-transform">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No image captured</p>
          </div>
        )}
        
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`absolute inset-0 w-full h-full object-cover transform scale-x-[-1] ${isCameraActive ? 'block' : 'hidden'}`} 
        />
        
        {image && !isCameraActive && (
          <img src={image} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {!image && !isCameraActive && (
          <button onClick={startCamera} className="btn-primary px-8 py-3 font-bold flex items-center gap-2 shadow-lg shadow-primary-500/25 w-full sm:w-auto justify-center">
            <Camera className="w-5 h-5" /> Open Camera
          </button>
        )}

        {isCameraActive && (
           <button onClick={capturePhoto} className="btn-primary px-8 py-3 font-bold flex items-center gap-2 shadow-lg shadow-primary-500/25 w-full sm:w-auto justify-center">
             <Camera className="w-5 h-5" /> Capture Photo
           </button>
        )}

        <div className="relative w-full sm:w-auto">
          <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <button className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-purple-300 text-slate-600 hover:text-purple-600 px-8 py-3 rounded-full font-bold transition-colors w-full justify-center">
            <Upload className="w-5 h-5" /> Upload Photo
          </button>
        </div>
      </div>

      {image && !isCameraActive && (
        <div className="mt-8 flex gap-4 justify-center border-t border-slate-100 pt-8">
          <button onClick={() => setImage(null)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold transition-colors">
             Retake
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex-1 sm:flex-none px-10 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
          >
            {isAnalyzing ? <><Loader2 className="animate-spin" /> Analyzing...</> : "Analyze Expression"}
          </button>
        </div>
      )}
      
      {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm font-medium border border-red-100">{error}</div>}
    </div>
  );
};