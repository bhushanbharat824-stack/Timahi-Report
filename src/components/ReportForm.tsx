import React, { useState, useEffect } from 'react';
import { Quarter, Region, Report, User, ReportStatus, ReportPart2 } from '../types';
import { 
  Save, RefreshCcw, Languages, Bell, FileText, AlertTriangle, 
  MessageSquare, BookOpen, Users, Calendar, Award, PenTool, CheckCircle, XCircle, Clock, Search, Monitor, Library, Target
} from 'lucide-react';

interface ReportFormProps {
  onSave: (report: Report) => void;
  initialData: Report | null;
  currentUser: User;
  allReports: Report[];
}

const InputField = ({ label, value, onChange, max, readOnly = false }: { label: string, value: number | string, onChange?: (v: number) => void, max?: number, readOnly?: boolean }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !onChange) return;
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    if (max !== undefined && val > max) val = max;
    onChange(val);
  };
  return (
    <div className="flex flex-col w-full">
      {label && <label className="text-xs font-bold text-gray-600 mb-1.5">{label}</label>}
      <input 
        type={typeof value === 'number' ? 'number' : 'text'} min="0" max={max}
        value={value === 0 && !readOnly ? '' : value} 
        onChange={handleChange} 
        placeholder="0"
        readOnly={readOnly}
        className={`w-full border p-3 rounded-xl text-center font-bold outline-none transition ${readOnly ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white'}`}
      />
    </div>
  );
};

const SectionCard = ({ title, icon, children, warning }: { title: string, icon: React.ReactNode, children?: React.ReactNode, warning?: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">{icon}</div>
      <h2 className="text-lg md:text-xl font-bold text-gray-800">{title}</h2>
    </div>
    {warning && (
      <div className="mb-6 p-3 bg-amber-50 text-amber-800 text-sm font-semibold rounded-xl flex items-center gap-2 border border-amber-200">
        <AlertTriangle size={18} className="shrink-0" /> {warning}
      </div>
    )}
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const ReportForm: React.FC<ReportFormProps> = ({ onSave, initialData, currentUser }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    quarter: Quarter.Q1,
    region: Region.A,

    status: 'DRAFT' as ReportStatus,
    saoRemarks: '',

    // Pt 3: Section 3(3)
    s33_total: 0, s33_bilingual: 0, s33_english: 0, s33_hindi: 0,
    
    // Pt 4: Rule 5
    r5_received: 0, r5_noreply: 0, r5_replied_hindi: 0, r5_replied_english: 0,
    
    // Pt 5: Rule 5 English Letters
    r5engA_received: 0, r5engA_hindi: 0, r5engA_eng: 0, r5engA_noreply: 0,
    r5engB_received: 0, r5engB_hindi: 0, r5engB_eng: 0, r5engB_noreply: 0,

    // Pt 6: Correspondence
    corrA_hindi: 0, corrA_eng: 0,
    corrB_hindi: 0, corrB_eng: 0,
    corrC_hindi: 0, corrC_eng: 0,
    
    // Pt 7: Noting
    noting_hindi: 0, noting_eng: 0, noting_total: 0, noting_eoffice: 0,
    
    // Pt 8: Workshops
    ws_count: 0, ws_officers: 0, ws_staff: 0,
    
    // Pt 9: OLIC Meetings
    olic_date: '', sub_olic_count: 0, sub_olic_held: 0, sub_olic_hindi: false,
    
    // Pt 11: Achievements
    achievements: '',

    // --- PART 2 (ANNUAL - MARCH END) FIELDS ---
    p2_staff_total: 0, p2_staff_working: 0, p2_staff_proficient: 0,
    p2_type_total: 0, p2_type_trained: 0,
    p2_steno_total: 0, p2_steno_trained: 0,
    p2_comp_total: 0, p2_comp_unicode: 0,
    p2_website_bilingual: true,
    p2_lib_total_exp: 0, p2_lib_hindi_exp: 0,
    p2_pub_total: 0, p2_pub_hindi: 0, p2_pub_bilingual: 0,
    p2_insp_target: 0, p2_insp_completed: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        year: initialData.year,
        quarter: initialData.quarter,
        region: initialData.region,
        status: initialData.status || 'APPROVED', // Treat old data natively as Approved
        saoRemarks: initialData.saoRemarks || '',
        s33_total: initialData.section33.total,
        s33_bilingual: initialData.section33.bilingual,
        s33_english: initialData.section33.englishOnly,
        s33_hindi: initialData.section33.hindiOnly,
        r5_received: initialData.rule5.totalHindiReceived,
        r5_noreply: initialData.rule5.noReplyNeeded,
        r5_replied_hindi: initialData.rule5.repliedHindi,
        r5_replied_english: initialData.rule5.repliedEnglish,
        r5engA_received: initialData.rule5EnglishLetters.regionA.received,
        r5engA_hindi: initialData.rule5EnglishLetters.regionA.repliedHindi,
        r5engA_eng: initialData.rule5EnglishLetters.regionA.repliedEnglish,
        r5engA_noreply: initialData.rule5EnglishLetters.regionA.noReplyNeeded,
        r5engB_received: initialData.rule5EnglishLetters.regionB.received,
        r5engB_hindi: initialData.rule5EnglishLetters.regionB.repliedHindi,
        r5engB_eng: initialData.rule5EnglishLetters.regionB.repliedEnglish,
        r5engB_noreply: initialData.rule5EnglishLetters.regionB.noReplyNeeded,
        corrA_hindi: initialData.correspondence.toRegionA.hindi,
        corrA_eng: initialData.correspondence.toRegionA.english,
        corrB_hindi: initialData.correspondence.toRegionB.hindi,
        corrB_eng: initialData.correspondence.toRegionB.english,
        corrC_hindi: initialData.correspondence.toRegionC.hindi,
        corrC_eng: initialData.correspondence.toRegionC.english,
        noting_hindi: initialData.noting.hindiPages,
        noting_eng: initialData.noting.englishPages,
        noting_total: initialData.noting.totalNotes,
        noting_eoffice: initialData.noting.eOfficeHindi,
        ws_count: initialData.workshops.count,
        ws_officers: initialData.workshops.officersTrained,
        ws_staff: initialData.workshops.staffTrained,
        olic_date: initialData.meetings.olicDate || '',
        sub_olic_count: initialData.meetings.subordinateOlicCount || 0,
        sub_olic_held: initialData.meetings.subordinateOlicHeldCount || 0,
        sub_olic_hindi: initialData.meetings.subordinateOlicHindiMinutes || false,
        achievements: initialData.achievements || '',
        
        // Part 2 initialization (with fallbacks for older Q4 reports that might not have part2 structure)
        p2_staff_total: initialData.part2?.staff?.total || 0,
        p2_staff_working: initialData.part2?.staff?.workingKnowledge || 0,
        p2_staff_proficient: initialData.part2?.staff?.proficient || 0,
        p2_type_total: initialData.part2?.typing?.total || 0,
        p2_type_trained: initialData.part2?.typing?.trained || 0,
        p2_steno_total: initialData.part2?.stenography?.total || 0,
        p2_steno_trained: initialData.part2?.stenography?.trained || 0,
        p2_comp_total: initialData.part2?.computers?.total || 0,
        p2_comp_unicode: initialData.part2?.computers?.unicodeEnabled || 0,
        p2_website_bilingual: initialData.part2?.website?.isBilingual !== false,
        p2_lib_total_exp: initialData.part2?.library?.totalExpenditure || 0,
        p2_lib_hindi_exp: initialData.part2?.library?.hindiExpenditure || 0,
        p2_pub_total: initialData.part2?.publications?.total || 0,
        p2_pub_hindi: initialData.part2?.publications?.hindi || 0,
        p2_pub_bilingual: initialData.part2?.publications?.bilingual || 0,
        p2_insp_target: initialData.part2?.inspections?.target || 0,
        p2_insp_completed: initialData.part2?.inspections?.completed || 0
      });
    }
  }, [initialData]);

  // Real-time calculations for Correspondence Targets
  const corrATotal = formData.corrA_hindi + formData.corrA_eng;
  const corrBTotal = formData.corrB_hindi + formData.corrB_eng;
  const corrCTotal = formData.corrC_hindi + formData.corrC_eng;
  const totalHindi = formData.corrA_hindi + formData.corrB_hindi + formData.corrC_hindi;
  const totalLetters = corrATotal + corrBTotal + corrCTotal;
  const currentPercentage = totalLetters > 0 ? parseFloat(((totalHindi / totalLetters) * 100).toFixed(2)) : 0;

  // Determine required target based on Official Language rules
  let targetPercentage = 0;
  if (formData.region === Region.A) targetPercentage = 100;
  else if (formData.region === Region.B) targetPercentage = 90;
  else if (formData.region === Region.C) targetPercentage = 55;

  const isTargetMissed = totalLetters > 0 && currentPercentage < targetPercentage;

  const handleSubmit = (e: React.FormEvent, newStatus: ReportStatus, remarks: string = formData.saoRemarks) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const overallPercentage = currentPercentage;

    let part2Data: ReportPart2 | undefined = undefined;
    if (formData.quarter === Quarter.Q4) {
      part2Data = {
        staff: { total: formData.p2_staff_total, workingKnowledge: formData.p2_staff_working, proficient: formData.p2_staff_proficient },
        typing: { total: formData.p2_type_total, trained: formData.p2_type_trained },
        stenography: { total: formData.p2_steno_total, trained: formData.p2_steno_trained },
        computers: { total: formData.p2_comp_total, unicodeEnabled: formData.p2_comp_unicode },
        website: { isBilingual: formData.p2_website_bilingual },
        library: { totalExpenditure: formData.p2_lib_total_exp, hindiExpenditure: formData.p2_lib_hindi_exp },
        publications: { total: formData.p2_pub_total, hindi: formData.p2_pub_hindi, bilingual: formData.p2_pub_bilingual },
        inspections: { target: formData.p2_insp_target, completed: formData.p2_insp_completed }
      };
    }

    const report: Report = {
      id: initialData?.id || crypto.randomUUID(),
      year: formData.year,
      quarter: formData.quarter,
      region: formData.region,
      status: newStatus,
      saoRemarks: remarks,
      sectionId: initialData?.sectionId || currentUser.id,
      sectionName: initialData?.sectionName || currentUser.sectionName || 'Admin',
      officeInfo: { name: 'कार्यालय/अनुभाग', address: '', officerName: '', phone: '', email: '' },
      ministerFiles: { total: 0, hindi: 0 },
      meetings: { 
        secretaryLevel: { meetingsCount: 0, minutesHindiCount: 0, docsIssuedTotal: 0, docsIssuedHindi: 0 }, 
        olicHeld: !!formData.olic_date, 
        olicDate: formData.olic_date, 
        subordinateOlicCount: formData.sub_olic_count,
        subordinateOlicHeldCount: formData.sub_olic_held,
        subordinateOlicHindiMinutes: formData.sub_olic_hindi,
        advisoryHeld: false 
      },
      section33: { 
        total: formData.s33_total, 
        bilingual: formData.s33_bilingual, 
        englishOnly: formData.s33_english, 
        hindiOnly: formData.s33_hindi 
      },
      rule5: { 
        totalHindiReceived: formData.r5_received, 
        repliedHindi: formData.r5_replied_hindi, 
        repliedEnglish: formData.r5_replied_english, 
        noReplyNeeded: formData.r5_noreply 
      },
      rule5EnglishLetters: { 
        regionA: { received: formData.r5engA_received, repliedHindi: formData.r5engA_hindi, repliedEnglish: formData.r5engA_eng, noReplyNeeded: formData.r5engA_noreply }, 
        regionB: { received: formData.r5engB_received, repliedHindi: formData.r5engB_hindi, repliedEnglish: formData.r5engB_eng, noReplyNeeded: formData.r5engB_noreply } 
      },
      correspondence: {
        toRegionA: { hindi: formData.corrA_hindi, english: formData.corrA_eng, total: corrATotal, percentage: corrATotal > 0 ? (formData.corrA_hindi/corrATotal)*100 : 0 },
        toRegionB: { hindi: formData.corrB_hindi, english: formData.corrB_eng, total: corrBTotal, percentage: corrBTotal > 0 ? (formData.corrB_hindi/corrBTotal)*100 : 0 },
        toRegionC: { hindi: formData.corrC_hindi, english: formData.corrC_eng, total: corrCTotal, percentage: corrCTotal > 0 ? (formData.corrC_hindi/corrCTotal)*100 : 0 },
        overallPercentage
      },
      noting: { 
        hindiPages: formData.noting_hindi, 
        englishPages: formData.noting_eng, 
        totalNotes: formData.noting_total, 
        eOfficeHindi: formData.noting_eoffice 
      },
      workshops: { 
        count: formData.ws_count, 
        officersTrained: formData.ws_officers, 
        staffTrained: formData.ws_staff 
      },
      achievements: formData.achievements,
      part2: part2Data,
      timestamp: initialData?.timestamp || new Date().toISOString(),
      acknowledgementId: initialData?.acknowledgementId || `RAJ-${Date.now().toString().slice(-6)}`,
      submittedBy: initialData?.submittedBy || currentUser.name,
      declarationSigned: true
    };

    setTimeout(() => {
      onSave(report);
      setIsSubmitting(false);
    }, 800);
  };

  // Determine if this is the Master's consolidated report.
  const isConsolidated = (initialData?.sectionName || currentUser.sectionName) === 'मास्टर एडमिन';
  const isQ4 = formData.quarter === Quarter.Q4;
  
  // Validation Check: Detects any English alphabetic characters in Achievements (Only applies if consolidated)
  const isAchievementsInvalid = isConsolidated ? /[a-zA-Z]/.test(formData.achievements) : false;

  const currentStatus = formData.status;
  const isSection = currentUser.role === 'SECTION';
  const isApprover = currentUser.role === 'SAO' || currentUser.role === 'MASTER';
  const isReadOnly = isSection && (currentStatus === 'PENDING_SAO' || currentStatus === 'APPROVED');

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="bg-indigo-900 text-white p-6 rounded-t-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Languages size={36} className="text-orange-400" />
          <div>
            <h1 className="text-2xl font-black">संशोधित प्रारूप 2025 (भाग-1 {isQ4 && '& भाग-2'})</h1>
            <p className="text-indigo-200 text-sm font-medium">
              {isConsolidated 
                ? 'समेकित प्रगति रिपोर्ट (Consolidated Report)' 
                : `तिमाही प्रगति रिपोर्ट - अनुभाग: ${initialData?.sectionName || currentUser.sectionName}`}
            </p>
          </div>
        </div>
        {currentStatus === 'PENDING_SAO' && <div className="bg-amber-500/20 border border-amber-400/50 text-amber-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"><Clock size={16}/> SAO अनुमोदन हेतु लंबित</div>}
        {currentStatus === 'APPROVED' && <div className="bg-green-500/20 border border-green-400/50 text-green-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"><CheckCircle size={16}/> स्वीकृत</div>}
        {currentStatus === 'REJECTED' && <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"><XCircle size={16}/> अस्वीकृत</div>}
      </div>

      <form className="bg-gray-50 p-4 md:p-8 rounded-b-3xl shadow-xl border border-gray-200 space-y-8">
        
        {currentStatus === 'REJECTED' && formData.saoRemarks && (
           <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-6 flex items-start gap-3">
             <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
             <div>
                <h3 className="text-red-800 font-bold text-sm">SAO द्वारा अस्वीकृत (टिप्पणी)</h3>
                <p className="text-red-700 text-sm mt-1">{formData.saoRemarks}</p>
             </div>
           </div>
        )}

        <fieldset disabled={isReadOnly} className={`space-y-8 ${isReadOnly ? 'opacity-90' : ''}`}>
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-gray-200">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">रिपोर्टिंग वर्ष</label>
              <select 
                value={formData.year} 
                onChange={e => setFormData({...formData, year: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
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
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">तिमाही</label>
              <select 
                value={formData.quarter} 
                onChange={e => setFormData({...formData, quarter: e.target.value as Quarter})}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
              >
                {Object.values(Quarter).map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">कार्यालय का क्षेत्र (Region)</label>
              <select 
                value={formData.region} 
                onChange={e => setFormData({...formData, region: e.target.value as Region})}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
              >
                {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Point 3 */}
          <SectionCard title="3. राजभाषा अधिनियम, 1963 की धारा 3(3) के अंतर्गत जारी दस्तावेज" icon={<FileText />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="(क) जारी दस्तावेज की कुल संख्या" value={formData.s33_total} onChange={v => setFormData({...formData, s33_total: v})} />
              <InputField label="(ख) द्विभाषी रूप में जारी किए गए दस्तावेज की संख्या" value={formData.s33_bilingual} onChange={v => setFormData({...formData, s33_bilingual: v})} />
              <InputField label="(ग) केवल अंग्रेजी में जारी किए गए दस्तावेज" value={formData.s33_english} onChange={v => setFormData({...formData, s33_english: v})} />
              <InputField label="(घ) केवल हिंदी में जारी किए गए दस्तावेज" value={formData.s33_hindi} onChange={v => setFormData({...formData, s33_hindi: v})} />
            </div>
          </SectionCard>

          {/* Point 4 */}
          <SectionCard title="4. हिंदी में प्राप्त पत्र (राजभाषा नियम-5)" icon={<MessageSquare />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="(क) हिंदी में प्राप्त पत्रों की कुल संख्या" value={formData.r5_received} onChange={v => setFormData({...formData, r5_received: v})} />
              <InputField label="(ख) इनमें से कितनों के उत्तर दिए जाने अपेक्षित नहीं थे" value={formData.r5_noreply} onChange={v => setFormData({...formData, r5_noreply: v})} />
              <InputField label="(ग) इनमें से कितनों के उत्तर हिंदी/द्विभाषी में दिए गए" value={formData.r5_replied_hindi} onChange={v => setFormData({...formData, r5_replied_hindi: v})} />
              <InputField label="(घ) इनमें से कितनों के उत्तर अंग्रेजी में दिए गए" value={formData.r5_replied_english} onChange={v => setFormData({...formData, r5_replied_english: v})} />
            </div>
          </SectionCard>

          {/* Point 5 */}
          <SectionCard title="5. अंग्रेजी में प्राप्त पत्रों के उत्तर हिंदी में दिए जाने की स्थिति (केवल 'क' एवं 'ख' क्षेत्र में स्थित कार्यालयों के लिए)" icon={<Languages />}>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 text-center font-bold">
                  <tr>
                    <th className="px-4 py-3 border-r border-gray-200">क्षेत्र</th>
                    <th className="px-4 py-3 border-r border-gray-200">अंग्रेजी में प्राप्त पत्रों की संख्या (1)</th>
                    <th className="px-4 py-3 border-r border-gray-200">इनमें से कितनों के उत्तर हिंदी में दिए गए (2)</th>
                    <th className="px-4 py-3 border-r border-gray-200">इनमें से कितनों के उत्तर अंग्रेजी में दिए गए (3)</th>
                    <th className="px-4 py-3">इनमें से कितनों के उत्तर अपेक्षित नहीं थे (4)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 font-bold text-center border-r border-gray-200 bg-gray-50">'क' क्षेत्र</td>
                    <td className="p-2 border-r border-gray-200"><InputField label="" value={formData.r5engA_received} onChange={v => setFormData({...formData, r5engA_received: v})} /></td>
                    <td className="p-2 border-r border-gray-200"><InputField label="" value={formData.r5engA_hindi} onChange={v => setFormData({...formData, r5engA_hindi: v})} /></td>
                    <td className="p-2 border-r border-gray-200"><InputField label="" value={formData.r5engA_eng} onChange={v => setFormData({...formData, r5engA_eng: v})} /></td>
                    <td className="p-2"><InputField label="" value={formData.r5engA_noreply} onChange={v => setFormData({...formData, r5engA_noreply: v})} /></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-center border-r border-gray-200 bg-gray-50">'ख' क्षेत्र</td>
                    <td className="p-2 border-r border-gray-200"><InputField label="" value={formData.r5engB_received} onChange={v => setFormData({...formData, r5engB_received: v})} /></td>
                    <td className="p-2 border-r border-gray-200"><InputField label="" value={formData.r5engB_hindi} onChange={v => setFormData({...formData, r5engB_hindi: v})} /></td>
                    <td className="p-2 border-r border-gray-200"><InputField label="" value={formData.r5engB_eng} onChange={v => setFormData({...formData, r5engB_eng: v})} /></td>
                    <td className="p-2"><InputField label="" value={formData.r5engB_noreply} onChange={v => setFormData({...formData, r5engB_noreply: v})} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Point 6 */}
          <SectionCard title="6. मूल रूप से भेजे गये पत्रों/पत्राचार का ब्यौरा" icon={<Languages />}>
            
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-3 text-sm font-semibold bg-indigo-50 text-indigo-800 p-3.5 rounded-xl border border-indigo-100">
                 <div className="p-2 bg-indigo-200 text-indigo-700 rounded-lg shrink-0">
                    <Target size={20} />
                 </div>
                 <span>राजभाषा विभाग के दिशा-निर्देशों के अनुसार आपके <strong>'{formData.region}'</strong> के लिए समग्र हिंदी पत्राचार का न्यूनतम लक्ष्य <strong>{targetPercentage}%</strong> निर्धारित है।</span>
              </div>
              
              {isTargetMissed && (
                <div className="flex items-start gap-3 text-sm font-bold bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-200 animate-in fade-in duration-300">
                   <div className="p-2 bg-red-200 text-red-700 rounded-lg shrink-0">
                     <AlertTriangle size={20} />
                   </div>
                   <div className="pt-0.5">
                     चेतावनी: आपका वर्तमान हिंदी पत्राचार ({currentPercentage}%) निर्धारित लक्ष्य ({targetPercentage}%) से कम है। कृपया राजभाषा नियमों के अनुपालन हेतु हिंदी पत्राचार बढ़ाएं।
                   </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 text-center font-bold">
                  <tr>
                    <th className="px-4 py-3 border-r border-gray-200">क्षेत्र</th>
                    <th className="px-4 py-3 border-r border-gray-200">हिंदी में (1)</th>
                    <th className="px-4 py-3 border-r border-gray-200">अंग्रेजी में (2)</th>
                    <th className="px-4 py-3 border-r border-gray-200">भेजे गए पत्रों की कुल संख्या (3)</th>
                    <th className="px-4 py-3">हिंदी में भेजे गए पत्रों का प्रतिशत (4)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { label: "'क' क्षेत्र को", h: formData.corrA_hindi, e: formData.corrA_eng, setH: (v: number) => setFormData({...formData, corrA_hindi: v}), setE: (v: number) => setFormData({...formData, corrA_eng: v}) },
                    { label: "'ख' क्षेत्र को", h: formData.corrB_hindi, e: formData.corrB_eng, setH: (v: number) => setFormData({...formData, corrB_hindi: v}), setE: (v: number) => setFormData({...formData, corrB_eng: v}) },
                    { label: "'ग' क्षेत्र को", h: formData.corrC_hindi, e: formData.corrC_eng, setH: (v: number) => setFormData({...formData, corrC_hindi: v}), setE: (v: number) => setFormData({...formData, corrC_eng: v}) }
                  ].map((row, i) => {
                    const total = row.h + row.e;
                    const perc = total > 0 ? ((row.h / total) * 100).toFixed(2) : "0.00";
                    return (
                      <tr key={i}>
                        <td className="px-4 py-3 font-bold text-center border-r border-gray-200 bg-gray-50">{row.label}</td>
                        <td className="p-2 border-r border-gray-200"><InputField label="" value={row.h} onChange={row.setH} /></td>
                        <td className="p-2 border-r border-gray-200"><InputField label="" value={row.e} onChange={row.setE} /></td>
                        <td className="p-2 border-r border-gray-200"><InputField label="" value={total} readOnly /></td>
                        <td className="p-2"><InputField label="" value={`${perc}%`} readOnly /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Point 7 */}
          <SectionCard title="7. फाइलों/आवतियों/ई-ऑफिस पर टिप्पण लेखन का ब्यौरा" icon={<PenTool />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="हिंदी में लिखी गई टिप्पणियों के पृष्ठों की संख्या" value={formData.noting_hindi} onChange={v => setFormData({...formData, noting_hindi: v})} />
              <InputField label="अंग्रेजी में लिखी गई टिप्पणियों के पृष्ठों की संख्या" value={formData.noting_eng} onChange={v => setFormData({...formData, noting_eng: v})} />
              <InputField label="टिप्पणियों के पृष्ठों की कुल संख्या" value={formData.noting_total} onChange={v => setFormData({...formData, noting_total: v})} />
              <InputField label="ई-ऑफिस के माध्यम से भेजी गई टिप्पणियों की संख्या" value={formData.noting_eoffice} onChange={v => setFormData({...formData, noting_eoffice: v})} />
            </div>
          </SectionCard>

          {/* Conditionally Render Points 8, 9, 11 ONLY for the Consolidated Master Report */}
          {isConsolidated && (
            <>
              {/* Point 8 */}
              <SectionCard title="8. हिंदी कार्यशालाएं" icon={<BookOpen />}>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 text-center font-bold">
                      <tr>
                        <th className="px-4 py-3 border-r border-gray-200" rowSpan={2}>तिमाही के दौरान आयोजित पूर्ण दिवसीय कार्यशालाओं की संख्या (1)</th>
                        <th className="px-4 py-2 border-b border-gray-200" colSpan={2}>इनमें प्रशिक्षित कार्मिकों की कुल संख्या</th>
                      </tr>
                      <tr>
                        <th className="px-4 py-2 border-r border-gray-200">अधिकारी (2)</th>
                        <th className="px-4 py-2">कर्मचारी (3)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border-r border-gray-200"><InputField label="" value={formData.ws_count} onChange={v => setFormData({...formData, ws_count: v})} /></td>
                        <td className="p-2 border-r border-gray-200"><InputField label="" value={formData.ws_officers} onChange={v => setFormData({...formData, ws_officers: v})} /></td>
                        <td className="p-2"><InputField label="" value={formData.ws_staff} onChange={v => setFormData({...formData, ws_staff: v})} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              {/* Point 9 */}
              <SectionCard title="9. राजभाषा कार्यान्वयन समिति की बैठक" icon={<Calendar />}>
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">क. राजभाषा कार्यान्वयन समिति की बैठक की तिथि</label>
                      <input 
                        type="date"
                        value={formData.olic_date}
                        onChange={e => setFormData({...formData, olic_date: e.target.value})}
                        className="bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold w-full md:w-1/2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                      />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="ख. अधीनस्थ कार्यालयों में गठित राजभाषा कार्यान्वयन समितियों की संख्या" value={formData.sub_olic_count} onChange={v => setFormData({...formData, sub_olic_count: v})} />
                      <InputField label="ग. अधीनस्थ कार्यालयों में तिमाही में आयोजित बैठकों की संख्या" value={formData.sub_olic_held} onChange={v => setFormData({...formData, sub_olic_held: v})} />
                   </div>
                   <div className="flex items-center gap-3 pt-2">
                      <span className="font-bold text-gray-700 text-sm">घ. क्या इन बैठकों से संबंधित कार्यसूची और कार्यवृत्त हिंदी में जारी किए गए हैं?</span>
                      <select 
                        value={formData.sub_olic_hindi ? 'हां' : 'नहीं'} 
                        onChange={e => setFormData({...formData, sub_olic_hindi: e.target.value === 'हां'})}
                        className="bg-gray-50 border border-gray-200 p-2 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="नहीं">नहीं (No)</option>
                        <option value="हां">हां (Yes)</option>
                      </select>
                   </div>
                </div>
              </SectionCard>

              {/* Point 11 */}
              <SectionCard title="11. तिमाही में किए गए उल्लेखनीय कार्य/उपलब्धियों का संक्षिप्त विवरण (अधिकतम 500 कैरेक्टर)" icon={<Award />}>
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-600 bg-gray-100 p-3 rounded-xl border border-gray-200">
                     <ul className="list-none space-y-1">
                       <li>i) नवोन्मेषी कार्य</li>
                       <li>ii) विशिष्ट आयोजन/ उल्लेखनीय कार्य</li>
                       <li>iii) हिंदी माध्यम में किये गए अन्य आयोजन</li>
                     </ul>
                  </div>
                  <div>
                    <textarea 
                      value={formData.achievements}
                      onChange={e => setFormData({...formData, achievements: e.target.value})}
                      maxLength={500}
                      placeholder="यहाँ विवरण दर्ज करें (केवल हिंदी में)..."
                      className={`w-full border p-4 rounded-xl focus:ring-2 outline-none transition resize-y min-h-[120px] text-gray-800 disabled:bg-gray-100 disabled:text-gray-500 ${isAchievementsInvalid ? 'border-red-400 focus:ring-red-500 bg-red-50' : 'bg-gray-50 border-gray-200 focus:ring-indigo-500'}`}
                    />
                    <div className="flex justify-between items-center mt-2">
                      {isAchievementsInvalid && !isReadOnly ? (
                        <div className="text-red-500 text-xs font-bold flex items-center gap-1">
                          <AlertTriangle size={14} /> कृपया जानकारी केवल हिंदी में दर्ज करें। अंग्रेजी अक्षरों का प्रयोग वर्जित है।
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 font-bold">{formData.achievements.length}/500</div>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ========================================== */}
          {/*          PART-2 (ANNUAL) FIELDS           */}
          {/* ========================================== */}
          {isQ4 && (
            <div className="mt-12 space-y-8 animate-in slide-in-from-bottom-8">
              <div className="bg-indigo-900 text-white p-5 rounded-3xl flex items-center gap-4 shadow-lg border border-indigo-700">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Award size={32} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black">भाग-2 (वार्षिक मूल्यांकन)</h2>
                  <p className="text-indigo-200 text-sm font-medium mt-1">मार्च तिमाही (Q4) के अंत में प्रस्तुत किए जाने वाले वार्षिक आंकड़े</p>
                </div>
              </div>

              {/* 12. Staff Knowledge */}
              <SectionCard title="12. हिंदी ज्ञान रखने वाले अधिकारियों/कर्मचारियों की स्थिति" icon={<Users />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField label="कुल अधिकारी/कर्मचारी" value={formData.p2_staff_total} onChange={v => setFormData({...formData, p2_staff_total: v})} />
                  <InputField label="कार्यसाधक ज्ञान प्राप्त" value={formData.p2_staff_working} onChange={v => setFormData({...formData, p2_staff_working: v})} />
                  <InputField label="प्रवीणता प्राप्त" value={formData.p2_staff_proficient} onChange={v => setFormData({...formData, p2_staff_proficient: v})} />
                </div>
              </SectionCard>

              {/* 13. Training */}
              <SectionCard title="13. हिंदी टंकण (Typing) और आशुलिपि (Stenography) प्रशिक्षण" icon={<PenTool />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 border-b pb-2">हिंदी टंकण (Typing)</h4>
                    <InputField label="कुल कर्मचारी (टंकण हेतु अपेक्षित)" value={formData.p2_type_total} onChange={v => setFormData({...formData, p2_type_total: v})} />
                    <InputField label="प्रशिक्षित कर्मचारियों की संख्या" value={formData.p2_type_trained} onChange={v => setFormData({...formData, p2_type_trained: v})} />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 border-b pb-2">हिंदी आशुलिपि (Stenography)</h4>
                    <InputField label="कुल कर्मचारी (आशुलिपि हेतु अपेक्षित)" value={formData.p2_steno_total} onChange={v => setFormData({...formData, p2_steno_total: v})} />
                    <InputField label="प्रशिक्षित कर्मचारियों की संख्या" value={formData.p2_steno_trained} onChange={v => setFormData({...formData, p2_steno_trained: v})} />
                  </div>
                </div>
              </SectionCard>

              {/* 14. Computers & Website */}
              <SectionCard title="14. कंप्यूटर एवं वेबसाइट" icon={<Monitor />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField label="कार्यालय में कुल कंप्यूटर" value={formData.p2_comp_total} onChange={v => setFormData({...formData, p2_comp_total: v})} />
                  <InputField label="द्विभाषी/यूनिकोड सुविधा वाले कंप्यूटर" value={formData.p2_comp_unicode} onChange={v => setFormData({...formData, p2_comp_unicode: v})} />
                  <div className="flex flex-col w-full">
                    <label className="text-xs font-bold text-gray-600 mb-1.5">क्या वेबसाइट पूरी तरह द्विभाषी है?</label>
                    <select 
                      value={formData.p2_website_bilingual ? 'हां' : 'नहीं'} 
                      onChange={e => setFormData({...formData, p2_website_bilingual: e.target.value === 'हां'})}
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="हां">हां (Yes)</option>
                      <option value="नहीं">नहीं (No)</option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              {/* 15. Library & Publications */}
              <SectionCard title="15. पुस्तकालय और पत्रिकाएं (Publications)" icon={<Library />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 border-b pb-2">पुस्तकालय व्यय (रुपये में)</h4>
                    <InputField label="पुस्तकों की खरीद पर कुल व्यय" value={formData.p2_lib_total_exp} onChange={v => setFormData({...formData, p2_lib_total_exp: v})} />
                    <InputField label="हिंदी पुस्तकों की खरीद पर व्यय" value={formData.p2_lib_hindi_exp} onChange={v => setFormData({...formData, p2_lib_hindi_exp: v})} />
                    {formData.p2_lib_total_exp > 0 && (
                      <div className="text-sm font-bold text-indigo-700 bg-indigo-50 p-2 rounded-lg text-center border border-indigo-100">
                        हिंदी पुस्तकों पर व्यय: {((formData.p2_lib_hindi_exp / formData.p2_lib_total_exp) * 100).toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 border-b pb-2">प्रकाशन (Publications)</h4>
                    <div className="grid grid-cols-2 gap-2">
                       <InputField label="कुल पत्रिकाएं" value={formData.p2_pub_total} onChange={v => setFormData({...formData, p2_pub_total: v})} />
                       <InputField label="केवल हिंदी में" value={formData.p2_pub_hindi} onChange={v => setFormData({...formData, p2_pub_hindi: v})} />
                       <div className="col-span-2">
                         <InputField label="द्विभाषी (Bilingual)" value={formData.p2_pub_bilingual} onChange={v => setFormData({...formData, p2_pub_bilingual: v})} />
                       </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* 16. Inspections */}
              <SectionCard title="16. राजभाषा निरीक्षण (Inspections)" icon={<Search />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="निरीक्षण का वार्षिक लक्ष्य (Target)" value={formData.p2_insp_target} onChange={v => setFormData({...formData, p2_insp_target: v})} />
                  <InputField label="किए गए निरीक्षणों की संख्या (Completed)" value={formData.p2_insp_completed} onChange={v => setFormData({...formData, p2_insp_completed: v})} />
                </div>
              </SectionCard>
            </div>
          )}
        </fieldset>

        {/* Action Buttons based on Role & Status */}
        <div className="pt-4 flex flex-col md:flex-row gap-4">
          {/* Section User creating/editing Drafts or correcting Rejected reports */}
          {isSection && (currentStatus === 'DRAFT' || currentStatus === 'REJECTED') && (
            <>
              <button 
                type="button" onClick={(e) => handleSubmit(e, 'DRAFT')} disabled={isSubmitting || isAchievementsInvalid} 
                className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 font-black py-4 rounded-2xl transition flex items-center justify-center gap-3 shadow-sm disabled:opacity-70 tracking-wide"
              >
                {isSubmitting ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />} 
                ड्राफ्ट सहेजें (Save Draft)
              </button>
              <button 
                type="button" onClick={(e) => handleSubmit(e, 'PENDING_SAO')} disabled={isSubmitting || isAchievementsInvalid} 
                className="flex-[2] bg-indigo-700 hover:bg-indigo-800 text-white font-black py-4 rounded-2xl transition flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 tracking-wide"
              >
                {isSubmitting ? <RefreshCcw className="animate-spin" size={20} /> : <CheckCircle size={20} />} 
                अंतिम सबमिशन (Submit to SAO)
              </button>
            </>
          )}

          {/* SAO or Master approving/rejecting a pending report */}
          {isApprover && currentStatus === 'PENDING_SAO' && (
            <>
              <button 
                type="button" onClick={(e) => handleSubmit(e, 'APPROVED')} disabled={isSubmitting} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl transition flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 tracking-wide"
              >
                {isSubmitting ? <RefreshCcw className="animate-spin" size={20} /> : <CheckCircle size={20} />} 
                स्वीकृत करें (Approve)
              </button>
              <button 
                type="button" onClick={(e) => {
                  const rem = window.prompt("अस्वीकृत करने का कारण (Reason for rejection):");
                  if (rem !== null && rem.trim() !== "") {
                    handleSubmit(e, 'REJECTED', rem);
                  } else if (rem !== null) {
                    alert("अस्वीकृत करने का कारण दर्ज करना अनिवार्य है।");
                  }
                }} disabled={isSubmitting} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 tracking-wide"
              >
                {isSubmitting ? <RefreshCcw className="animate-spin" size={20} /> : <XCircle size={20} />} 
                अस्वीकृत करें (Reject)
              </button>
            </>
          )}

          {/* SAO or Master just editing already approved/draft items (acting as Master Admin) */}
          {isApprover && currentStatus !== 'PENDING_SAO' && (
             <button 
               type="button" onClick={(e) => handleSubmit(e, currentStatus)} disabled={isSubmitting || isAchievementsInvalid} 
               className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black py-4 rounded-2xl transition flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 tracking-wide"
             >
               {isSubmitting ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />} 
               अपडेट करें (Update Record)
             </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default ReportForm;