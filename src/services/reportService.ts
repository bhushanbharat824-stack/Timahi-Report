import { db, collection, doc, setDoc, updateDoc, deleteDoc, handleFirestoreError, OperationType, query, where, getDocs } from '../firebase';
import { Report } from '../types';

const COLLECTION_NAME = 'reports';

export const reportService = {
  saveReport: async (report: Report): Promise<void> => {
    try {
      await setDoc(doc(db, COLLECTION_NAME, report.id), report);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    }
  },

  updateReport: async (updatedReport: Report): Promise<void> => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, updatedReport.id), { ...updatedReport });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${updatedReport.id}`);
    }
  },

  deleteReport: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  },

  deleteReportsBySection: async (sectionName: string): Promise<void> => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('sectionName', '==', sectionName));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME} (query: sectionName=${sectionName})`);
    }
  },

  // Export all data to a JSON file (still useful for local backup)
  exportData: (reports: Report[], sections: string[]) => {
    const data = {
      reports,
      sections,
      exportDate: new Date().toISOString(),
      version: "1.1"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rajbhasha_Backup_${new Date().toLocaleDateString()}.json`;
    link.click();
  },

  // Import data (will need to be updated to write to Firestore)
  importData: async (jsonData: string): Promise<{ success: boolean, count: number }> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.reports || !Array.isArray(parsed.reports)) return { success: false, count: 0 };
      
      let importCount = 0;
      for (const newReport of parsed.reports) {
        // Simple check to avoid overwriting if we don't want to
        // In a real app, we might want to check if it exists first
        await reportService.saveReport(newReport);
        importCount++;
      }

      return { success: true, count: importCount };
    } catch (e) {
      console.error("Import failed", e);
      return { success: false, count: 0 };
    }
  }
};
