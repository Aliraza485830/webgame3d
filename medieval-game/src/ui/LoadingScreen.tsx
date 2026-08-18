import React, { useEffect } from 'react';
import { useGameStore } from '../utils/GameStore';

/**
 * LoadingScreen - Displayed while assets load
 */

interface LoadingScreenProps {
  progress?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress = 0 }) => {
  const setLoading = useGameStore((state) => state.setLoading);

  useEffect(() => {
    // Auto-hide when progress reaches 100
    if (progress >= 100) {
      setTimeout(() => setLoading(false, 100), 500);
    }
  }, [progress, setLoading]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Medieval Quest</h1>
        <p style={styles.subtitle}>Loading your adventure...</p>
        
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${Math.min(100, Math.max(0, progress))}%`
            }}
          />
        </div>
        
        <p style={styles.progressText}>{Math.round(progress)}%</p>
        
        <div style={styles.tips}>
          <p style={styles.tipTitle}>Tips:</p>
          <ul style={styles.tipList}>
            <li>WASD or Arrow Keys to move</li>
            <li>Mouse to look around</li>
            <li>Shift to run</li>
            <li>E to interact with NPCs and objects</li>
            <li>Click to attack enemies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    fontFamily: "'Georgia', serif"
  },
  content: {
    textAlign: 'center',
    color: '#f0e6d2',
    padding: '40px'
  },
  title: {
    fontSize: '48px',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    color: '#c9a959'
  },
  subtitle: {
    fontSize: '18px',
    marginBottom: '30px',
    opacity: 0.8
  },
  progressBar: {
    width: '300px',
    height: '20px',
    backgroundColor: '#2a2a3e',
    borderRadius: '10px',
    overflow: 'hidden',
    margin: '0 auto 10px',
    border: '2px solid #c9a959'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#c9a959',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '14px',
    opacity: 0.7
  },
  tips: {
    marginTop: '40px',
    padding: '20px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    maxWidth: '400px',
    margin: '40px auto 0'
  },
  tipTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#c9a959'
  },
  tipList: {
    textAlign: 'left',
    fontSize: '14px',
    lineHeight: '1.8',
    opacity: 0.8,
    paddingLeft: '20px'
  }
};

export default LoadingScreen;
