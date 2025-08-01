// Updated: App store. 
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  AppState, 
  Session, 
  Template, 
  Photo, 
  PhotoSlot, 
  Package,
  TemplateType,
  UIState,
  LoadingState,
  ErrorInfo,
  Screen,
  GoogleAuth,
  DriveFolder,
  TemplateSlot,
  TemplateTypeInfo
} from '../types';
import { STORAGE_KEYS } from '../utils/constants';

interface AppStore extends AppState {
  // Event Log for debugging
  eventLog: string[];
  addEvent: (event: string) => void;

  // New state properties
  currentScreen: Screen;
  googleAuth: GoogleAuth;
  isGapiLoaded: boolean;
  driveFolders: DriveFolder[];
  selectedMainFolder: DriveFolder | null;
  clientFolders: DriveFolder[];
  selectedClientFolder: DriveFolder | null;
  templateSlots: TemplateSlot[];
  selectedSlot: TemplateSlot | null;
  selectedPackage: Package | null;
  clientName: string;
  templateCounts: Record<string, number>;
  packages: Package[];
  templateTypes: TemplateTypeInfo[];

  // Actions for new state
  setCurrentScreen: (screen: Screen) => void;
  setGoogleAuth: (auth: GoogleAuth) => void;
  setIsGapiLoaded: (loaded: boolean) => void;
  setDriveFolders: (folders: DriveFolder[]) => void;
  setSelectedMainFolder: (folder: DriveFolder | null) => void;
  setClientFolders: (folders: DriveFolder[]) => void;
  setSelectedClientFolder: (folder: DriveFolder | null) => void;
  setTemplateSlots: (slots: TemplateSlot[]) => void;
  setSelectedSlot: (slot: TemplateSlot | null) => void;
  setSelectedPackage: (pkg: Package | null) => void;
  setClientName: (name: string) => void;
  setTemplateCounts: (counts: Record<string, number>) => void;
  handleTemplateCountChange: (templateId: string, change: number, customLimit?: number) => void;
  getTotalTemplateCount: () => number;

  // UI State
  uiState: UIState;
  loadingState: LoadingState;
  
  // Main folder setup
  mainSessionsFolder: { id: string; name: string } | null;
  
  // Actions
  setSession: (session: Session | null) => void;
  updateSession: (updates: Partial<Session>) => void;
  
  // Main folder actions
  setMainSessionsFolder: (folder: { id: string; name: string } | null) => void;
  
  // Package actions
  selectPackage: (packageId: Package['id'], clientName: string, sessionFolderId: string) => void;
  
  // Template actions
  addTemplate: (templateType: TemplateType) => void;
  removeTemplate: (templateId: string) => void;
  selectTemplate: (template: Template | null) => void;
  updateTemplate: (templateId: string, updates: Partial<Template>) => void;
  
  // Photo actions
  setPhotos: (photos: Photo[]) => void;
  addPhoto: (photo: Photo) => void;
  removePhoto: (photoId: string) => void;
  selectPhotoForSlot: (templateId: string, slotId: string, photo: Photo) => void;
  removePhotoFromSlot: (templateId: string, slotId: string) => void;
  
  // UI actions
  setSelectedPhotoSlot: (slot: PhotoSlot | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'name' | 'date' | 'size') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  togglePhotoSelector: () => void;
  toggleTemplatePreview: () => void;
  
  // Loading and error handling
  setLoading: (loading: boolean, message?: string, progress?: number) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Step navigation
  setCurrentStep: (step: AppState['currentStep']) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Google Drive
  setGoogleDriveConnected: (connected: boolean) => void;
  
  // Session management
  saveSession: () => void;
  loadSession: () => void;
  clearSession: () => void;
  
  // Utility functions
  canAddTemplate: () => boolean;
  getRemainingTemplates: () => number;
  getUsedPhotos: () => Photo[];
  isTemplateComplete: (templateId: string) => boolean;
  getAllTemplatesComplete: () => boolean;
}

const initialUIState: UIState = {
  showPhotoSelector: false,
  showTemplatePreview: false,
  showProgressBar: false,
  selectedPhotoSlot: null,
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
};

const initialLoadingState: LoadingState = {
  isLoading: false,
  message: undefined,
  progress: undefined,
};

const createTemplate = async (type: TemplateType): Promise<Template> => {
  const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  // REMOVED: No hardcoded values - everything comes from database
  throw new Error('createTemplate is deprecated. Use templateStore.addTemplate() which queries database for configuration.');
};

const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        session: null,
        photos: [],
        templates: [],
        selectedTemplate: null,
        isLoading: false,
        error: null,
        googleDriveConnected: false,
        currentStep: 'package',
        uiState: initialUIState,
        loadingState: initialLoadingState,
        mainSessionsFolder: null,
        
        // Event Log
        eventLog: [],
        addEvent: (event) => set((state) => ({ eventLog: [...state.eventLog, `${new Date().toISOString()}: ${event}`] })),

        // New state initial values
        currentScreen: 'drive-setup',
        googleAuth: { isSignedIn: false, userEmail: null },
        isGapiLoaded: false,
        driveFolders: [],
        selectedMainFolder: null,
        clientFolders: [],
        selectedClientFolder: null,
        templateSlots: [],
        selectedSlot: null,
        selectedPackage: null,
        clientName: '',
        templateCounts: {}, // Dynamic template counts - populated by templateStore.loadTemplateTypes()
        packages: [
          { 
            id: 'A', 
            name: 'Package A', 
            templateCount: 1, 
            price: 249,
            description: 'Perfect for a single memorable print'
          },
          { 
            id: 'B', 
            name: 'Package B', 
            templateCount: 2, 
            price: 549,
            description: 'Great for couples or small groups'
          },
          { 
            id: 'C', 
            name: 'Package C', 
            templateCount: 5, 
            price: 999,
            description: 'Ideal for families and events'
          },
          { 
            id: 'D', 
            name: 'Package D', 
            templateCount: 10, 
            price: 1999,
            description: 'Complete collection for special occasions'
          },
        ],
        templateTypes: [], // Dynamic template types - populated by templateStore.loadTemplateTypes()

        // Actions for new state
        setCurrentScreen: (screen) => set({ currentScreen: screen }),
        setGoogleAuth: (auth) => set({ googleAuth: auth }),
        setIsGapiLoaded: (loaded) => set({ isGapiLoaded: loaded }),
        setDriveFolders: (folders) => set({ driveFolders: folders }),
        setSelectedMainFolder: (folder) => set({ selectedMainFolder: folder }),
        setClientFolders: (folders) => set({ clientFolders: folders }),
        setSelectedClientFolder: (folder) => set({ selectedClientFolder: folder }),
        setTemplateSlots: (slots) => set({ templateSlots: slots }),
        setSelectedSlot: (slot) => set({ selectedSlot: slot }),
        setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),
        setClientName: (name) => set({ clientName: name }),
        setTemplateCounts: (counts) => set({ templateCounts: counts }),
        handleTemplateCountChange: (templateId, change, customLimit) => {
          const state = get();
          const currentCount = state.templateCounts[templateId] || 0;
          const newCount = Math.max(0, currentCount + change);
          const totalCount = Object.values(state.templateCounts).reduce((sum, count) => sum + count, 0) - currentCount + newCount;
          const limit = customLimit !== undefined ? customLimit : (state.selectedPackage?.templateCount || 0);
          if (totalCount <= limit) {
            set({
              templateCounts: {
                ...state.templateCounts,
                [templateId]: newCount,
              },
            });
          }
        },
        getTotalTemplateCount: () => {
          const state = get();
          return Object.values(state.templateCounts).reduce((sum, count) => sum + count, 0);
        },

        // Session actions
        setSession: (session) => set({ session }),
        
        updateSession: (updates) => set((state) => ({
          session: state.session ? { ...state.session, ...updates, updatedAt: new Date() } : null,
        })),

        // Main folder actions
        setMainSessionsFolder: (folder) => {
          set({ mainSessionsFolder: folder });
          if (folder) {
            try {
              localStorage.setItem(STORAGE_KEYS.MAIN_SESSIONS_FOLDER, JSON.stringify(folder));
            } catch (error) {
              console.error('Failed to save main sessions folder:', error);
            }
          } else {
            try {
              localStorage.removeItem(STORAGE_KEYS.MAIN_SESSIONS_FOLDER);
            } catch (error) {
              console.error('Failed to remove main sessions folder:', error);
            }
          }
        },

        // Package actions
        selectPackage: (packageId, clientName, sessionFolderId) => {
          const state = get();
          const selectedPackage = state.packages.find(pkg => pkg.id === packageId);
          if (!selectedPackage) return;

          const session: Session = {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            clientName,
            package_id: packageId,
            selectedTemplates: [],
            maxTemplates: selectedPackage.templateCount,
            usedTemplates: 0,
            googleDriveFolderId: sessionFolderId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isCompleted: false,
          };

          set({ 
            session, 
            currentStep: 'template',
            templates: [],
            selectedTemplate: null,
          });
        },

        // Template actions
        addTemplate: async (templateType) => {
          const state = get();
          if (!state.canAddTemplate()) return;

          // DEPRECATED: This method is deprecated in favor of templateStore.addTemplate()
          // which properly queries the database for template configuration
          throw new Error('addTemplate is deprecated. Use templateStore.addTemplate() instead for database-driven templates.');
        },

        removeTemplate: (templateId) => set((state) => ({
          templates: state.templates.filter(t => t.id !== templateId),
          selectedTemplate: state.selectedTemplate?.id === templateId ? null : state.selectedTemplate,
          session: state.session ? {
            ...state.session,
            selectedTemplates: state.session.selectedTemplates.filter(t => t.id !== templateId),
            usedTemplates: Math.max(0, state.session.usedTemplates - 1),
            updatedAt: new Date(),
          } : null,
        })),

        selectTemplate: (template) => set({ selectedTemplate: template }),

        updateTemplate: (templateId, updates) => set((state) => ({
          templates: state.templates.map(t => 
            t.id === templateId ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
          session: state.session ? {
            ...state.session,
            selectedTemplates: state.session.selectedTemplates.map(t =>
              t.id === templateId ? { ...t, ...updates, updatedAt: new Date() } : t
            ),
            updatedAt: new Date(),
          } : null,
        })),

        // Photo actions
        setPhotos: (photos) => set({ photos }),

        addPhoto: (photo) => set((state) => ({
          photos: [...state.photos, photo],
        })),

        removePhoto: (photoId) => set((state) => ({
          photos: state.photos.filter(p => p.id !== photoId),
        })),

        selectPhotoForSlot: (templateId, slotId, photo) => {
          set((state) => ({
            templates: state.templates.map(template => 
              template.id === templateId 
                ? {
                    ...template,
                    photoSlots: template.photoSlots.map(slot =>
                      slot.id === slotId ? { ...slot, photo } : slot
                    ),
                    updatedAt: new Date(),
                  }
                : template
            ),
            session: state.session ? {
              ...state.session,
              selectedTemplates: state.session.selectedTemplates.map(template =>
                template.id === templateId
                  ? {
                      ...template,
                      photoSlots: template.photoSlots.map(slot =>
                        slot.id === slotId ? { ...slot, photo } : slot
                      ),
                      updatedAt: new Date(),
                    }
                  : template
              ),
              updatedAt: new Date(),
            } : null,
          }));
        },

        removePhotoFromSlot: (templateId, slotId) => {
          set((state) => ({
            templates: state.templates.map(template => 
              template.id === templateId 
                ? {
                    ...template,
                    photoSlots: template.photoSlots.map(slot =>
                      slot.id === slotId ? { ...slot, photo: undefined } : slot
                    ),
                    updatedAt: new Date(),
                  }
                : template
            ),
            session: state.session ? {
              ...state.session,
              selectedTemplates: state.session.selectedTemplates.map(template =>
                template.id === templateId
                  ? {
                      ...template,
                      photoSlots: template.photoSlots.map(slot =>
                        slot.id === slotId ? { ...slot, photo: undefined } : slot
                      ),
                      updatedAt: new Date(),
                    }
                  : template
              ),
              updatedAt: new Date(),
            } : null,
          }));
        },

        // UI actions
        setSelectedPhotoSlot: (slot) => set((state) => ({
          uiState: { ...state.uiState, selectedPhotoSlot: slot },
        })),

        setViewMode: (mode) => set((state) => ({
          uiState: { ...state.uiState, viewMode: mode },
        })),

        setSortBy: (sortBy) => set((state) => ({
          uiState: { ...state.uiState, sortBy },
        })),

        setSortOrder: (order) => set((state) => ({
          uiState: { ...state.uiState, sortOrder: order },
        })),

        togglePhotoSelector: () => set((state) => ({
          uiState: { ...state.uiState, showPhotoSelector: !state.uiState.showPhotoSelector },
        })),

        toggleTemplatePreview: () => set((state) => ({
          uiState: { ...state.uiState, showTemplatePreview: !state.uiState.showTemplatePreview },
        })),

        // Loading and error handling
        setLoading: (isLoading, message, progress) => set({
          loadingState: { isLoading, message, progress },
          isLoading,
        }),

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),

        // Step navigation
        setCurrentStep: (step) => set({ currentStep: step }),

        nextStep: () => {
          const state = get();
          const steps: AppState['currentStep'][] = ['package', 'template', 'photos', 'preview', 'complete'];
          const currentIndex = steps.indexOf(state.currentStep);
          if (currentIndex < steps.length - 1) {
            set({ currentStep: steps[currentIndex + 1] });
          }
        },

        previousStep: () => {
          const state = get();
          const steps: AppState['currentStep'][] = ['package', 'template', 'photos', 'preview', 'complete'];
          const currentIndex = steps.indexOf(state.currentStep);
          if (currentIndex > 0) {
            set({ currentStep: steps[currentIndex - 1] });
          }
        },

        // Google Drive
        setGoogleDriveConnected: (connected) => set({ googleDriveConnected: connected }),

        // Session management
        saveSession: () => {
          const state = get();
          if (state.session) {
            try {
              localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(state.session));
            } catch (error) {
              console.error('Failed to save session:', error);
            }
          }
        },

        loadSession: () => {
          try {
            const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (saved) {
              const session = JSON.parse(saved);
              set({ 
                session,
                templates: session.selectedTemplates || [],
                currentStep: session.isCompleted ? 'complete' : 'template',
              });
            }
            
            // Load main sessions folder
            const mainFolderSaved = localStorage.getItem(STORAGE_KEYS.MAIN_SESSIONS_FOLDER);
            if (mainFolderSaved) {
              const mainFolder = JSON.parse(mainFolderSaved);
              set({ mainSessionsFolder: mainFolder });
            }
          } catch (error) {
            console.error('Failed to load session:', error);
          }
        },

        clearSession: () => {
          set({
            session: null,
            photos: [],
            templates: [],
            selectedTemplate: null,
            currentStep: 'package',
            uiState: initialUIState,
          });
          try {
            localStorage.removeItem(STORAGE_KEYS.SESSION);
          } catch (error) {
            console.error('Failed to clear session:', error);
          }
        },

        // Utility functions
        canAddTemplate: () => {
          const state = get();
          return state.session ? state.session.usedTemplates < state.session.maxTemplates : false;
        },

        getRemainingTemplates: () => {
          const state = get();
          return state.session ? state.session.maxTemplates - state.session.usedTemplates : 0;
        },

        getUsedPhotos: () => {
          const state = get();
          const usedPhotos: Photo[] = [];
          state.templates.forEach(template => {
            template.photoSlots.forEach(slot => {
              if (slot.photo) {
                usedPhotos.push(slot.photo);
              }
            });
          });
          return usedPhotos;
        },

        isTemplateComplete: (templateId) => {
          const state = get();
          const template = state.templates.find(t => t.id === templateId);
          if (!template) return false;
          return template.photoSlots.every(slot => slot.photo !== undefined);
        },

        getAllTemplatesComplete: () => {
          const state = get();
          return state.templates.every(template => 
            template.photoSlots.every(slot => slot.photo !== undefined)
          );
        },
      }),
      {
        name: STORAGE_KEYS.SESSION,
        partialize: (state) => ({
          session: state.session,
          templates: state.templates,
          currentStep: state.currentStep,
          mainSessionsFolder: state.mainSessionsFolder,
        }),
      }
    )
  )
);

export default useAppStore; 