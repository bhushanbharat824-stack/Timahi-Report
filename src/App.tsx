import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import MainNavbar from './components/MainNavbar';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import Analytics from './components/Analytics';
import SectionManagement from './components/SectionManagement';
import { sectionService } from './services/sectionService';
import { reportService } from './services/reportService';
import { View, Report, User, UserRole, ReportStatus } from './types';
import { CheckCircle, X, ShieldCheck, UserCircle2, ArrowRight, Lock, Eye, EyeOff, BadgeCheck, LogIn, AlertCircle } from 'lucide-react';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 border border-red-100">
            <AlertCircle className="text-red-500 mx-auto" size={48} />
            <h2 className="text-2xl font-bold text-gray-800">Oops! An error occurred</h2>
            <p className="text-gray-600 text-sm">{this.state.error?.message || "Something went wrong."}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [reports, setReports] = useState<Report[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const loadedReports = await reportService.getReports();
      const loadedSections = sectionService.getSections();
      setReports(loadedReports);
      setSections(loadedSections);
    };
    loadData();
  }, []);

  // Static Public User (No Auth Required)
  const [currentUser] = useState<User>({
    id: 'public-user',
    name: 'Public User',
    role: 'MASTER', // Allow all features in standalone mode
    sectionName: 'Admin'
  });

  const handleSaveReport = async (report: Report) => {
    // In Netlify Forms mode, the form submission is handled by the browser/Netlify
    // We also save locally for the dashboard/list to work in the current session
    await reportService.saveReport(report);
    const updatedReports = await reportService.getReports();
    setReports(updatedReports);
    
    showNotification("रिपोर्ट सफलतापूर्वक सबमिट की गई! (Netlify Forms)");
    setEditingReport(null);
    setCurrentView('dashboard');
  };

  const handleUpdateStatus = async (id: string, status: ReportStatus, remarks?: string) => {
    const report = reports.find(r => r.id === id);
    if (report) {
      const updatedReport = { ...report, status, saoRemarks: remarks || report.saoRemarks };
      await reportService.saveReport(updatedReport);
      const updatedReports = await reportService.getReports();
      setReports(updatedReports);
      showNotification(`रिपोर्ट ${status === 'APPROVED' ? 'स्वीकृत' : status === 'REJECTED' ? 'अस्वीकृत' : ''} कर दी गई है।`);
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setCurrentView('new-report');
  };

  const handleDeleteReport = async (id: string) => {
    if (window.confirm("क्या आप वाकई इस रिपोर्ट को हटाना चाहते हैं?")) {
      await reportService.deleteReport(id);
      const updatedReports = await reportService.getReports();
      setReports(updatedReports);
      showNotification("रिपोर्ट हटा दी गई");
    }
  };

  const onUpdateData = async () => {
    const loadedReports = await reportService.getReports();
    const loadedSections = sectionService.getSections();
    setReports(loadedReports);
    setSections(loadedSections);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleNavigate = (view: View) => {
    if (view !== 'new-report') setEditingReport(null);
    setCurrentView(view);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter']">
        <MainNavbar currentView={currentView} onNavigate={handleNavigate} currentUser={currentUser} />
        
        {/* Role Indicator Bar */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full bg-orange-500 animate-pulse`}></div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
               STANDALONE MODE: {currentUser.name}
             </span>
          </div>
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
              reports={reports} 
              onDelete={handleDeleteReport} 
              onEdit={handleEditReport} 
              currentUser={currentUser}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
          {currentView === 'analytics' && <Analytics reports={reports} />}
          {currentView === 'sections' && (
            <SectionManagement sections={sections} reports={reports} onUpdate={onUpdateData} />
          )}
        </main>

        <footer className="bg-white border-t py-6 text-center text-gray-400 text-xs font-medium">
          <p>&copy; {new Date().getFullYear()} | तिमाही रिपोर्ट प्रबंधन प्रणाली</p>
          <p className="mt-1 opacity-50">Standalone Deployment | Netlify Forms Enabled</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
