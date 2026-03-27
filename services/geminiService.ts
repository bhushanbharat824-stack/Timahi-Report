import { GoogleGenAI } from "@google/genai";
import { Report } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async draftSubmissionEmail(report: Report) {
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
    return response.text;
  },

  async draftDeadlineReminder(deadlineMessage: string, deadlineDate: string, isAnnual: boolean) {
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
    return response.text;
  },

  async analyzeTrends(reports: Report[]) {
    if (reports.length === 0) return "विश्लेषण के लिए कोई डेटा उपलब्ध नहीं है। (No data available for analysis.)";
    
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
    return response.text;
  }
};