import React from 'react';
import { View, User } from '../types';
import { LayoutDashboard, FilePlus, List, BarChart3, Settings } from 'lucide-react';

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  currentUser: User | null;
}

const MainNavbar: React.FC<NavbarProps> = ({ currentView, onNavigate, currentUser }) => {
  const links = [
    { id: 'dashboard', label: 'डैशबोर्ड', icon: LayoutDashboard },
    { id: 'reports-list', label: 'रिपोर्ट सूची', icon: List },
    { id: 'analytics', label: 'विश्लेषण', icon: BarChart3 },
  ];

  // Sections can create new reports
  if (currentUser?.role !== 'SAO') {
    links.splice(1, 0, { id: 'new-report', label: 'नई रिपोर्ट', icon: FilePlus });
  }

  // Add Section Management for MASTER users
  if (currentUser?.role === 'MASTER') {
    links.push({ id: 'sections', label: 'अनुभाग प्रबंधन', icon: Settings });
  }

  return (
    <nav className="bg-indigo-900 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <span className="text-xl font-bold tracking-tight">राजभाषा पोर्टल</span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => onNavigate(link.id as View)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === link.id
                        ? 'bg-indigo-700 text-white'
                        : 'text-indigo-100 hover:bg-indigo-800'
                    }`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:hidden flex items-center space-x-2">
             {currentUser?.role !== 'SAO' && (
               <button onClick={() => onNavigate('new-report')} className="p-2 hover:bg-indigo-800 rounded">
                  <FilePlus size={20} />
               </button>
             )}
             {currentUser?.role === 'MASTER' && (
               <button onClick={() => onNavigate('sections')} className="p-2 hover:bg-indigo-800 rounded">
                  <Settings size={20} />
               </button>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;
