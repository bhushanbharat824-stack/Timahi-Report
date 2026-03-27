import { Report } from '../types';

// Mock report service for standalone deployment
export const reportService = {
  getReports: async (): Promise<Report[]> => {
    const stored = localStorage.getItem('rajbhasha_reports');
    return stored ? JSON.parse(stored) : [];
  },

  saveReport: async (report: Report): Promise<void> => {
    const reports = await reportService.getReports();
    const index = reports.findIndex(r => r.id === report.id);
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.push(report);
    }
    localStorage.setItem('rajbhasha_reports', JSON.stringify(reports));
  },

  deleteReport: async (id: string): Promise<void> => {
    let reports = await reportService.getReports();
    reports = reports.filter(r => r.id !== id);
    localStorage.setItem('rajbhasha_reports', JSON.stringify(reports));
  },

  deleteReportsBySection: async (sectionName: string): Promise<void> => {
    let reports = await reportService.getReports();
    reports = reports.filter(r => r.sectionName !== sectionName);
    localStorage.setItem('rajbhasha_reports', JSON.stringify(reports));
  },

  exportData: (reports: Report[], sections: string[]) => {
    const data = {
      reports,
      sections,
      exportDate: new Date().toISOString(),
      version: "2.0.0-standalone"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rajbhasha_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: async (jsonString: string): Promise<{success: boolean, count: number}> => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.reports || !Array.isArray(data.reports)) return { success: false, count: 0 };
      
      localStorage.setItem('rajbhasha_reports', JSON.stringify(data.reports));
      if (data.sections && Array.isArray(data.sections)) {
        localStorage.setItem('rajbhasha_sections', JSON.stringify(data.sections));
      }
      
      return { success: true, count: data.reports.length };
    } catch (err) {
      console.error("Import error:", err);
      return { success: false, count: 0 };
    }
  }
};
