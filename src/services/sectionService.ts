import { db, collection, doc, setDoc, deleteDoc, handleFirestoreError, OperationType } from '../firebase';

const COLLECTION_NAME = 'sections';

export const sectionService = {
  addSection: async (name: string): Promise<void> => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    try {
      // Use name as ID for simplicity and to avoid duplicates
      const sectionId = trimmedName.replace(/\s+/g, '_').toLowerCase();
      await setDoc(doc(db, COLLECTION_NAME, sectionId), { name: trimmedName });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    }
  },

  deleteSection: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
