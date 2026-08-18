import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * PlayerPhysics - Physics body for the player character
 * Handles collision detection and movement through Cannon.js
 */

export class PlayerBody {
  private world: CANNON.World;
  private body: CANNON.Body;
  private isRunning: boolean = false;
  
  // Movement parameters
  private walkSpeed: number = 5;
  private runSpeed: number = 10;
  private acceleration: number = 30;
  
  // Ground check
  private canJump: boolean = false;
  private groundContact: boolean = false;

  constructor(world: CANNON.World, startPosition: THREE.Vector3) {
    this.world = world;
    
    // Create physics body (capsule-like using sphere for simplicity)
    const shape = new CANNON.Sphere(0.5);
    this.body = new CANNON.Body({
      mass: 70, // kg
      position: new CANNON.Vec3(startPosition.x, startPosition.y, startPosition.z),
      linearDamping: 0.9,
      angularDamping: 1.0,
      fixedRotation: true
    });
    
    this.body.addShape(shape);
    this.body.linearDamping = 0.9;
    
    // Prevent rotation (keep player upright)
    this.body.angularFactor.set(0, 0, 0);
    
    this.world.addBody(this.body);
    
    // Setup ground contact detection
    this.setupGroundContact();
  }

  private setupGroundContact() {
    // Create a contact material for the player
    const playerMaterial = new CANNON.Material('player');
    this.body.material = playerMaterial;
    
    // Contact behavior
    const playerGroundContact = new CANNON.ContactMaterial(
      playerMaterial,
      new CANNON.Material(),
      {
        friction: 0.0,
        restitution: 0.0
      }
    );
    
    this.world.addContactMaterial(playerGroundContact);
  }

  /**
   * Move the player in the given direction
   * @param x - Horizontal direction (-1 to 1)
   * @param z - Vertical direction (-1 to 1)
   * @param delta - Time since last frame
   */
  public move(x: number, z: number, delta: number) {
    const speed = this.isRunning ? this.runSpeed : this.walkSpeed;
    
    // Apply velocity directly for responsive controls
    const targetVelX = x * speed;
    const targetVelZ = z * speed;
    
    // Smooth acceleration
    const currentVel = this.body.velocity;
    const lerpFactor = Math.min(1, this.acceleration * delta);
    
    currentVel.x += (targetVelX - currentVel.x) * lerpFactor;
    currentVel.z += (targetVelZ - currentVel.z) * lerpFactor;
    
    // Keep Y velocity (gravity) intact
    this.body.velocity.set(currentVel.x, currentVel.y, currentVel.z);
  }

  public setRunning(running: boolean) {
    this.isRunning = running;
  }

  public getPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
  }

  public getVelocity(): THREE.Vector3 {
    return new THREE.Vector3(
      this.body.velocity.x,
      this.body.velocity.y,
      this.body.velocity.z
    );
  }

  public teleport(position: THREE.Vector3) {
    this.body.position.set(position.x, position.y, position.z);
    this.body.velocity.set(0, 0, 0);
  }

  public isOnGround(): boolean {
    // Simple ground check - if y velocity is near zero and we're low
    return Math.abs(this.body.velocity.y) < 0.1 && this.groundContact;
  }

  /**
   * Get the Cannon body for external interactions
   */
  public getCannonBody(): CANNON.Body {
    return this.body;
  }

  /**
   * Cleanup - remove from physics world
   */
  public dispose() {
    this.world.removeBody(this.body);
  }
}
