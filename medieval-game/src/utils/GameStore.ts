import { create } from 'zustand';

export interface Quest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  objective: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
}

interface GameState {
  // Quest state
  activeQuest: Quest | null;
  completedQuests: Quest[];
  
  // Inventory
  inventory: InventoryItem[];
  
  // Game state
  isPlaying: boolean;
  isLoading: boolean;
  loadingProgress: number;
  
  // Actions
  setQuest: (quest: Quest) => void;
  completeQuest: (questId: string) => void;
  addToInventory: (item: InventoryItem) => void;
  setLoading: (loading: boolean, progress?: number) => void;
  setPlaying: (playing: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  activeQuest: null,
  completedQuests: [],
  inventory: [],
  isPlaying: false,
  isLoading: true,
  loadingProgress: 0,
  
  setQuest: (quest) => set({ activeQuest: quest }),
  
  completeQuest: (questId) => set((state) => {
    const quest = state.activeQuest;
    if (!quest || quest.id !== questId) return state;
    
    return {
      activeQuest: null,
      completedQuests: [...state.completedQuests, { ...quest, completed: true }]
    };
  }),
  
  addToInventory: (item) => set((state) => ({
    inventory: [...state.inventory, item]
  })),
  
  setLoading: (loading, progress = 0) => set({ 
    isLoading: loading, 
    loadingProgress: progress 
  }),
  
  setPlaying: (playing) => set({ isPlaying: playing })
}));
