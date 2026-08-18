import React, { useState, useEffect } from 'react';

/**
 * DialogueBox - UI overlay for NPC conversations
 */

export interface DialogueData {
  npcName: string;
  text: string;
  hasMore: boolean;
  action?: () => void;
}

interface DialogueBoxProps {
  dialogue: DialogueData | null;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, onClose }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!dialogue) {
      setDisplayText('');
      return;
    }

    // Typewriter effect
    setIsTyping(true);
    setDisplayText('');
    let index = 0;
    
    const timer = setInterval(() => {
      if (index < dialogue.text.length) {
        setDisplayText(dialogue.text.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [dialogue]);

  if (!dialogue) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.npcName}>{dialogue.npcName}</span>
        </div>
        
        <div style={styles.content}>
          <p style={styles.text}>{displayText}</p>
          {isTyping && <span style={styles.cursor}>|</span>}
        </div>
        
        <div style={styles.footer}>
          {isTyping ? (
            <span style={styles.prompt}>Click to skip...</span>
          ) : (
            <button style={styles.button} onClick={onClose}>
              {dialogue.hasMore ? 'Continue' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1000,
    padding: '20px'
  },
  container: {
    backgroundColor: '#2a2a3e',
    border: '3px solid #c9a959',
    borderRadius: '8px',
    maxWidth: '600px',
    width: '100%',
    marginBottom: '40px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    fontFamily: "'Georgia', serif"
  },
  header: {
    backgroundColor: '#c9a959',
    padding: '12px 20px',
    borderTopLeftRadius: '5px',
    borderTopRightRadius: '5px'
  },
  npcName: {
    color: '#1a1a2e',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  content: {
    padding: '20px',
    minHeight: '100px'
  },
  text: {
    color: '#f0e6d2',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: 0
  },
  cursor: {
    color: '#c9a959',
    animation: 'blink 0.7s infinite'
  },
  footer: {
    padding: '15px 20px',
    borderTop: '2px solid #3a3a4e',
    textAlign: 'right'
  },
  button: {
    backgroundColor: '#c9a959',
    color: '#1a1a2e',
    border: 'none',
    padding: '10px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'Georgia', serif"
  },
  prompt: {
    color: '#888',
    fontSize: '14px',
    fontStyle: 'italic'
  }
};

export default DialogueBox;
