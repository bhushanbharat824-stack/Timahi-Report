// Mock section service using local storage for standalone deployment
const STORAGE_KEY = 'rajbhasha_sections';

export const sectionService = {
  getSections: (): string[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : ['सामान्य प्रशासन', 'राजभाषा अनुभाग', 'वित्त अनुभाग', 'कार्मिक अनुभाग'];
  },

  addSection: async (name: string): Promise<void> => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    const sections = sectionService.getSections();
    if (!sections.includes(trimmedName)) {
      sections.push(trimmedName);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    }
  },

  deleteSection: async (name: string): Promise<void> => {
    let sections = sectionService.getSections();
    sections = sections.filter(s => s !== name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }
};
