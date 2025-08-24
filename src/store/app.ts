import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, ApplicationStatus, UploadedDoc } from '@/types';

interface AppStore extends AppState {
  setApplicationData: (data: { 
    applicationId: string; 
    borrowerId: string; 
    businessId: string; 
  }) => void;
  setMatchedProgram: (program: "7a" | "504" | "microloan" | "express") => void;
  setStatus: (status: ApplicationStatus) => void;
  addUploadedDoc: (doc: UploadedDoc) => void;
  setConsentsCompleted: (completed: boolean) => void;
  reset: () => void;
}

const initialState: AppState = {
  status: "precheck",
  uploadedDocs: [],
  consentsCompleted: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setApplicationData: (data) => set((state) => ({
        ...state,
        applicationId: data.applicationId,
        borrowerId: data.borrowerId,
        businessId: data.businessId,
      })),
      
      setMatchedProgram: (program) => set((state) => ({
        ...state,
        matchedProgram: program,
      })),
      
      setStatus: (status) => set((state) => ({
        ...state,
        status,
      })),
      
      addUploadedDoc: (doc) => set((state) => ({
        ...state,
        uploadedDocs: [...state.uploadedDocs, doc],
      })),
      
      setConsentsCompleted: (completed) => set((state) => ({
        ...state,
        consentsCompleted: completed,
      })),
      
      reset: () => set(initialState),
    }),
    {
      name: 'sba-app-state',
    }
  )
);