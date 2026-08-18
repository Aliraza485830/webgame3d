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
  type: 'quest' | 'consumable' | 'currency' | 'equipment';
  effect?: {
    type: 'heal' | 'damage' | 'speed';
    value: number;
  };
}

interface GameState {
  // Quest state
  activeQuest: Quest | null;
  completedQuests: Quest[];
  
  // Inventory
  inventory: InventoryItem[];
  
  // Player stats
  health: number;
  maxHealth: number;
  coins: number;
  
  // Game state
  isPlaying: boolean;
  isLoading: boolean;
  loadingProgress: number;
  timeOfDay: number; // 0-24 hours
  
  // Actions
  setQuest: (quest: Quest) => void;
  completeQuest: (questId: string) => void;
  addToInventory: (item: InventoryItem) => void;
  removeFromInventory: (itemId: string) => void;
  useItem: (itemId: string) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  addCoins: (amount: number) => void;
  setLoading: (loading: boolean, progress?: number) => void;
  setPlaying: (playing: boolean) => void;
  setTimeOfDay: (time: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  activeQuest: null,
  completedQuests: [],
  inventory: [],
  health: 100,
  maxHealth: 100,
  coins: 0,
  isPlaying: false,
  isLoading: true,
  loadingProgress: 0,
  timeOfDay: 12, // Start at noon
  
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
  
  removeFromInventory: (itemId) => set((state) => ({
    inventory: state.inventory.filter(item => item.id !== itemId)
  })),
  
  useItem: (itemId) => set((state) => {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item || !item.effect) return state;
    
    let newHealth = state.health;
    if (item.effect.type === 'heal') {
      newHealth = Math.min(state.health + item.effect.value, state.maxHealth);
    } else if (item.effect.type === 'damage') {
      // Could be used for poison etc.
      newHealth = Math.max(state.health - item.effect.value, 0);
    }
    
    return {
      inventory: state.inventory.filter(i => i.id !== itemId),
      health: newHealth
    };
  }),
  
  takeDamage: (amount) => set((state) => ({
    health: Math.max(state.health - amount, 0)
  })),
  
  heal: (amount) => set((state) => ({
    health: Math.min(state.health + amount, state.maxHealth)
  })),
  
  addCoins: (amount) => set((state) => ({
    coins: state.coins + amount
  })),
  
  setLoading: (loading, progress = 0) => set({ 
    isLoading: loading, 
    loadingProgress: progress 
  }),
  
  setPlaying: (playing) => set({ isPlaying: playing }),
  
  setTimeOfDay: (time) => set({ timeOfDay: time })
}));
