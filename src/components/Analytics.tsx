
import React, { useState } from 'react';
import { Report } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { geminiService } from '../services/geminiService';
import { BrainCircuit, Sparkles, TrendingUp, Target, Lightbulb, ChevronRight, Loader2, FileSpreadsheet } from 'lucide-react';

interface AnalyticsProps {
  reports: Report[];
}

const Analytics: React.FC<AnalyticsProps> = ({ reports }) => {
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const chartData = reports.map(r => ({
    name: `${r.quarter.split(' ')[0]}`,
    percentage: r.correspondence.overallPercentage,
    total: r.correspondence.toRegionA.total + r.correspondence.toRegionB.total + r.correspondence.toRegionC.total,
  }));

  const handleGetAiAnalysis = async () => {
    setLoading(true);
    try {
      const analysis = await geminiService.analyzeTrends(reports);
      setAiAnalysis(analysis);
    } catch (err) {
      setAiAnalysis("AI विश्लेषण विफल रहा।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">प्रदर्शन विश्लेषण</h2>
          <p className="text-gray-500 font-medium">डेटा और एआई अंतर्दृष्टि</p>
        </div>
        <button 
          onClick={handleGetAiAnalysis}
          disabled={loading || reports.length === 0}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition font-bold disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit />} 
          {geminiService.isAvailable() ? 'एआई विश्लेषण' : 'त्वरित विश्लेषण (Offline)'}
        </button>
      </header>

      {!geminiService.isAvailable() && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2">
          <Sparkles size={14} />
          <span>एआई एपीआई कुंजी उपलब्ध नहीं है। सिस्टम वर्तमान में बुनियादी विश्लेषण मोड में काम कर रहा है।</span>
        </div>
      )}

      {aiAnalysis && (
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-orange-400"><Sparkles /> <h3 className="text-xl font-bold">एआई कार्यकारी सारांश</h3></div>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap">{aiAnalysis}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><TrendingUp className="text-indigo-600" /> प्रगति (%)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip />
              <Bar dataKey="percentage" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><FileSpreadsheet className="text-orange-500" /> पत्र मात्रा</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" name="कुल पत्र" stroke="#f59e0b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
