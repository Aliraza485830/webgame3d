import React from 'react';
import { useGameStore } from '../utils/GameStore';

/**
 * HUD - Heads-up display showing quest info, inventory, health, and time
 */

export const HUD: React.FC = () => {
  const activeQuest = useGameStore((state) => state.activeQuest);
  const inventory = useGameStore((state) => state.inventory);
  const completedQuests = useGameStore((state) => state.completedQuests);
  const health = useGameStore((state) => state.health);
  const maxHealth = useGameStore((state) => state.maxHealth);
  const coins = useGameStore((state) => state.coins);
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const useItem = useGameStore((state) => state.useItem);
  
  // Calculate time display
  const hours = Math.floor(timeOfDay);
  const minutes = Math.floor((timeOfDay - hours) * 60);
  const timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Determine time of day label
  const getTimeLabel = () => {
    if (hours >= 5 && hours < 12) return '🌅 Morning';
    if (hours >= 12 && hours < 17) return '☀️ Afternoon';
    if (hours >= 17 && hours < 21) return '🌆 Evening';
    return '🌙 Night';
  };

  return (
    <div style={styles.container}>
      {/* Health & Stats - Bottom Left */}
      <div style={styles.statsPanel}>
        <div style={styles.healthBar}>
          <div 
            style={{
              ...styles.healthFill,
              width: `${(health / maxHealth) * 100}%`,
              backgroundColor: health > maxHealth * 0.5 ? '#44cc44' : health > maxHealth * 0.25 ? '#ffaa00' : '#cc3333'
            }}
          />
          <span style={styles.healthText}>{Math.round(health)} / {maxHealth}</span>
        </div>
        
        <div style={styles.coinsDisplay}>
          <span style={styles.coinIcon}>💰</span>
          <span style={styles.coinCount}>{coins}</span>
        </div>
        
        <div style={styles.timeDisplay}>
          <span style={styles.timeIcon}>{getTimeLabel()}</span>
          <span style={styles.timeText}>{timeDisplay}</span>
        </div>
      </div>

      {/* Quest Tracker - Top Left */}
      <div style={styles.questPanel}>
        <h3 style={styles.panelTitle}>Quest Log</h3>

        {activeQuest ? (
          <div style={styles.questInfo}>
            <p style={styles.questTitle}>{activeQuest.title}</p>
            <p style={styles.questObjective}>{activeQuest.objective}</p>
            <p style={styles.questDescription}>{activeQuest.description}</p>
          </div>
        ) : (
          <p style={styles.noQuest}>No active quest</p>
        )}

        {completedQuests.length > 0 && (
          <div style={styles.completedSection}>
            <p style={styles.completedLabel}>Completed:</p>
            {completedQuests.map((quest) => (
              <p key={quest.id} style={styles.completedQuest}>
                ✓ {quest.title}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Inventory - Top Right */}
      <div style={styles.inventoryPanel}>
        <h3 style={styles.panelTitle}>Inventory</h3>

        {inventory.length === 0 ? (
          <p style={styles.emptyInventory}>Empty</p>
        ) : (
          <div style={styles.inventoryGrid}>
            {inventory.map((item, index) => (
              <button
                key={item.id || index}
                style={styles.inventorySlot}
                onClick={() => {
                  if (item.type === 'consumable' && item.effect) {
                    useItem(item.id);
                  }
                }}
                title={item.type === 'consumable' ? 'Click to use' : ''}
              >
                <span style={styles.itemIcon}>{item.icon}</span>
                <span style={styles.itemName}>{item.name}</span>
                {item.type === 'consumable' && (
                  <span style={styles.consumableBadge}>✚</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls hint - Bottom */}
      <div style={styles.controlsHint}>
        <span>WASD: Move | Mouse: Look | Shift: Run | E: Interact | Click: Attack</span>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 100,
    fontFamily: "'Georgia', serif"
  },
  statsPanel: {
    position: 'absolute',
    bottom: '60px',
    left: '20px',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    border: '2px solid #c9a959',
    borderRadius: '8px',
    padding: '15px',
    minWidth: '200px',
    color: '#f0e6d2',
    pointerEvents: 'auto'
  },
  healthBar: {
    position: 'relative' as const,
    height: '24px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: '4px',
    marginBottom: '10px',
    overflow: 'hidden'
  },
  healthFill: {
    position: 'absolute' as const,
    height: '100%',
    transition: 'width 0.3s ease'
  },
  healthText: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#fff',
    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
  },
  coinsDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px'
  },
  coinIcon: {
    fontSize: '18px'
  },
  coinCount: {
    fontWeight: 'bold',
    color: '#ffd700'
  },
  timeDisplay: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    opacity: 0.9
  },
  timeIcon: {
    marginRight: '8px'
  },
  timeText: {
    fontFamily: 'monospace',
    fontWeight: 'bold'
  },
  questPanel: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    border: '2px solid #c9a959',
    borderRadius: '8px',
    padding: '15px',
    minWidth: '250px',
    maxWidth: '300px',
    color: '#f0e6d2',
    pointerEvents: 'auto'
  },
  panelTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#c9a959',
    borderBottom: '1px solid #3a3a4e',
    paddingBottom: '8px'
  },
  questInfo: {
    marginBottom: '10px'
  },
  questTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#fff'
  },
  questObjective: {
    fontSize: '13px',
    fontStyle: 'italic',
    marginBottom: '8px',
    color: '#c9a959'
  },
  questDescription: {
    fontSize: '12px',
    lineHeight: '1.5',
    opacity: 0.9
  },
  noQuest: {
    fontSize: '13px',
    opacity: 0.7,
    fontStyle: 'italic'
  },
  completedSection: {
    marginTop: '15px',
    paddingTop: '10px',
    borderTop: '1px solid #3a3a4e'
  },
  completedLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#88cc88'
  },
  completedQuest: {
    fontSize: '12px',
    color: '#88cc88',
    marginBottom: '3px'
  },
  inventoryPanel: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    border: '2px solid #c9a959',
    borderRadius: '8px',
    padding: '15px',
    minWidth: '200px',
    color: '#f0e6d2',
    pointerEvents: 'auto'
  },
  emptyInventory: {
    fontSize: '13px',
    opacity: 0.7,
    fontStyle: 'italic'
  },
  inventoryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  inventorySlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid transparent',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const
  },
  itemIcon: {
    fontSize: '20px'
  },
  itemName: {
    fontSize: '13px',
    flex: 1
  },
  consumableBadge: {
    fontSize: '12px',
    color: '#44cc44',
    marginLeft: '4px'
  },
  controlsHint: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '8px 16px',
    borderRadius: '4px',
    color: '#aaa',
    fontSize: '12px'
  }
};

export default HUD;
