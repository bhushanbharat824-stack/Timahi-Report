export enum Quarter {
  Q1 = 'April-June (Q1)',
  Q2 = 'July-September (Q2)',
  Q3 = 'October-December (Q3)',
  Q4 = 'January-March (Q4)'
}

export enum Region {
  A = 'A (क)',
  B = 'B (ख)',
  C = 'C (ग)'
}

export type UserRole = 'MASTER' | 'SAO' | 'SECTION';

export type ReportStatus = 'DRAFT' | 'PENDING_SAO' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  sectionName?: string;
  email?: string;
}

export interface ReportPart2 {
  staff: {
    total: number;
    workingKnowledge: number;
    proficient: number;
  };
  typing: {
    total: number;
    trained: number;
  };
  stenography: {
    total: number;
    trained: number;
  };
  computers: {
    total: number;
    unicodeEnabled: number;
  };
  website: {
    isBilingual: boolean;
  };
  library: {
    totalExpenditure: number;
    hindiExpenditure: number;
  };
  publications: {
    total: number;
    hindi: number;
    bilingual: number;
  };
  inspections: {
    target: number;
    completed: number;
  };
}

export interface Report {
  id: string;
  year: string;
  quarter: Quarter;
  region: Region;
  sectionId: string;
  sectionName: string;
  
  status?: ReportStatus;
  saoRemarks?: string;

  officeInfo: {
    name: string;
    address: string;
    officerName: string;
    phone: string;
    email: string;
  };
  
  ministerFiles: { total: number; hindi: number };
  
  meetings: {
    secretaryLevel: { 
      meetingsCount: number; 
      minutesHindiCount: number;
      docsIssuedTotal: number;
      docsIssuedHindi: number;
    };
    olicHeld: boolean;
    olicDate: string;
    subordinateOlicCount?: number;
    subordinateOlicHeldCount?: number;
    subordinateOlicHindiMinutes?: boolean;
    advisoryHeld: boolean;
    advisoryDate?: string;
  };

  section33: {
    total: number;
    bilingual: number;
    englishOnly: number;
    hindiOnly: number;
  };

  rule5: {
    totalHindiReceived: number;
    repliedHindi: number;
    repliedEnglish: number;
    noReplyNeeded: number;
  };

  rule5EnglishLetters: {
    regionA: { received: number; repliedHindi: number; repliedEnglish: number; noReplyNeeded: number };
    regionB: { received: number; repliedHindi: number; repliedEnglish: number; noReplyNeeded: number };
  };

  correspondence: {
    toRegionA: { hindi: number; english: number; total: number; percentage: number };
    toRegionB: { hindi: number; english: number; total: number; percentage: number };
    toRegionC: { hindi: number; english: number; total: number; percentage: number };
    overallPercentage: number;
  };

  noting: {
    hindiPages: number;
    englishPages: number;
    totalNotes: number;
    eOfficeHindi: number;
  };

  workshops: {
    count: number;
    officersTrained: number;
    staffTrained: number;
  };

  training?: {
    totalStaff: number;
    trainedStaff: number;
  };
  
  inspectionsCount?: number;

  achievements: string;
  
  part2?: ReportPart2; 

  authorUid: string;
  timestamp: string;
  acknowledgementId: string;
  submittedBy: string;
  declarationSigned: boolean;
}

export type View = 'dashboard' | 'new-report' | 'reports-list' | 'analytics' | 'sections';