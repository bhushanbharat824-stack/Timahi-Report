import React, { useState, useRef } from 'react';
import { sectionService } from '../services/sectionService';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { Plus, Trash2, Building2, AlertTriangle, Search, Download, Upload, Database, CheckCircle2, X } from 'lucide-react';

interface SectionManagementProps {
  sections: string[];
  reports: Report[];
  onUpdate: () => void;
}

const SectionManagement: React.FC<SectionManagementProps> = ({ sections, reports, onUpdate }) => {
  const [newSection, setNewSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importStatus, setImportStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, section: string}>({isOpen: false, section: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSection.trim()) return;
    if (sections.includes(newSection.trim())) {
      alert("यह अनुभाग पहले से मौजूद है।");
      return;
    }
    await sectionService.addSection(newSection.trim());
    setNewSection('');
    onUpdate();
  };

  const confirmDelete = async (deleteReports: boolean) => {
    const name = deleteModal.section;
    try {
      await sectionService.deleteSection(name);
      if (deleteReports) {
        // We need to implement this in reportService or handle it here
        // For now, let's assume reportService.deleteReportsBySection is async
        await reportService.deleteReportsBySection(name);
      }
      setImportStatus({ message: `अनुभाग "${name}" सफलतापूर्वक हटा दिया गया है।`, type: 'success' });
    } catch (err) {
      console.error("Error during deletion:", err);
      setImportStatus({ message: "अनुभाग को हटाने में त्रुटि हुई।", type: 'error' });
    } finally {
      setDeleteModal({isOpen: false, section: ''});
      onUpdate();
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const handleExport = () => {
    reportService.exportData(reports, sections);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = await reportService.importData(event.target?.result as string);
      if (result.success) {
        setImportStatus({ message: `${result.count} नई रिपोर्टें सफलतापूर्वक आयात की गईं!`, type: 'success' });
        onUpdate();
      } else {
        setImportStatus({ message: "आयात विफल! कृपया सही बैकअप फ़ाइल चुनें।", type: 'error' });
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const filteredSections = sections.filter(s => 
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">प्रबंधन एवं बैकअप</h1>
          <p className="text-gray-500">अनुभाग सूची और डेटा सुरक्षा प्रबंधित करें</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition border border-indigo-200"
          >
            <Download size={18} /> बैकअप लें (Export)
          </button>
          <button 
            onClick={handleImportClick}
            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition border border-gray-200"
          >
            <Upload size={18} /> डेटा आयात करें (Import)
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </header>

      {importStatus && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${
          importStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-bold">{importStatus.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Section Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="text-indigo-600" size={20} />
              नया अनुभाग जोड़ें
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">अनुभाग का नाम</label>
                <input 
                  type="text" 
                  value={newSection}
                  onChange={e => setNewSection(e.target.value)}
                  placeholder="उदा. सामान्य प्रशासन"
                  className="w-full bg-white border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-black"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <Plus size={18} /> सहेजें (Add Section)
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl text-gray-800 shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
            <Database className="absolute -right-4 -bottom-4 opacity-5 text-gray-400" size={120} />
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Database size={20} className="text-orange-500" />
              डेटा प्रबंधन टिप
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              यह सिस्टम अब क्लाउड स्टोरेज (Firebase Firestore) का उपयोग करता है। आपका डेटा सुरक्षित है और रीयल-टाइम में सिंक होता है। आप अभी भी सुरक्षा के लिए बैकअप ले सकते हैं।
            </p>
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              System Version 2.0.0 (Cloud)
            </div>
          </div>
        </div>

        {/* Sections List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="अनुभाग खोजें..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-white outline-none text-sm font-medium text-black rounded-lg"
            />
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">#</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">अनुभाग का नाम</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSections.map((section, index) => (
                    <tr key={section} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-white transition-colors">
                            <Building2 size={16} />
                          </div>
                          <span className="font-bold text-gray-700">{section}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setDeleteModal({isOpen: true, section: section})}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="अनुभाग हटाएं"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Deletion Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle size={18} /> अनुभाग हटाएं (Delete Section)
              </h3>
              <button onClick={() => setDeleteModal({ isOpen: false, section: '' })} className="hover:bg-red-500 p-1 rounded transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="bg-red-50 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
                  <Trash2 size={36} />
                </div>
                <h4 className="text-xl font-bold text-gray-800">क्या आप "{deleteModal.section}" को हटाना चाहते हैं?</h4>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">कृपया अपनी आवश्यकता के अनुसार नीचे दिए गए विकल्पों में से किसी एक का चयन करें।</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => confirmDelete(false)}
                  className="w-full text-left p-4 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition flex items-start gap-4 group"
                >
                  <div className="p-2.5 bg-orange-200 text-orange-700 rounded-xl group-hover:bg-orange-300 transition shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-orange-900 text-base">केवल अनुभाग का नाम हटाएं</h5>
                    <p className="text-xs text-orange-700/80 mt-1 leading-relaxed">यह अनुभाग को ड्रॉपडाउन सूची से हटा देगा, लेकिन इसके द्वारा पहले जमा की गई <strong>पुरानी रिपोर्टें (डेटा) सुरक्षित रहेंगी</strong>।</p>
                  </div>
                </button>

                <button 
                  onClick={() => confirmDelete(true)}
                  className="w-full text-left p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition flex items-start gap-4 group"
                >
                  <div className="p-2.5 bg-red-200 text-red-700 rounded-xl group-hover:bg-red-300 transition shrink-0">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-red-900 text-base">अनुभाग और उसकी सभी रिपोर्टें हटाएं</h5>
                    <p className="text-xs text-red-700/80 mt-1 leading-relaxed">यह अनुभाग और <strong>उसके द्वारा जमा की गई सभी पिछली रिपोर्टों को हमेशा के लिए मिटा देगा</strong>।</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionManagement;