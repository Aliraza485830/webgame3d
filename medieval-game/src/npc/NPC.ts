import * as THREE from 'three';

/**
 * NPC - Non-Player Character with dialogue and interaction
 */

export interface NPCConfig {
  name: string;
  position: THREE.Vector3;
  dialogues: Dialogue[];
  modelColor?: number;
}

export interface Dialogue {
  id: string;
  text: string;
  nextDialogueId?: string;
  action?: () => void;
  requiresItem?: string;
  givesItem?: { id: string; name: string };
  givesQuest?: { id: string; title: string; description: string; objective: string };
}

export class NPC {
  private config: NPCConfig;
  private mesh: THREE.Group | null = null;
  private currentDialogueIndex: number = 0;
  private hasInteracted: boolean = false;

  constructor(config: NPCConfig) {
    this.config = config;
  }

  /**
   * Create the visual representation of the NPC
   */
  public createMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.4, 1, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.config.modelColor || 0x4a90d9,
      roughness: 0.7,
      metalness: 0.1
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.9;
    bodyMesh.castShadow = true;
    group.add(bodyMesh);
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.6
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.7;
    headMesh.castShadow = true;
    group.add(headMesh);
    
    // Position
    group.position.copy(this.config.position);
    
    this.mesh = group;
    return group;
  }

  /**
   * Get the NPC's mesh for adding to scene
   */
  public getMesh(): THREE.Group | null {
    return this.mesh;
  }

  /**
   * Start dialogue with this NPC
   */
  public startDialogue(): Dialogue | null {
    if (this.config.dialogues.length === 0) return null;
    
    const dialogue = this.config.dialogues[this.currentDialogueIndex];
    this.hasInteracted = true;
    
    return dialogue;
  }

  /**
   * Advance to next dialogue
   */
  public advanceDialogue(): Dialogue | null {
    const current = this.config.dialogues[this.currentDialogueIndex];
    
    if (!current.nextDialogueId) {
      return null;
    }
    
    // Find next dialogue by ID
    const nextIndex = this.config.dialogues.findIndex(d => d.id === current.nextDialogueId);
    if (nextIndex === -1) {
      return null;
    }
    
    this.currentDialogueIndex = nextIndex;
    return this.config.dialogues[nextIndex];
  }

  /**
   * Check if player can interact (within range)
   */
  public canInteract(playerPosition: THREE.Vector3, range: number = 3): boolean {
    const distance = this.config.position.distanceTo(playerPosition);
    return distance <= range;
  }

  /**
   * Get NPC name
   */
  public getName(): string {
    return this.config.name;
  }

  /**
   * Get current dialogue
   */
  public getCurrentDialogue(): Dialogue | null {
    return this.config.dialogues[this.currentDialogueIndex];
  }

  /**
   * Reset dialogue state
   */
  public resetDialogue() {
    this.currentDialogueIndex = 0;
  }

  /**
   * Cleanup
   */
  public dispose() {
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.mesh = null;
    }
  }
}

/**
 * Helper to create a simple villager NPC
 */
export function createVillager(
  name: string,
  position: THREE.Vector3,
  dialogues: Dialogue[],
  color: number = 0x4a90d9
): NPC {
  return new NPC({
    name,
    position,
    dialogues,
    modelColor: color
  });
}
