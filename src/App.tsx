import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import AppNavbar from './components/AppNavbar';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import Analytics from './components/Analytics';
import SectionManagement from './components/SectionManagement';
import { View, Report, User, UserRole, ReportStatus } from './types';
import { reportService } from './services/reportService';
import { sectionService } from './services/sectionService';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc,
  setDoc,
  FirebaseUser
} from './firebase';
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
      let errorMessage = "Something went wrong.";
      try {
        const parsedError = JSON.parse(this.state.error?.message || "{}");
        if (parsedError.error) {
          errorMessage = `Firestore Error: ${parsedError.error} during ${parsedError.operationType} on ${parsedError.path}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 border border-red-100">
            <AlertCircle className="text-red-500 mx-auto" size={48} />
            <h2 className="text-2xl font-bold text-gray-800">Oops! An error occurred</h2>
            <p className="text-gray-600 text-sm">{errorMessage}</p>
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
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginStep, setLoginStep] = useState<'ROLE' | 'SECTION' | 'PASSWORD'>('ROLE');
  const [loginRole, setLoginRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Real-time data sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        } else {
          // If no profile, we might need to set one up or handle it
          // For now, if they logged in via Google but have no role, we might default to SECTION
          // But we'll let the login flow handle it for now
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !firebaseUser) {
      setReports([]);
      setSections([]);
      return;
    }

    // Real-time reports
    const qReports = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Report);
      setReports(data);
    }, (error) => {
      console.error("Reports snapshot error:", error);
    });

    // Real-time sections
    const qSections = query(collection(db, 'sections'), orderBy('name', 'asc'));
    const unsubscribeSections = onSnapshot(qSections, (snapshot) => {
      const data = snapshot.docs.map(doc => (doc.data() as { name: string }).name);
      setSections(data);
    }, (error) => {
      console.error("Sections snapshot error:", error);
    });

    return () => {
      unsubscribeReports();
      unsubscribeSections();
    };
  }, [isAuthReady, firebaseUser]);

  const handleGoogleLogin = async (role: UserRole, section?: string) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userProfile: User = {
        id: user.uid,
        name: user.displayName || section || 'User',
        role: role,
        sectionName: section,
        email: user.email || undefined
      };

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), userProfile);
      setCurrentUser(userProfile);
      showNotification("सफलतापूर्वक लॉगिन किया गया!");
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("लॉगिन विफल रहा। कृपया पुनः प्रयास करें।");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      setLoginStep('ROLE');
      setCurrentView('dashboard');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSaveReport = async (report: Report) => {
    if (!firebaseUser) return;
    
    const reportWithAuthor = { ...report, authorUid: firebaseUser.uid };
    
    if (editingReport) {
      await reportService.updateReport(reportWithAuthor);
      showNotification(report.status === 'PENDING_SAO' ? `रिपोर्ट SAO अनुमोदन हेतु भेज दी गई है!` : `रिपोर्ट सफलतापूर्वक अपडेट की गई!`);
    } else {
      await reportService.saveReport(reportWithAuthor);
      showNotification(report.status === 'PENDING_SAO' ? `रिपोर्ट SAO अनुमोदन हेतु भेज दी गई है!` : `ड्राफ्ट सफलतापूर्वक सहेजा गया!`);
    }
    setEditingReport(null);
    setCurrentView('reports-list');
  };

  const handleUpdateStatus = async (id: string, status: ReportStatus, remarks?: string) => {
    const report = reports.find(r => r.id === id);
    if (report) {
      const updated = { ...report, status, saoRemarks: remarks || report.saoRemarks };
      await reportService.updateReport(updated);
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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4 relative overflow-hidden font-['Inter']">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
        
        <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[40px] shadow-2xl text-center">
            
            <h1 className="text-3xl font-black text-white mb-2">राजभाषा पोर्टल</h1>
            <p className="text-indigo-200/60 mb-8 font-medium">तिमाही रिपोर्ट प्रबंधन प्रणाली (Cloud Enabled)</p>

            {loginStep === 'ROLE' ? (
              <div className="space-y-4">
                <button 
                  onClick={() => { setLoginStep('SECTION'); setLoginRole('MASTER'); }}
                  className="w-full bg-white text-indigo-900 font-bold py-4 rounded-2xl flex items-center justify-between px-6 hover:bg-indigo-50 transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <ShieldCheck className="text-orange-500" />
                    <span>मास्टर लॉगिन (Master Admin)</span>
                  </div>
                  <ArrowRight size={20} />
                </button>

                <button 
                  onClick={() => { setLoginStep('SECTION'); setLoginRole('SAO'); }}
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
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="text-left">
                  <label className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2 block ml-2">
                    {loginRole === 'MASTER' ? 'मास्टर एडमिन' : loginRole === 'SAO' ? 'SAO' : 'अनुभाग'} चुनें
                  </label>
                  <div className="relative">
                    <select 
                      onChange={e => {
                        const val = e.target.value;
                        if (val) handleGoogleLogin(loginRole || 'SECTION', val);
                      }}
                      className="w-full bg-indigo-900/50 border border-indigo-700 text-white p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none appearance-none font-bold"
                    >
                      <option value="">-- चुनें --</option>
                      {loginRole === 'MASTER' ? (
                        <option value="मास्टर एडमिन">मास्टर एडमिन</option>
                      ) : loginRole === 'SAO' ? (
                        <option value="वरिष्ठ लेखापरीक्षा अधिकारी (SAO)">वरिष्ठ लेखापरीक्षा अधिकारी (SAO)</option>
                      ) : (
                        sections.map(s => <option key={s} value={s}>{s}</option>)
                      )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                      <ArrowRight size={20} className="rotate-90" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs text-indigo-200/60 mb-4">सुरक्षित लॉगिन के लिए Google का उपयोग करें</p>
                  <button 
                    onClick={() => handleGoogleLogin(loginRole || 'SECTION', 'Default')}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 border border-white/10"
                  >
                    <LogIn size={18} /> Google के साथ लॉगिन
                  </button>
                </div>

                <button onClick={() => { setLoginStep('ROLE'); setLoginRole(null); }} className="text-indigo-300 text-sm font-bold hover:text-white transition">वापस जाएं</button>
                {authError && <p className="text-red-400 text-xs font-bold">{authError}</p>}
              </div>
            )}
          </div>
          
          <p className="text-center mt-8 text-indigo-300/40 text-[10px] font-black uppercase tracking-[0.2em]">
            तिमाही रिपोर्ट प्रबंधन प्रणाली पोर्टल • Cloud Powered
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter']">
        <AppNavbar currentView={currentView} onNavigate={handleNavigate} currentUser={currentUser} />
        
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
            <SectionManagement sections={sections} reports={reports} onUpdate={() => {}} />
          )}
        </main>

        <footer className="bg-white border-t py-6 text-center text-gray-400 text-xs font-medium">
          <p>&copy; {new Date().getFullYear()} | तिमाही रिपोर्ट प्रबंधन प्रणाली</p>
          <p className="mt-1 opacity-50">Developed for Tracking Progress and Compliance</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
