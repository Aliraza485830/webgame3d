import * as THREE from 'three';
import { PlayerBody } from './PlayerPhysics';

/**
 * PlayerController - Handles player input and movement
 * Uses delta time for frame-rate independent movement
 */

export interface PlayerConfig {
  walkSpeed: number;
  runSpeed: number;
  rotationSpeed: number;
  cameraDistance: number;
  cameraHeight: number;
}

const DEFAULT_CONFIG: PlayerConfig = {
  walkSpeed: 5,
  runSpeed: 10,
  rotationSpeed: 8,
  cameraDistance: 8,
  cameraHeight: 4
};

export class PlayerController {
  private config: PlayerConfig;
  private body: PlayerBody;
  
  // Input state
  private keys: Map<string, boolean> = new Map();
  private mouseDown: boolean = false;
  
  // Camera
  private camera: THREE.Camera;
  private cameraAngle: number = 0;
  private cameraPitch: number = Math.PI / 6;
  
  // Player mesh for visual representation
  private mesh: THREE.Group | null = null;
  
  // Footstep timing
  private lastFootstepTime: number = 0;
  private footstepInterval: number = 0.5;

  constructor(body: PlayerBody, camera: THREE.Camera, config: Partial<PlayerConfig> = {}) {
    this.body = body;
    this.camera = camera;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.setupInput();
  }

  private setupInput() {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
      
      // Toggle run with Shift
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.body.setRunning(true);
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
      
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.body.setRunning(false);
      }
    });
    
    // Mouse input for camera
    document.addEventListener('mousemove', (e) => {
      if (this.mouseDown || true) { // Always allow mouse look
        const sensitivity = 0.002;
        this.cameraAngle -= e.movementX * sensitivity;
        this.cameraPitch -= e.movementY * sensitivity;
        
        // Clamp pitch to avoid flipping
        this.cameraPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 4, this.cameraPitch));
      }
    });
    
    // Mouse buttons
    document.addEventListener('mousedown', () => {
      this.mouseDown = true;
    });
    
    document.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
    
    // Lock pointer on click
    document.addEventListener('click', () => {
      document.body.requestPointerLock();
    });
  }

  public setMesh(mesh: THREE.Group) {
    this.mesh = mesh;
  }

  /**
   * Update player position based on input
   * Called every frame with delta time
   */
  public update(delta: number) {
    // Get input directions
    const forward = this.keys.get('KeyW') || this.keys.get('ArrowUp') ? 1 : 0;
    const backward = this.keys.get('KeyS') || this.keys.get('ArrowDown') ? 1 : 0;
    const left = this.keys.get('KeyA') || this.keys.get('ArrowLeft') ? 1 : 0;
    const right = this.keys.get('KeyD') || this.keys.get('ArrowRight') ? 1 : 0;
    
    // Calculate movement direction relative to camera
    const inputX = right - left;
    const inputZ = backward - forward;
    
    if (inputX !== 0 || inputZ !== 0) {
      // Normalize input
      const length = Math.sqrt(inputX * inputX + inputZ * inputZ);
      const normalizedX = inputX / length;
      const normalizedZ = inputZ / length;
      
      // Rotate input by camera angle
      const sin = Math.sin(this.cameraAngle);
      const cos = Math.cos(this.cameraAngle);
      
      const moveX = normalizedX * cos - normalizedZ * sin;
      const moveZ = normalizedX * sin + normalizedZ * cos;
      
      // Apply movement through physics body
      this.body.move(moveX, moveZ, delta);
      
      // Play footstep sounds
      const time = performance.now() / 1000;
      if (time - this.lastFootstepTime > this.footstepInterval) {
        this.lastFootstepTime = time;
      }
    }
    
    // Update camera position
    this.updateCamera(delta);
    
    // Sync mesh with physics body
    if (this.mesh) {
      const pos = this.body.getPosition();
      this.mesh.position.copy(pos);
      
      // Face movement direction
      const velocity = this.body.getVelocity();
      if (velocity.lengthSq() > 0.01) {
        const angle = Math.atan2(velocity.x, velocity.z);
        this.mesh.rotation.y = angle;
      }
    }
  }

  private updateCamera(delta: number) {
    const pos = this.body.getPosition();
    
    // Calculate camera target position
    const horizontalDist = this.config.cameraDistance * Math.cos(this.cameraPitch);
    const verticalDist = this.config.cameraDistance * Math.sin(this.cameraPitch) + this.config.cameraHeight;
    
    const targetX = pos.x - horizontalDist * Math.sin(this.cameraAngle);
    const targetY = pos.y + verticalDist;
    const targetZ = pos.z - horizontalDist * Math.cos(this.cameraAngle);
    
    // Smooth camera follow
    const lerpFactor = 10 * delta;
    this.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), lerpFactor);
    
    // Look at player
    const lookTarget = new THREE.Vector3(pos.x, pos.y + 1.5, pos.z);
    this.camera.lookAt(lookTarget);
  }

  public getPosition(): THREE.Vector3 {
    return this.body.getPosition();
  }

  public getCameraAngle(): number {
    return this.cameraAngle;
  }

  /**
   * Cleanup
   */
  public dispose() {
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
  }
}
