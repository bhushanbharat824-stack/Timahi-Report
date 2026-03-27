import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import Analytics from './components/Analytics';
import SectionManagement from './components/SectionManagement';
import { View, Report, User, UserRole, ReportStatus } from './types';
import { reportService } from './services/reportService';
import { sectionService } from './services/sectionService';
import { CheckCircle, X, ShieldCheck, UserCircle2, ArrowRight, Lock, Eye, EyeOff, BadgeCheck } from 'lucide-react';

const MASTER_PASSWORD = 'ADMIN_RAJBHASHA_2025';
const SAO_PASSWORD = 'SAO_RAJBHASHA_2025';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [reports, setReports] = useState<Report[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginStep, setLoginStep] = useState<'ROLE' | 'SECTION' | 'PASSWORD'>('ROLE');
  const [loginRole, setLoginRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    setReports(reportService.getReports());
    setSections(sectionService.getSections());
    
    // Persist login state
    const savedUser = sessionStorage.getItem('rajbhasha_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const refreshSections = () => {
    setSections([...sectionService.getSections()]);
    setReports([...reportService.getReports()]);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginRole === 'MASTER' && password === MASTER_PASSWORD) {
      handleLogin('MASTER', 'मास्टर एडमिन');
      setPassword('');
      setAuthError('');
    } else if (loginRole === 'SAO' && password === SAO_PASSWORD) {
      handleLogin('SAO', 'वरिष्ठ लेखापरीक्षा अधिकारी (SAO)');
      setPassword('');
      setAuthError('');
    } else {
      setAuthError('गलत पासवर्ड! कृपया पुनः प्रयास करें।');
    }
  };

  const handleLogin = (role: UserRole, section?: string) => {
    const user: User = {
      id: role === 'MASTER' ? 'admin' : role === 'SAO' ? 'sao' : `sec-${Date.now()}`,
      name: section!,
      role: role,
      sectionName: section
    };
    setCurrentUser(user);
    sessionStorage.setItem('rajbhasha_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginStep('ROLE');
    sessionStorage.removeItem('rajbhasha_user');
    setCurrentView('dashboard');
  };

  const handleSaveReport = (report: Report) => {
    if (editingReport) {
      reportService.updateReport(report);
      setReports(prev => prev.map(r => r.id === report.id ? report : r));
      showNotification(report.status === 'PENDING_SAO' ? `रिपोर्ट SAO अनुमोदन हेतु भेज दी गई है!` : `रिपोर्ट सफलतापूर्वक अपडेट की गई!`);
    } else {
      reportService.saveReport(report);
      setReports(prev => [...prev, report]);
      showNotification(report.status === 'PENDING_SAO' ? `रिपोर्ट SAO अनुमोदन हेतु भेज दी गई है!` : `ड्राफ्ट सफलतापूर्वक सहेजा गया!`);
    }
    setEditingReport(null);
    setCurrentView('reports-list');
  };

  const handleUpdateStatus = (id: string, status: ReportStatus, remarks?: string) => {
    const report = reports.find(r => r.id === id);
    if (report) {
      const updated = { ...report, status, saoRemarks: remarks || report.saoRemarks };
      reportService.updateReport(updated);
      setReports(prev => prev.map(r => r.id === id ? updated : r));
      showNotification(`रिपोर्ट ${status === 'APPROVED' ? 'स्वीकृत' : status === 'REJECTED' ? 'अस्वीकृत' : ''} कर दी गई है।`);
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setCurrentView('new-report');
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm("क्या आप वाकई इस रिपोर्ट को हटाना चाहते हैं?")) {
      reportService.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      showNotification("रिपोर्ट हटा दी गई");
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleNavigate = (view: View) => {
    if (view !== 'new-report') setEditingReport(null);
    setCurrentView(view);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4 relative overflow-hidden font-['Inter']">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
        
        <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[40px] shadow-2xl text-center">
            
            <h1 className="text-3xl font-black text-white mb-2">राजभाषा पोर्टल</h1>
            <p className="text-indigo-200/60 mb-8 font-medium">तिमाही रिपोर्ट प्रबंधन प्रणाली</p>

            {loginStep === 'ROLE' ? (
              <div className="space-y-4">
                <button 
                  onClick={() => { setLoginStep('PASSWORD'); setLoginRole('MASTER'); }}
                  className="w-full bg-white text-indigo-900 font-bold py-4 rounded-2xl flex items-center justify-between px-6 hover:bg-indigo-50 transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <ShieldCheck className="text-orange-500" />
                    <span>मास्टर लॉगिन (Master Admin)</span>
                  </div>
                  <ArrowRight size={20} />
                </button>

                <button 
                  onClick={() => { setLoginStep('PASSWORD'); setLoginRole('SAO'); }}
                  className="w-full bg-amber-500/10 border border-amber-500/50 text-amber-100 font-bold py-4 rounded-2xl flex items-center justify-between px-6 hover:bg-amber-500/20 transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <BadgeCheck className="text-amber-400" />
                    <span>SAO लॉगिन (Review Officer)</span>
                  </div>
                  <ArrowRight size={20} />
                </button>

                <button 
                  onClick={() => setLoginStep('SECTION')}
                  className="w-full bg-indigo-800/50 border border-indigo-700/50 text-white font-bold py-4 rounded-2xl flex items-center justify-between px-6 hover:bg-indigo-800 transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <UserCircle2 className="text-indigo-300" />
                    <span>अनुभाग लॉगिन (Section Access)</span>
                  </div>
                  <ArrowRight size={20} />
                </button>
              </div>
            ) : loginStep === 'PASSWORD' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-6 animate-in slide-in-from-right-4">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <Lock size={14} className={loginRole === 'SAO' ? "text-amber-400" : "text-orange-400"} />
                    <label className="text-indigo-100 text-xs font-bold uppercase tracking-widest block">
                      {loginRole === 'SAO' ? 'SAO पासवर्ड' : 'मास्टर पासवर्ड'}
                    </label>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setAuthError(''); }}
                      placeholder="••••••••••••"
                      className="w-full bg-indigo-900/50 border border-indigo-700 text-white p-4 pr-12 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {authError && <p className="text-red-400 text-xs mt-2 ml-1 font-bold">{authError}</p>}
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    type="submit"
                    className={`w-full text-white font-bold py-4 rounded-2xl transition shadow-lg ${loginRole === 'SAO' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-950/20'}`}
                  >
                    लॉगिन करें
                  </button>
                  <button type="button" onClick={() => { setLoginStep('ROLE'); setPassword(''); setAuthError(''); }} className="text-indigo-300 text-sm font-bold hover:text-white transition">वापस जाएं</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="text-left">
                  <label className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2 block ml-2">अनुभाग चुनें (Select Section)</label>
                  <div className="relative">
                    <select 
                      onChange={e => e.target.value && handleLogin('SECTION', e.target.value)}
                      className="w-full bg-indigo-900/50 border border-indigo-700 text-white p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none appearance-none font-bold"
                    >
                      <option value="">-- अनुभाग चुनें --</option>
                      {sections.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                      <ArrowRight size={20} className="rotate-90" />
                    </div>
                  </div>
                </div>
                <button onClick={() => setLoginStep('ROLE')} className="text-indigo-300 text-sm font-bold hover:text-white transition">वापस जाएं</button>
              </div>
            )}
          </div>
          
          <p className="text-center mt-8 text-indigo-300/40 text-[10px] font-black uppercase tracking-[0.2em]">
            तिमाही रिपोर्ट प्रबंधन प्रणाली पोर्टल
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter']">
      <Navbar currentView={currentView} onNavigate={handleNavigate} currentUser={currentUser} />
      
      {/* Role Indicator Bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${currentUser.role === 'MASTER' ? 'bg-orange-500' : currentUser.role === 'SAO' ? 'bg-amber-500' : 'bg-green-500'} animate-pulse`}></div>
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
             {currentUser.role === 'MASTER' ? 'ADMIN ACCESS' : currentUser.role === 'SAO' ? 'SAO ACCESS' : 'SECTION ACCESS'}: {currentUser.sectionName}
           </span>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded-full transition border border-transparent hover:border-red-100">LOGOUT</button>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {notification && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span className="font-semibold">{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)}>
              <X size={20} />
            </button>
          </div>
        )}

        {currentView === 'dashboard' && <Dashboard reports={reports} currentUser={currentUser} sections={sections} />}
        {currentView === 'new-report' && <ReportForm onSave={handleSaveReport} initialData={editingReport} allReports={reports} currentUser={currentUser} />}
        {currentView === 'reports-list' && (
          <ReportList 
            reports={currentUser.role === 'MASTER' || currentUser.role === 'SAO' ? reports : reports.filter(r => r.sectionName === currentUser.sectionName)} 
            onDelete={handleDeleteReport} 
            onEdit={handleEditReport} 
            currentUser={currentUser}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
        {currentView === 'analytics' && <Analytics reports={currentUser.role === 'MASTER' || currentUser.role === 'SAO' ? reports : reports.filter(r => r.sectionName === currentUser.sectionName)} />}
        {currentView === 'sections' && currentUser.role === 'MASTER' && (
          <SectionManagement sections={sections} onUpdate={refreshSections} />
        )}
      </main>

      <footer className="bg-white border-t py-6 text-center text-gray-400 text-xs font-medium">
        <p>&copy; {new Date().getFullYear()} | तिमाही रिपोर्ट प्रबंधन प्रणाली</p>
        <p className="mt-1 opacity-50">Developed for Tracking Progress and Compliance</p>
      </footer>
    </div>
  );
};

export default App;