import React, { useState, useMemo, useEffect } from 'react';
import { Report, Quarter, ReportStatus, User } from '../types';
import { FileText, Download, Trash2, CheckCircle, Mail, X, Send, Loader2, Edit3, Filter, FileSpreadsheet, Building2, Clock, XCircle, FileBarChart } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { geminiService } from '../services/geminiService';

interface ReportListProps {
  reports: Report[];
  currentUser: User;
  onDelete: (id: string) => void;
  onEdit: (report: Report) => void;
  onUpdateStatus: (id: string, status: ReportStatus, remarks?: string) => void;
}

const ReportList: React.FC<ReportListProps> = ({ reports, currentUser, onDelete, onEdit, onUpdateStatus }) => {
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; report: Report | null }>({
    isOpen: false,
    report: null,
  });
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  // Derive unique years from reports for the filter dropdown
  const uniqueYears = useMemo(() => {
    const years = reports.map(r => r.year);
    return Array.from(new Set(years)).sort((a: string, b: string) => b.localeCompare(a));
  }, [reports]);

  // Reset filter if the selected year is no longer available in the report list
  useEffect(() => {
    if (filterYear !== 'all' && !uniqueYears.includes(filterYear)) {
      setFilterYear('all');
    }
  }, [uniqueYears, filterYear]);

  // Filter reports based on selected year
  const filteredReports = useMemo(() => {
    if (filterYear === 'all') return reports;
    return reports.filter(r => r.year === filterYear);
  }, [reports, filterYear]);

  const downloadExcel = () => {
    if (reports.length === 0) return;
    
    const exportData = reports.map(r => {
      const isQ4 = r.quarter === Quarter.Q4;
      const totalLettersAggregated = (r.correspondence?.toRegionA?.total || 0) + (r.correspondence?.toRegionB?.total || 0) + (r.correspondence?.toRegionC?.total || 0);
      
      return {
        'Section (अनुभाग)': r.sectionName || '-',
        'Year (वर्ष)': r.year || '-',
        'Quarter (तिमाही)': r.quarter || '-',
        'Status (स्थिति)': r.status || 'APPROVED',
        'Office (कार्यालय)': r.officeInfo?.name || '-',
        'Region (क्षेत्र)': r.region || '-',
        'Ack ID (पावती संख्या)': r.acknowledgementId || '-',
        'Submitted By (प्रस्तुतकर्ता)': r.submittedBy || '-',
        'Hindi Correspondence % (हिंदी पत्राचार %)': r.correspondence?.overallPercentage || 0,
        'Total Letters (कुल पत्र)': totalLettersAggregated,
        '3(3) Bilingual (3(3) द्विभाषी)': `${r.section33?.bilingual || 0}/${r.section33?.total || 0}`,
        'Rule 5 Compliance (नियम 5 अनुपालन %)': (r.rule5?.totalHindiReceived || 0) > 0 
          ? Math.round(((r.rule5?.repliedHindi || 0) / ((r.rule5?.totalHindiReceived || 0) - (r.rule5?.noReplyNeeded || 0))) * 100) + '%'
          : 'N/A',
        // Part 2 fields mapped dynamically
        'Total Staff (कुल कर्मचारी)': isQ4 ? (r.part2?.staff?.total || '-') : '-',
        'Proficient Staff (प्रवीण कर्मचारी)': isQ4 ? (r.part2?.staff?.proficient || '-') : '-',
        'Unicode Computers (यूनिकोड कंप्यूटर)': isQ4 ? `${r.part2?.computers?.unicodeEnabled || 0}/${r.part2?.computers?.total || 0}` : '-',
        'Hindi Book Exp % (हिंदी पुस्तक व्यय %)': isQ4 ? ((r.part2?.library?.totalExpenditure || 0) ? Math.round(((r.part2?.library?.hindiExpenditure || 0) / (r.part2?.library?.totalExpenditure || 1))*100)+'%' : '0%') : '-',
        'Timestamp (प्रविष्टि समय)': r.timestamp ? new Date(r.timestamp).toLocaleString() : '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rajbhasha Reports");
    XLSX.writeFile(wb, `Rajbhasha_Consolidated_Report_${new Date().getFullYear()}.xlsx`);
  };

  const downloadPDF = async (report: Report) => {
    try {
      setPdfLoading(report.id);
      const doc = new jsPDF();
      
      // 1. Fetch and inject Devanagari TTF Font to support Hindi text
      const fontUrl = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf';
      const response = await fetch(fontUrl);
      const buffer = await response.arrayBuffer();
      
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      const fontBase64 = btoa(binary);
      
      doc.addFileToVFS('NotoSansDevanagari.ttf', fontBase64);
      doc.addFont('NotoSansDevanagari.ttf', 'NotoSans', 'normal');
      doc.setFont('NotoSans');

      // 2. Build PDF Layout
      const primaryColor = [79, 70, 229] as [number, number, number];

      doc.setFontSize(18);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("राजभाषा तिमाही प्रगति रिपोर्ट (Quarterly Progress Report)", 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`${report.quarter || '-'} ${report.year || '-'} | अनुभाग: ${report.sectionName || '-'}`, 105, 22, { align: 'center' });

      const officeData = [
        ["अनुभाग का नाम (Section Name)", report.sectionName || '-'],
        ["स्थिति (Status)", report.status === 'APPROVED' ? 'स्वीकृत (Approved)' : report.status || 'APPROVED'],
        ["क्षेत्र (Region)", report.region || '-'],
        ["पावती संख्या (Ack ID)", report.acknowledgementId || '-'],
        ["प्रस्तुतकर्ता (Submitted By)", report.submittedBy || '-'],
        ["प्रविष्टि समय (Timestamp)", report.timestamp ? new Date(report.timestamp).toLocaleString() : '-']
      ];

      autoTable(doc, {
        startY: 30,
        head: [['विवरण (Parameter)', 'जानकारी (Value)']],
        body: officeData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, font: 'NotoSans' },
        styles: { font: 'NotoSans' } // Apply Hindi font to all cells
      });

      const aggregatedHindi = (report.correspondence?.toRegionA?.hindi || 0) + (report.correspondence?.toRegionB?.hindi || 0) + (report.correspondence?.toRegionC?.hindi || 0);
      const aggregatedTotal = (report.correspondence?.toRegionA?.total || 0) + (report.correspondence?.toRegionB?.total || 0) + (report.correspondence?.toRegionC?.total || 0);

      const statsData: any[] = [
        ["पत्राचार - हिंदी / कुल (Correspondence)", `${aggregatedHindi} / ${aggregatedTotal} (${report.correspondence?.overallPercentage || 0}%)`],
        ["धारा 3(3) द्विभाषी (Section 3(3))", `${report.section33?.bilingual || 0} / ${report.section33?.total || 0}`],
        ["टिप्पण लेखन पृष्ठ (Noting - Hindi Pages)", report.noting?.hindiPages || 0],
        ["आयोजित कार्यशालाएं (Workshops Conducted)", report.workshops?.count || 0],
        ["रा.भा.का.स. बैठक आयोजित? (OLIC Meeting)", report.meetings?.olicHeld ? 'हां (Yes)' : 'नहीं (No)']
      ];

      // Append Part 2 Metrics to the PDF if applicable
      if (report.quarter === Quarter.Q4 && report.part2) {
        statsData.push(
          ["कुल कर्मचारी (Total Staff - Part 2)", report.part2.staff?.total || 0],
          ["प्रवीणता प्राप्त कर्मचारी (Proficient Staff)", report.part2.staff?.proficient || 0],
          ["यूनिकोड इनेबल्ड कंप्यूटर (Unicode Computers)", `${report.part2.computers?.unicodeEnabled || 0} / ${report.part2.computers?.total || 0}`],
          ["हिंदी पुस्तक व्यय (Hindi Book Exp. %)", (report.part2.library?.totalExpenditure || 0) > 0 ? (((report.part2.library?.hindiExpenditure || 0) / (report.part2.library?.totalExpenditure || 1)) * 100).toFixed(2) + '%' : '0%']
        );
      }

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['प्रदर्शन सूचक (Performance Parameter)', 'आंकड़े (Stat)']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11], font: 'NotoSans' },
        styles: { font: 'NotoSans' } // Apply Hindi font to all cells
      });

      doc.save(`Report_${report.acknowledgementId || 'Unknown'}_${report.sectionName || 'Section'}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF:", e);
      alert("पीडीएफ डाउनलोड करने में त्रुटि आई। (Error downloading PDF)");
    } finally {
      setPdfLoading(null);
    }
  };

  const handleOpenEmailModal = (report: Report) => {
    setEmailModal({ isOpen: true, report });
    setRecipientEmail('');
    setSendSuccess(false);
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !emailModal.report) return;
    
    setIsSending(true);
    try {
      // AI drafts the text
      const emailContent = await geminiService.draftSubmissionEmail(emailModal.report);
      
      // We actually use the AI's content to trigger the user's native email client
      const subject = encodeURIComponent(`राजभाषा रिपोर्ट (Rajbhasha Report) - ${emailModal.report.sectionName || ''} (${emailModal.report.quarter || ''} ${emailModal.report.year || ''})`);
      const body = encodeURIComponent(emailContent);
      
      // Trigger mailto protocol
      window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
      
      // Add a small delay for UI smoothness
      await new Promise(resolve => setTimeout(resolve, 800));
      setSendSuccess(true);
      
      setTimeout(() => {
        setEmailModal({ isOpen: false, report: null });
      }, 2000);
      
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("ईमेल तैयार करने में त्रुटि आई। (Email generation failed)");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status?: ReportStatus, remarks?: string) => {
    const s = status || 'APPROVED';
    switch(s) {
      case 'DRAFT': return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200 flex items-center gap-1.5 w-max"><FileBarChart size={12}/> ड्राफ्ट</span>;
      case 'PENDING_SAO': return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200 flex items-center gap-1.5 w-max"><Clock size={12}/> SAO अनुमोदन लंबित</span>;
      case 'APPROVED': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold border border-green-200 flex items-center gap-1.5 w-max"><CheckCircle size={12}/> स्वीकृत</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200 cursor-help flex items-center gap-1.5 w-max" title={`कारण: ${remarks}`}><XCircle size={12}/> अस्वीकृत (टिप्पणी देखें)</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">जमा की गई रिपोर्टें</h2>
          <p className="text-sm text-gray-500">सभी पिछली तिमाहियों का रिकॉर्ड</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {reports.length > 0 && (
            <>
              <button 
                onClick={downloadExcel}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-green-700 transition font-semibold text-sm"
              >
                <FileSpreadsheet size={18} /> Excel निर्यात
              </button>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <Filter size={18} className="text-indigo-600" />
                <div className="flex items-center gap-2">
                  <label htmlFor="yearFilter" className="text-sm font-semibold text-gray-600 whitespace-nowrap">फिल्टर:</label>
                  <select 
                    id="yearFilter"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold text-indigo-700 cursor-pointer outline-none min-w-[140px]"
                  >
                    <option value="all">सभी वर्ष (All Years)</option>
                    {uniqueYears.map(year => (
                      <option key={year} value={year}>{year} की रिपोर्टें</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">अनुभाग/अवधि</th>
                <th className="px-6 py-4">स्थिति</th>
                <th className="px-6 py-4">हिंदी पत्राचार (%)</th>
                <th className="px-6 py-4">धारा 3(3)</th>
                <th className="px-6 py-4 text-right">कार्य</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center text-gray-400 bg-white">
                    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700">
                      <div className="p-6 bg-gray-50 rounded-full">
                        <FileText size={48} className="opacity-20" />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <p className="text-xl font-bold text-gray-800">डेटा नहीं मिला</p>
                        <p className="text-sm mt-1">
                          {reports.length === 0 
                            ? 'अभी तक कोई रिपोर्ट जमा नहीं की गई है।' 
                            : `वर्ष ${filterYear} के लिए कोई रिपोर्ट उपलब्ध नहीं है।`}
                        </p>
                        {filterYear !== 'all' && (
                          <button 
                            onClick={() => setFilterYear('all')}
                            className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
                          >
                            सभी वर्ष देखें
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 truncate max-w-[200px]">{report.sectionName}</div>
                          <div className="text-xs text-gray-500">{report.quarter} {report.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(report.status, report.saoRemarks)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(report.correspondence?.overallPercentage || 0) >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {report.correspondence?.overallPercentage || 0}%
                        </span>
                        <div className="w-16 bg-gray-100 h-1.5 rounded-full hidden sm:block">
                          <div 
                            className={`h-full rounded-full ${(report.correspondence?.overallPercentage || 0) >= 70 ? 'bg-green-500' : 'bg-orange-500'}`} 
                            style={{width: `${Math.min(report.correspondence?.overallPercentage || 0, 100)}%`}}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                      {report.section33?.bilingual || 0} / {report.section33?.total || 0}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      {/* SAO Quick Actions */}
                      {(currentUser.role === 'SAO' || currentUser.role === 'MASTER') && report.status === 'PENDING_SAO' && (
                        <>
                          <button onClick={() => onUpdateStatus(report.id, 'APPROVED')} className="p-2 text-green-600 hover:bg-green-50 hover:shadow-sm border border-transparent hover:border-green-200 rounded-lg transition" title="Approve">
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => {
                            const remark = window.prompt("अस्वीकृत करने का कारण दर्ज करें:");
                            if(remark !== null && remark.trim() !== "") {
                              onUpdateStatus(report.id, 'REJECTED', remark);
                            } else if(remark !== null) {
                              alert("कारण दर्ज करना अनिवार्य है।");
                            }
                          }} className="p-2 text-red-600 hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-200 rounded-lg transition" title="Reject">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      
                      <button onClick={() => onEdit(report)} className="p-2 text-amber-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-amber-100 rounded-lg transition" title={currentUser.role === 'SAO' ? "विवरण देखें" : "संपादित करें"}>
                        <Edit3 size={18} />
                      </button>
                      
                      <button onClick={() => handleOpenEmailModal(report)} className="p-2 text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-100 rounded-lg transition" title="ईमेल">
                        <Mail size={18} />
                      </button>
                      <button onClick={() => downloadPDF(report)} disabled={pdfLoading === report.id} className="p-2 text-indigo-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-indigo-100 rounded-lg transition disabled:opacity-50" title="PDF">
                        {pdfLoading === report.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      </button>
                      
                      {(currentUser.role === 'MASTER' || (currentUser.role === 'SECTION' && (report.status === 'DRAFT' || report.status === 'REJECTED'))) && (
                        <button onClick={() => onDelete(report.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-red-100 rounded-lg transition" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Modal */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Mail size={18} /> रिपोर्ट ईमेल करें
              </h3>
              <button onClick={() => setEmailModal({ isOpen: false, report: null })} className="hover:bg-indigo-500 p-1 rounded transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {sendSuccess ? (
                <div className="py-8 text-center space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">सफलतापूर्वक तैयार!</h4>
                  <p className="text-sm text-gray-500">आपका ईमेल क्लाइंट खुल रहा है।</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      अनुभाग: <strong>{emailModal.report?.sectionName}</strong> की <strong>{emailModal.report?.quarter} {emailModal.report?.year}</strong> रिपोर्ट का ड्राफ्ट तैयार किया जाएगा।
                    </p>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">प्राप्तकर्ता की ईमेल आईडी (Email ID)</label>
                    <input 
                      type="email" 
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="example@domain.gov.in"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setEmailModal({ isOpen: false, report: null })}
                      className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition"
                    >
                      रद्द करें
                    </button>
                    <button 
                      onClick={handleSendEmail}
                      disabled={isSending || !recipientEmail}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      {geminiService.isAvailable() ? 'एआई ड्राफ्ट (AI Draft)' : 'ड्राफ्ट करें (Offline)'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportList;