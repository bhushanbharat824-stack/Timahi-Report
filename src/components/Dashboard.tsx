import React, { useState, useMemo } from 'react';
import { Report, Quarter, User } from '../types';
import { 
  TrendingUp, AlertTriangle, Calendar, Clock, 
  CheckCircle2, XCircle, FileBarChart, LayoutGrid,
  Bell, AlertCircle
} from 'lucide-react';

interface DashboardProps {
  reports: Report[];
  currentUser: User;
  sections: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ reports, currentUser, sections }) => {
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(Quarter.Q1);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // Submission window logic (1st to 5th of Jan, Apr, Jul, Oct)
  const isSubmissionWindow = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return [1, 4, 7, 10].includes(month) && day <= 5;
  }, []);

  const submissionStatus = useMemo(() => {
    const map: Record<string, Report | null> = {};
    sections.forEach(s => map[s] = null);
    
    reports.forEach(r => {
      if (r.quarter === selectedQuarter && r.year === selectedYear) {
        map[r.sectionName] = r;
      }
    });
    return map;
  }, [reports, selectedQuarter, selectedYear, sections]);

  const submittedCount = Object.values(submissionStatus).filter(Boolean).length;
  const pendingCount = sections.length - submittedCount;

  const displayReports = (currentUser.role === 'MASTER' || currentUser.role === 'SAO') 
    ? reports.filter(r => r.quarter === selectedQuarter && r.year === selectedYear)
    : reports.filter(r => r.sectionName === currentUser.sectionName);

  const avgHindi = displayReports.length > 0
    ? (displayReports.reduce((sum, r) => sum + r.correspondence.overallPercentage, 0) / displayReports.length).toFixed(2)
    : "0.00";

  const pendingSaoCount = displayReports.filter(r => r.status === 'PENDING_SAO').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Reminder Banner */}
      <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-center gap-4 transition-all duration-500 ${
        isSubmissionWindow 
        ? 'bg-amber-50 border-amber-200 shadow-lg animate-pulse' 
        : 'bg-indigo-50 border-indigo-100 shadow-sm'
      }`}>
        <div className={`p-3 rounded-2xl ${isSubmissionWindow ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}>
          {isSubmissionWindow ? <AlertCircle size={24} /> : <Bell size={24} />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className={`text-sm font-black uppercase tracking-widest ${isSubmissionWindow ? 'text-amber-700' : 'text-indigo-900'}`}>
            {isSubmissionWindow ? 'रिपोर्ट जमा करने की समय सीमा' : 'महत्वपूर्ण अनुस्मारक'}
          </h4>
          <p className={`text-sm font-medium ${isSubmissionWindow ? 'text-amber-800' : 'text-indigo-700/70'}`}>
            पिछली तिमाही की रिपोर्ट अगले माह की <span className="font-bold underline">5 तारीख</span> तक जमा करना अनिवार्य है।
          </p>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {currentUser.role === 'MASTER' ? 'मास्टर डैशबोर्ड' : currentUser.role === 'SAO' ? 'SAO डैशबोर्ड' : `${currentUser.sectionName} डैशबोर्ड`}
          </h1>
          <p className="text-gray-500">राजभाषा प्रगति का विहंगम दृश्य</p>
        </div>
        
        {(currentUser.role === 'MASTER' || currentUser.role === 'SAO') && (
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            <select 
              value={selectedQuarter} 
              onChange={e => setSelectedQuarter(e.target.value as Quarter)}
              className="bg-transparent text-sm font-bold text-indigo-700 px-3 py-1 outline-none"
            >
              {Object.values(Quarter).map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-transparent text-sm font-bold text-indigo-700 px-3 py-1 outline-none"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
              <option value="2031">2031</option>
            </select>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl"><FileBarChart size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">कुल जमा</p>
            <p className="text-2xl font-bold text-gray-900">{(currentUser.role === 'MASTER' || currentUser.role === 'SAO') ? `${submittedCount}/${sections.length}` : displayReports.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-2xl"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">औसत हिंदी (%)</p>
            <p className="text-2xl font-bold text-gray-900">{avgHindi}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">लंबित (Not Filed)</p>
            <p className="text-2xl font-bold text-gray-900">{(currentUser.role === 'MASTER' || currentUser.role === 'SAO') ? pendingCount : (displayReports.length > 0 ? 0 : 1)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-amber-200 flex items-center gap-4 bg-amber-50">
          <div className="p-4 bg-amber-200 text-amber-800 rounded-2xl"><Clock size={24} /></div>
          <div>
            <p className="text-sm font-medium text-amber-800 leading-tight">SAO अनुमोदन हेतु लंबित</p>
            <p className="text-2xl font-black text-amber-900">{pendingSaoCount}</p>
          </div>
        </div>
      </div>

      {(currentUser.role === 'MASTER' || currentUser.role === 'SAO') && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <LayoutGrid className="text-indigo-600" /> अनुभाग स्थिति
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {sections.map(sectionName => {
              const report = submissionStatus[sectionName];
              let StatusIcon = XCircle;
              let iconColor = "text-gray-400";
              let bgClass = "bg-gray-50 border-gray-200 opacity-50";

              if (report) {
                if (report.status === 'PENDING_SAO') {
                  StatusIcon = Clock;
                  iconColor = "text-amber-600";
                  bgClass = "bg-amber-50 border-amber-200";
                } else if (report.status === 'REJECTED') {
                  StatusIcon = AlertTriangle;
                  iconColor = "text-red-500";
                  bgClass = "bg-red-50 border-red-200";
                } else if (report.status === 'DRAFT') {
                  StatusIcon = FileBarChart;
                  iconColor = "text-slate-500";
                  bgClass = "bg-slate-50 border-slate-200";
                } else {
                  StatusIcon = CheckCircle2;
                  iconColor = "text-green-600";
                  bgClass = "bg-green-50 border-green-200";
                }
              }

              return (
                <div key={sectionName} className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${bgClass}`}>
                  <StatusIcon className={iconColor} size={20} />
                  <span className="text-xs font-bold leading-tight text-gray-700">{sectionName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;