import * as THREE from 'three';

/**
 * Enemy - Simple AI enemy with patrol and attack behavior
 */

export const EnemyState = {
  IDLE: 'idle',
  PATROL: 'patrol',
  CHASE: 'chase',
  ATTACK: 'attack'
} as const;

export type EnemyStateType = typeof EnemyState[keyof typeof EnemyState];

export interface EnemyConfig {
  position: THREE.Vector3;
  patrolPoints?: THREE.Vector3[];
  detectionRange: number;
  attackRange: number;
  damage: number;
  health: number;
  speed: number;
}

export class Enemy {
  private config: EnemyConfig;
  private mesh: THREE.Group | null = null;
  private state: EnemyStateType = EnemyState.PATROL;
  private currentPatrolIndex: number = 0;
  private health: number;
  private lastAttackTime: number = 0;
  private attackCooldown: number = 1.5; // seconds

  constructor(config: EnemyConfig) {
    this.config = config;
    this.health = config.health;
    
    // Default patrol points if none provided
    if (!config.patrolPoints || config.patrolPoints.length === 0) {
      this.config.patrolPoints = [
        config.position.clone(),
        config.position.clone().add(new THREE.Vector3(5, 0, 0)),
        config.position.clone().add(new THREE.Vector3(5, 0, 5)),
        config.position.clone().add(new THREE.Vector3(0, 0, 5))
      ];
    }
  }

  /**
   * Check if enemy can attack (for Game.tsx to use)
   */
  public canAttack(): boolean {
    const time = performance.now() / 1000;
    return time - this.lastAttackTime >= this.attackCooldown;
  }

  /**
   * Create the visual representation of the enemy
   */
  public createMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Body (red/orange for enemy)
    const bodyGeo = new THREE.CapsuleGeometry(0.45, 1.2, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xcc4444,
      roughness: 0.6,
      metalness: 0.2,
      emissive: 0x330000,
      emissiveIntensity: 0.2
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 1;
    bodyMesh.castShadow = true;
    group.add(bodyMesh);
    
    // Head with glowing eyes
    const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x883333,
      roughness: 0.5
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.9;
    headMesh.castShadow = true;
    group.add(headMesh);
    
    // Eyes (glowing)
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.8
    });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, 1.95, 0.3);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15, 1.95, 0.3);
    group.add(rightEye);
    
    // Weapon (simple sword)
    const swordGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
    const swordMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.2
    });
    const swordMesh = new THREE.Mesh(swordGeo, swordMat);
    swordMesh.position.set(0.5, 1.2, 0.3);
    swordMesh.rotation.x = Math.PI / 4;
    group.add(swordMesh);
    
    // Position
    group.position.copy(this.config.position);
    
    this.mesh = group;
    return group;
  }

  /**
   * Update enemy AI
   * @param delta - Time since last frame
   * @param playerPosition - Current player position
   */
  public update(delta: number, playerPosition: THREE.Vector3): void {
    if (!this.mesh) return;
    
    const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
    
    // State machine
    switch (this.state) {
      case EnemyState.IDLE:
        this.updateIdle(delta, playerPosition, distanceToPlayer);
        break;
      case EnemyState.PATROL:
        this.updatePatrol(delta, playerPosition, distanceToPlayer);
        break;
      case EnemyState.CHASE:
        this.updateChase(delta, playerPosition);
        break;
      case EnemyState.ATTACK:
        this.updateAttack(delta, playerPosition);
        break;
    }
    
    // Face movement direction or player
    if (this.mesh.userData.velocity && this.mesh.userData.velocity.lengthSq() > 0.01) {
      const angle = Math.atan2(
        this.mesh.userData.velocity.x,
        this.mesh.userData.velocity.z
      );
      this.mesh.rotation.y = angle;
    }
  }

  private updateIdle(_delta: number, _playerPosition: THREE.Vector3, distance: number) {
    // Check if player is in range
    if (distance <= this.config.detectionRange) {
      this.state = EnemyState.CHASE;
      return;
    }
    
    // Randomly switch to patrol
    if (Math.random() < 0.01) {
      this.state = EnemyState.PATROL;
    }
  }

  private updatePatrol(delta: number, _playerPosition: THREE.Vector3, distance: number) {
    // Check if player is in range
    if (distance <= this.config.detectionRange) {
      this.state = EnemyState.CHASE;
      return;
    }
    
    if (!this.mesh || !this.config.patrolPoints) return;
    
    const targetPoint = this.config.patrolPoints[this.currentPatrolIndex];
    const direction = new THREE.Vector3()
      .subVectors(targetPoint, this.mesh.position)
      .normalize();
    
    direction.y = 0; // Keep on ground
    
    const distanceToTarget = this.mesh.position.distanceTo(targetPoint);
    
    if (distanceToTarget < 1) {
      // Reached patrol point, move to next
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.config.patrolPoints.length;
    } else {
      // Move towards target
      this.mesh.position.add(direction.multiplyScalar(this.config.speed * 0.5 * delta));
      this.mesh.userData.velocity = direction.clone();
    }
  }

  private updateChase(delta: number, playerPosition: THREE.Vector3) {
    if (!this.mesh) return;
    
    const distance = this.mesh.position.distanceTo(playerPosition);
    
    // Check if player escaped
    if (distance > this.config.detectionRange * 1.5) {
      this.state = EnemyState.PATROL;
      return;
    }
    
    // Check if in attack range
    if (distance <= this.config.attackRange) {
      this.state = EnemyState.ATTACK;
      return;
    }
    
    // Move towards player
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.mesh.position)
      .normalize();
    
    direction.y = 0;
    this.mesh.position.add(direction.multiplyScalar(this.config.speed * delta));
    this.mesh.userData.velocity = direction.clone();
  }

  private updateAttack(_delta: number, playerPosition: THREE.Vector3) {
    const time = performance.now() / 1000;
    
    // Check if player is still in range
    if (!this.mesh) return;
    
    const distance = this.mesh.position.distanceTo(playerPosition);
    if (distance > this.config.attackRange * 1.5) {
      this.state = EnemyState.CHASE;
      return;
    }
    
    // Attack cooldown
    if (time - this.lastAttackTime >= this.attackCooldown) {
      this.performAttack();
      this.lastAttackTime = time;
    }
    
    // Face player
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.mesh.position);
    direction.y = 0;
    if (direction.lengthSq() > 0.01) {
      this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }
  }

  private performAttack() {
    // Animation placeholder - would trigger attack animation
    console.log('Enemy attacks!');
  }

  /**
   * Deal damage to the enemy
   */
  public takeDamage(amount: number): boolean {
    this.health -= amount;
    return this.health <= 0;
  }

  /**
   * Check if enemy is alive
   */
  public isAlive(): boolean {
    return this.health > 0;
  }

  /**
   * Get current health
   */
  public getHealth(): number {
    return this.health;
  }

  /**
   * Get enemy position
   */
  public getPosition(): THREE.Vector3 {
    return this.mesh?.position.clone() || this.config.position.clone();
  }

  /**
   * Get mesh for scene
   */
  public getMesh(): THREE.Group | null {
    return this.mesh;
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
