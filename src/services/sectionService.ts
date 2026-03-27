const STORAGE_KEY = 'rajbhasha_sections';

const DEFAULT_SECTIONS = [
  "स्थापना-I (Est-I)", "स्थापना-II (Est-II)", "लेखा (Accounts)", "सतर्कता (Vigilance)", 
  "प्रशासन (Admin)", "रोकड़ (Cash)", "तकनीकी (Technical)", "प्रशिक्षण (Training)", 
  "क्रय (Purchase)", "भंडार (Store)", "संपदा (Estate)", "सामान्य (General)", 
  "विधि (Legal)", "सूचना प्रौद्योगिकी (IT)", "पुस्तकालय (Library)", "योजना (Planning)", 
  "सुरक्षा (Security)", "कल्याण (Welfare)", "कार्मिक (Personnel)", "शिकायत (Grievance)",
  "भवन (Building)", "परिवहन (Transport)", "प्रकाशन (Publication)", "अनुसंधान (R&D)", "हिंदी (Hindi)"
];

export const sectionService = {
  getSections: (): string[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SECTIONS));
      return DEFAULT_SECTIONS;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_SECTIONS;
    }
  },

  addSection: (name: string): void => {
    const sections = sectionService.getSections();
    const trimmedName = name.trim();
    if (trimmedName && !sections.some(s => s.toLowerCase() === trimmedName.toLowerCase())) {
      const updated = [...sections, trimmedName].sort((a, b) => a.localeCompare(b, 'hi'));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  deleteSection: (name: string): void => {
    try {
      const sections = sectionService.getSections();
      // Use exact match with trim to prevent invisible character mismatch
      const filtered = sections.filter(s => s.trim() !== name.trim());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to delete section from local storage", e);
    }
  }
};