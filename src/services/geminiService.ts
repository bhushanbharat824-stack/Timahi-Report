import { GoogleGenAI } from "@google/genai";
import { Report } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const geminiService = {
  isAvailable: () => !!ai,

  async draftSubmissionEmail(report: Report) {
    if (!ai) {
      return `Subject: राजभाषा रिपोर्ट (Rajbhasha Report) - ${report.sectionName || ''} (${report.quarter || ''} ${report.year || ''})

आदरणीय महोदय/महोदया,

कृपया ${report.sectionName || ''} अनुभाग की ${report.quarter || ''} ${report.year || ''} की राजभाषा तिमाही प्रगति रिपोर्ट संलग्न प्राप्त करें।

मुख्य विवरण:
- क्षेत्र: ${report.region || ''}
- हिंदी पत्राचार: ${report.correspondence?.overallPercentage || 0}%
- रा.भा.का.स. बैठक: ${report.meetings?.olicHeld ? 'हां' : 'नहीं'}

सादर,
${report.submittedBy || 'अनुभाग अधिकारी'}

---

Respected Sir/Madam,

Please find attached the Rajbhasha Quarterly Progress Report for ${report.sectionName || ''} for the period ${report.quarter || ''} ${report.year || ''}.

Key Details:
- Region: ${report.region || ''}
- Hindi Correspondence: ${report.correspondence?.overallPercentage || 0}%
- OLIC Meeting held: ${report.meetings?.olicHeld ? 'Yes' : 'No'}

Regards,
${report.submittedBy || 'Section Officer'}`;
    }

    const prompt = `Write a professional formal email in both Hindi and English for submitting the Rajbhasha (Official Language) Quarterly Report for ${report.quarter || ''} ${report.year || ''}.
    Stats: 
    - Region: ${report.region || ''}
    - Hindi Correspondence: ${report.correspondence?.overallPercentage || 0}%
    - Meetings held: ${report.meetings?.olicHeld ? 'Yes' : 'No'}
    Include a polite request to acknowledge receipt. Provide a clear Subject line.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "ईमेल ड्राफ्ट करने में विफल। (Failed to draft email.)";
  },

  async draftDeadlineReminder(deadlineMessage: string, deadlineDate: string, isAnnual: boolean) {
    if (!ai) {
      return `Subject: स्मरण पत्र: राजभाषा रिपोर्ट जमा करने की अंतिम तिथि - ${deadlineDate}

आदरणीय सहकर्मी,

यह आपको सूचित करने के लिए है कि ${isAnnual ? 'वार्षिक भाग-II रिपोर्ट' : 'तिमाही प्रगति रिपोर्ट'} जमा करने की अंतिम तिथि ${deadlineDate} है।

विवरण: ${deadlineMessage}

कृपया समय पर रिपोर्ट जमा करना सुनिश्चित करें।

सादर,
राजभाषा विभाग

---

Subject: Reminder: Deadline for Rajbhasha Report Submission - ${deadlineDate}

Dear Colleague,

This is to inform you that the deadline for submitting the ${isAnnual ? 'Annual Part-II Report' : 'Quarterly Progress Report'} is ${deadlineDate}.

Details: ${deadlineMessage}

Please ensure timely submission of the report.

Regards,
Rajbhasha Department`;
    }

    const prompt = `Write a professional reminder email for a Rajbhasha (Official Language) report deadline.
    Context: ${deadlineMessage}
    Deadline: ${deadlineDate}
    Type: ${isAnnual ? 'Annual Part-II Report' : 'Quarterly Progress Report'}
    Language: Professional Hindi with English translation.
    Tone: Urgent but polite. Remind the recipient that timely submission is a statutory requirement for Official Language implementation.
    Include a clear Subject line.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "रिमाइंडर ड्राफ्ट करने में विफल। (Failed to draft reminder.)";
  },

  async analyzeTrends(reports: Report[]) {
    if (reports.length === 0) return "विश्लेषण के लिए कोई डेटा उपलब्ध नहीं है। (No data available for analysis.)";
    
    if (!ai) {
      const latestReport = reports[reports.length - 1];
      return `**रणनीतिक अवलोकन (Strategic Overview)**:
डेटा के आधार पर, कार्यालय राजभाषा कार्यान्वयन की दिशा में निरंतर प्रयास कर रहा है।

**मुख्य सफलता के कारक (Key Success Factors)**:
- ${latestReport.sectionName} अनुभाग में हिंदी पत्राचार का स्तर ${latestReport.correspondence?.overallPercentage || 0}% है।
- धारा 3(3) का अनुपालन ${latestReport.section33?.bilingual || 0}/${latestReport.section33?.total || 0} दस्तावेजों के साथ जारी है।

**महत्वपूर्ण अनुपालन अंतराल (Critical Compliance Gaps)**:
- कुछ क्षेत्रों में निर्धारित लक्ष्यों (क्षेत्र क: 100%, ख: 90%, ग: 55%) को प्राप्त करने के लिए और प्रयासों की आवश्यकता है।

**सुधार हेतु मार्गचित्र (Roadmap for Improvement)**:
- हिंदी कार्यशालाओं की संख्या बढ़ाएं।
- कंप्यूटरों पर यूनिकोड का पूर्ण उपयोग सुनिश्चित करें।

*(नोट: यह एक स्वचालित सारांश है। विस्तृत एआई विश्लेषण के लिए एपीआई कुंजी आवश्यक है।)*`;
    }

    const dataSummary = reports.map(r => 
      `Quarter: ${r.quarter || '-'}, Year: ${r.year || '-'}, Region: ${r.region || '-'}, Hindi Correspondence: ${r.correspondence?.overallPercentage || 0}%, Section 3(3) Bilingual: ${r.section33?.bilingual || 0}/${r.section33?.total || 0}, Workshops: ${r.workshops?.count || 0}, Noting (Hindi Pages): ${r.noting?.hindiPages || 0}`
    ).join('\n');
    
    const prompt = `Act as an Official Language (Rajbhasha) Implementation Expert for the Government of India. 
    Analyze the following quarterly progress data and provide a high-level executive summary of trends and key insights:
    
    ${dataSummary}
    
    Guidelines for analysis:
    - Region A target is 100% Hindi correspondence.
    - Region B target is 90%.
    - Region C target is 55%.
    - Rule 5 requires 100% replies in Hindi to Hindi letters.
    - Section 3(3) documents must be 100% bilingual.
 
    Structure your response clearly:
    1. **Strategic Overview (रणनीतिक अवलोकन)**: Overall trend summary.
    2. **Key Success Factors (मुख्य सफलता के कारक)**: Where the office is doing well.
    3. **Critical Compliance Gaps (महत्वपूर्ण अनुपालन अंतराल)**: Where targets are missed.
    4. **Roadmap for Improvement (सुधार हेतु मार्गचित्र)**: Specific actionable advice.
 
    Provide the response in professional Hindi with brief English sub-headings or summaries for each section. Keep it encouraging but strictly focused on constitutional requirements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "विश्लेषण विफल रहा। (Analysis failed.)";
  }
};