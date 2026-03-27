import { Report } from '../types';

const STORAGE_KEY = 'rajbhasha_reports';

export const reportService = {
  getReports: (): Report[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveReport: (report: Report): void => {
    const reports = reportService.getReports();
    reports.push(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  },

  updateReport: (updatedReport: Report): void => {
    const reports = reportService.getReports();
    const index = reports.findIndex(r => r.id === updatedReport.id);
    if (index !== -1) {
      reports[index] = updatedReport;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    }
  },

  deleteReport: (id: string): void => {
    const reports = reportService.getReports();
    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  deleteReportsBySection: (sectionName: string): void => {
    const reports = reportService.getReports();
    const filtered = reports.filter(r => r.sectionName !== sectionName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Export all data to a JSON file
  exportData: () => {
    const reports = reportService.getReports();
    const sections = localStorage.getItem('rajbhasha_sections');
    const data = {
      reports,
      sections: sections ? JSON.parse(sections) : [],
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rajbhasha_Backup_${new Date().toLocaleDateString()}.json`;
    link.click();
  },

  // Import and merge data from a JSON file
  importData: (jsonData: string): { success: boolean, count: number } => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.reports || !Array.isArray(parsed.reports)) return { success: false, count: 0 };

      const existingReports = reportService.getReports();
      const existingIds = new Set(existingReports.map(r => r.id));
      
      let importCount = 0;
      parsed.reports.forEach((newReport: Report) => {
        if (!existingIds.has(newReport.id)) {
          existingReports.push(newReport);
          importCount++;
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingReports));
      
      // Also merge sections if available
      if (parsed.sections && Array.isArray(parsed.sections)) {
        const existingSections = JSON.parse(localStorage.getItem('rajbhasha_sections') || '[]');
        const mergedSections = Array.from(new Set([...existingSections, ...parsed.sections])).sort();
        localStorage.setItem('rajbhasha_sections', JSON.stringify(mergedSections));
      }

      return { success: true, count: importCount };
    } catch (e) {
      console.error("Import failed", e);
      return { success: false, count: 0 };
    }
  }
};