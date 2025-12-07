import React, { useEffect, useState } from 'react';
import { generateFusionReport } from '../services/geminiService';
import { AppState, AnalysisResult } from '../types';
import { Loader2, Activity, ShieldCheck, MapPin, Phone } from './Icons';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  data: AppState;
  onReportGenerated: (report: AnalysisResult) => void;
}

export const Dashboard: React.FC<Props> = ({ data, onReportGenerated }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data.finalReport) {
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const report = await generateFusionReport(data.voiceResult, data.faceResult, data.chatHistory);
        onReportGenerated(report);
      } catch (err) {
        setError("Could not generate fusion report.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="card-base p-16 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Synthesizing Analysis</h3>
        <p className="text-slate-500">Integrating voice, facial, and text data...</p>
      </div>
    );
  }

  if (error || !data.finalReport) {
    return <div className="text-center text-red-500 p-8 card-base">{error || "No data available"}</div>;
  }

  const report = data.finalReport;

  const scoreData = [
    { name: 'Wellness', value: report.wellnessScore },
    { name: 'Gap', value: 100 - report.wellnessScore }
  ];
  // Modern colors: Green-500, Amber-500, Red-500
  const scoreColors = report.wellnessScore > 70 ? ['#10b981', '#f1f5f9'] : report.wellnessScore > 40 ? ['#f59e0b', '#f1f5f9'] : ['#ef4444', '#f1f5f9'];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Score Card */}
      <div className="card-base p-10 flex flex-col md:flex-row items-center justify-between gap-10 bg-gradient-to-br from-white to-slate-50/50">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-slate-900">Wellness Assessment</h2>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
               report.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
               report.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-700' :
               'bg-red-100 text-red-700'
             }`}>
               Risk Level: {report.riskLevel}
             </span>
          </div>
          <p className="text-slate-600 text-lg leading-relaxed">{report.summary}</p>
        </div>
        
        <div className="relative w-56 h-56 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={scoreData}
                innerRadius={70}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                cornerRadius={10}
              >
                {scoreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={scoreColors[index]} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-slate-900 tracking-tighter">{report.wellnessScore}</span>
            <span className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-1">Score</span>
          </div>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-base p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Activity className="w-5 h-5 text-blue-600" /></div>
            Key Indicators
          </h3>
          <div className="space-y-4">
            {report.indicators.map((ind, i) => (
              <div key={i} className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                <div>
                  <p className="font-bold text-slate-800 mb-1">{ind.name}</p>
                  <p className="text-sm text-slate-500">{ind.description}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
                  ind.severity === 'high' ? 'bg-red-100 text-red-600' :
                  ind.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {ind.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <div className="p-2 bg-primary-100 rounded-lg"><ShieldCheck className="w-5 h-5 text-primary-600" /></div>
            AI Recommendations
          </h3>
          <div className="bg-primary-50/50 p-6 rounded-2xl border border-primary-100 h-full">
            <p className="whitespace-pre-line leading-relaxed text-slate-700 font-medium">{report.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Resources */}
      {(report.riskLevel === 'high' || report.riskLevel === 'severe' || report.riskLevel === 'moderate') && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-red-800 mb-6 flex items-center gap-2">
            <Phone className="w-6 h-6" /> Professional Support Resources
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <a href="tel:988" className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-red-100 hover:border-red-300 group">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                 <Phone className="w-6 h-6" />
               </div>
               <div>
                 <p className="font-bold text-gray-900 text-lg">988 Lifeline</p>
                 <p className="text-sm text-gray-500">24/7 Confidential Crisis Support</p>
               </div>
            </a>
            <a href="https://www.findahelpline.com" target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-blue-100 hover:border-blue-300 group">
               <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                 <MapPin className="w-6 h-6" />
               </div>
               <div>
                 <p className="font-bold text-gray-900 text-lg">Find Help Near Me</p>
                 <p className="text-sm text-gray-500">Locate therapists & clinics</p>
               </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};