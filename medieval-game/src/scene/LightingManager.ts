import * as THREE from 'three';

/**
 * LightingManager - Handles all scene lighting
 * Creates medieval atmosphere with day/torch lighting and shadows
 */

export interface LightingConfig {
  enableShadows: boolean;
  ambientIntensity: number;
  sunIntensity: number;
  torchIntensity: number;
}

const DEFAULT_CONFIG: LightingConfig = {
  enableShadows: true,
  ambientIntensity: 0.3,
  sunIntensity: 1.0,
  torchIntensity: 0.8
};

export class LightingManager {
  private scene: THREE.Scene;
  private config: LightingConfig;
  
  // Lights
  private ambientLight: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private torchLights: THREE.PointLight[] = [];
  
  // Day/night cycle
  private timeOfDay: number = 0.5; // 0-1, 0.5 = noon

  constructor(scene: THREE.Scene, config: Partial<LightingConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.setup();
  }

  private setup() {
    // Ambient light (sky illumination)
    this.ambientLight = new THREE.AmbientLight(0x404060, this.config.ambientIntensity);
    this.scene.add(this.ambientLight);
    
    // Sun/Directional light
    this.sunLight = new THREE.DirectionalLight(0xffffee, this.config.sunIntensity);
    this.sunLight.position.set(50, 100, 50);
    
    if (this.config.enableShadows) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 200;
      this.sunLight.shadow.camera.left = -50;
      this.sunLight.shadow.camera.right = 50;
      this.sunLight.shadow.camera.top = 50;
      this.sunLight.shadow.camera.bottom = -50;
    }
    
    this.scene.add(this.sunLight);
    
    // Enable shadows in renderer
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = this.config.enableShadows;
        child.receiveShadow = this.config.enableShadows;
      }
    });
  }

  /**
   * Add a torch/point light at position
   */
  public addTorch(position: THREE.Vector3): THREE.PointLight {
    const torch = new THREE.PointLight(0xffaa33, this.config.torchIntensity, 15);
    torch.position.copy(position);
    
    if (this.config.enableShadows) {
      torch.castShadow = true;
      torch.shadow.mapSize.width = 512;
      torch.shadow.mapSize.height = 512;
    }
    
    // Add slight flicker animation
    torch.userData.baseIntensity = this.config.torchIntensity;
    torch.userData.flickerSpeed = 0.02 + Math.random() * 0.03;
    torch.userData.flickerOffset = Math.random() * Math.PI * 2;
    
    this.scene.add(torch);
    this.torchLights.push(torch);
    
    return torch;
  }

  /**
   * Update lighting based on time of day
   * @param delta - Time since last frame
   */
  public update(delta: number) {
    // Slowly advance time
    this.timeOfDay += delta * 0.01; // Full cycle in ~100 seconds
    if (this.timeOfDay > 1) this.timeOfDay -= 1;
    
    // Update sun position and color based on time
    if (this.sunLight && this.ambientLight) {
      const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
      
      // Sun position
      this.sunLight.position.x = Math.cos(angle) * 100;
      this.sunLight.position.y = Math.sin(angle) * 100;
      
      // Color temperature changes
      const isDay = Math.sin(angle) > 0;
      const isSunset = Math.abs(angle) < 0.5 || Math.abs(angle - Math.PI) < 0.5;
      
      if (isDay) {
        this.sunLight.color.setHex(0xffffee);
        this.sunLight.intensity = this.config.sunIntensity;
        this.ambientLight.color.setHex(0x404060);
      } else if (isSunset) {
        this.sunLight.color.setHex(0xff8844);
        this.sunLight.intensity = this.config.sunIntensity * 0.5;
        this.ambientLight.color.setHex(0x604040);
      } else {
        this.sunLight.color.setHex(0x404060);
        this.sunLight.intensity = this.config.sunIntensity * 0.1;
        this.ambientLight.color.setHex(0x202040);
      }
    }
    
    // Flicker torch lights
    const time = performance.now() / 1000;
    this.torchLights.forEach(torch => {
      const flicker = Math.sin(time * torch.userData.flickerSpeed + torch.userData.flickerOffset);
      const flicker2 = Math.sin(time * torch.userData.flickerSpeed * 2.3 + torch.userData.flickerOffset);
      torch.intensity = torch.userData.baseIntensity * (0.9 + 0.1 * (flicker + flicker2));
    });
  }

  /**
   * Set specific time of day (0-1)
   */
  public setTimeOfDay(time: number) {
    this.timeOfDay = Math.max(0, Math.min(1, time));
  }

  /**
   * Get current sun direction for reference
   */
  public getSunDirection(): THREE.Vector3 {
    if (!this.sunLight) return new THREE.Vector3(0, 1, 0);
    return this.sunLight.position.clone().normalize();
  }

  /**
   * Cleanup
   */
  public dispose() {
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight = null;
    }
    
    if (this.sunLight) {
      this.scene.remove(this.sunLight);
      this.sunLight.dispose();
      this.sunLight = null;
    }
    
    this.torchLights.forEach(light => {
      this.scene.remove(light);
      // Safely dispose - check for shadow before accessing
      if (light.shadow) {
        light.shadow.dispose?.();
      }
      light.dispose();
    });
    this.torchLights = [];
  }
}
