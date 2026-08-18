import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * WorldBuilder - Creates the medieval game environment
 * Generates terrain, buildings, props with proper collision
 */

export interface WorldObjects {
  meshes: THREE.Mesh[];
  colliders: CANNON.Body[];
}

export class WorldBuilder {
  private scene: THREE.Scene;
  private world: CANNON.World;
  
  // Material cache for performance
  private materials: Map<string, THREE.MeshStandardMaterial> = new Map();

  constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
    this.scene = scene;
    this.world = physicsWorld;
    
    this.createMaterials();
  }

  private createMaterials() {
    // Stone material (paths, castle)
    this.materials.set('stone', new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1
    }));
    
    // Wood material (buildings, props)
    this.materials.set('wood', new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.0
    }));
    
    // Grass material (ground)
    this.materials.set('grass', new THREE.MeshStandardMaterial({
      color: 0x3d7a3d,
      roughness: 1.0,
      metalness: 0.0
    }));
    
    // Roof material
    this.materials.set('roof', new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.7,
      metalness: 0.0
    }));
    
    // Castle wall material
    this.materials.set('castle', new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.85,
      metalness: 0.15
    }));
  }

  /**
   * Build the complete medieval village
   */
  public build(): WorldObjects {
    const objects: WorldObjects = {
      meshes: [],
      colliders: []
    };
    
    // Ground plane
    this.createGround(objects);
    
    // Village buildings
    this.createVillage(objects);
    
    // Castle/keep
    this.createCastle(objects);
    
    // Props and decorations
    this.createProps(objects);
    
    return objects;
  }

  private createGround(objects: WorldObjects) {
    // Visual ground
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = this.materials.get('grass')!;
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);
    objects.meshes.push(groundMesh);
    
    // Physics ground
    const groundBody = new CANNON.Body({
      mass: 0, // Static
      shape: new CANNON.Box(new CANNON.Vec3(100, 0.1, 100)),
      position: new CANNON.Vec3(0, -0.1, 0)
    });
    this.world.addBody(groundBody);
    objects.colliders.push(groundBody);
    
    // Stone path
    this.createPath(objects, new THREE.Vector3(0, 0.01, 0), 4, 80);
  }

  private createPath(objects: WorldObjects, position: THREE.Vector3, width: number, length: number) {
    const pathGeo = new THREE.PlaneGeometry(width, length);
    const pathMat = this.materials.get('stone')!;
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.copy(position);
    pathMesh.receiveShadow = true;
    this.scene.add(pathMesh);
    objects.meshes.push(pathMesh);
    
    // Physics for path
    const pathBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(width / 2, 0.01, length / 2)),
      position: new CANNON.Vec3(position.x, 0.01, position.z)
    });
    this.world.addBody(pathBody);
    objects.colliders.push(pathBody);
  }

  private createVillage(objects: WorldObjects) {
    // Create several small huts along the path
    const hutPositions = [
      new THREE.Vector3(-8, 0, -15),
      new THREE.Vector3(8, 0, -15),
      new THREE.Vector3(-10, 0, -30),
      new THREE.Vector3(10, 0, -30),
      new THREE.Vector3(-6, 0, -45),
      new THREE.Vector3(6, 0, -45)
    ];
    
    hutPositions.forEach((pos, index) => {
      this.createHut(objects, pos, index % 2 === 0);
    });
  }

  private createHut(objects: WorldObjects, position: THREE.Vector3, flip: boolean) {
    const hutWidth = 6;
    const hutDepth = 6;
    const hutHeight = 4;
    
    // Hut base (walls)
    const wallsGeo = new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth);
    const wallsMat = this.materials.get('wood')!;
    const wallsMesh = new THREE.Mesh(wallsGeo, wallsMat);
    wallsMesh.position.set(position.x, hutHeight / 2, position.z);
    wallsMesh.castShadow = true;
    wallsMesh.receiveShadow = true;
    this.scene.add(wallsMesh);
    objects.meshes.push(wallsMesh);
    
    // Physics walls
    const wallsBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(hutWidth / 2, hutHeight / 2, hutDepth / 2)),
      position: new CANNON.Vec3(position.x, hutHeight / 2, position.z)
    });
    this.world.addBody(wallsBody);
    objects.colliders.push(wallsBody);
    
    // Roof
    const roofGeo = new THREE.ConeGeometry(hutWidth * 0.8, 3, 4);
    const roofMat = this.materials.get('roof')!;
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(position.x, hutHeight + 1.5, position.z);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.castShadow = true;
    this.scene.add(roofMesh);
    objects.meshes.push(roofMesh);
  }

  private createCastle(objects: WorldObjects) {
    const castleZ = -70;
    
    // Main keep
    const keepSize = 15;
    const keepHeight = 20;
    
    const keepGeo = new THREE.BoxGeometry(keepSize, keepHeight, keepSize);
    const keepMat = this.materials.get('castle')!;
    const keepMesh = new THREE.Mesh(keepGeo, keepMat);
    keepMesh.position.set(0, keepHeight / 2, castleZ);
    keepMesh.castShadow = true;
    keepMesh.receiveShadow = true;
    this.scene.add(keepMesh);
    objects.meshes.push(keepMesh);
    
    // Physics keep
    const keepBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(keepSize / 2, keepHeight / 2, keepSize / 2)),
      position: new CANNON.Vec3(0, keepHeight / 2, castleZ)
    });
    this.world.addBody(keepBody);
    objects.colliders.push(keepBody);
    
    // Towers
    const towerPositions = [
      new THREE.Vector3(-keepSize / 2, 0, castleZ - keepSize / 2),
      new THREE.Vector3(keepSize / 2, 0, castleZ - keepSize / 2),
      new THREE.Vector3(-keepSize / 2, 0, castleZ + keepSize / 2),
      new THREE.Vector3(keepSize / 2, 0, castleZ + keepSize / 2)
    ];
    
    towerPositions.forEach(pos => {
      this.createTower(objects, pos, 12);
    });
    
    // Castle gate (open area)
    const gateGeo = new THREE.BoxGeometry(6, 8, 2);
    const gateMat = this.materials.get('wood')!;
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.set(0, 4, castleZ + keepSize / 2 + 1);
    this.scene.add(gateMesh);
    objects.meshes.push(gateMesh);
  }

  private createTower(objects: WorldObjects, position: THREE.Vector3, height: number) {
    const radius = 3;
    
    const towerGeo = new THREE.CylinderGeometry(radius, radius * 1.1, height, 8);
    const towerMat = this.materials.get('castle')!;
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.set(position.x, height / 2, position.z);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    this.scene.add(towerMesh);
    objects.meshes.push(towerMesh);
    
    // Physics tower
    const towerBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(radius, radius * 1.1, height, 8),
      position: new CANNON.Vec3(position.x, height / 2, position.z)
    });
    this.world.addBody(towerBody);
    objects.colliders.push(towerBody);
  }

  private createProps(objects: WorldObjects) {
    // Trees around the village
    const treePositions = [
      new THREE.Vector3(-20, 0, -10),
      new THREE.Vector3(20, 0, -10),
      new THREE.Vector3(-25, 0, -40),
      new THREE.Vector3(25, 0, -40),
      new THREE.Vector3(-15, 0, -60),
      new THREE.Vector3(15, 0, -60)
    ];
    
    treePositions.forEach(pos => {
      this.createTree(objects, pos);
    });
    
    // Well in the village center
    this.createWell(objects, new THREE.Vector3(0, 0, -25));
    
    // Crates and barrels
    this.createCrates(objects, new THREE.Vector3(5, 0, -20));
  }

  private createTree(objects: WorldObjects, position: THREE.Vector3) {
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 6);
    const trunkMat = this.materials.get('wood')!;
    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    trunkMesh.position.set(position.x, 1.5, position.z);
    trunkMesh.castShadow = true;
    this.scene.add(trunkMesh);
    objects.meshes.push(trunkMesh);
    
    // Physics trunk
    const trunkBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(0.3, 0.5, 3, 6),
      position: new CANNON.Vec3(position.x, 1.5, position.z)
    });
    this.world.addBody(trunkBody);
    objects.colliders.push(trunkBody);
    
    // Foliage
    const foliageGeo = new THREE.ConeGeometry(2, 4, 6);
    const foliageMat = this.materials.get('grass')!;
    const foliageMesh = new THREE.Mesh(foliageGeo, foliageMat);
    foliageMesh.position.set(position.x, 5, position.z);
    foliageMesh.castShadow = true;
    this.scene.add(foliageMesh);
    objects.meshes.push(foliageMesh);
  }

  private createWell(objects: WorldObjects, position: THREE.Vector3) {
    const wellRadius = 1.5;
    const wellHeight = 1.2;
    
    const wellGeo = new THREE.CylinderGeometry(wellRadius, wellRadius * 0.9, wellHeight, 8);
    const wellMat = this.materials.get('stone')!;
    const wellMesh = new THREE.Mesh(wellGeo, wellMat);
    wellMesh.position.set(position.x, wellHeight / 2, position.z);
    wellMesh.castShadow = true;
    this.scene.add(wellMesh);
    objects.meshes.push(wellMesh);
    
    // Physics well
    const wellBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(wellRadius, wellRadius * 0.9, wellHeight, 8),
      position: new CANNON.Vec3(position.x, wellHeight / 2, position.z)
    });
    this.world.addBody(wellBody);
    objects.colliders.push(wellBody);
  }

  private createCrates(objects: WorldObjects, position: THREE.Vector3) {
    for (let i = 0; i < 3; i++) {
      const crateSize = 1;
      const crateGeo = new THREE.BoxGeometry(crateSize, crateSize, crateSize);
      const crateMat = this.materials.get('wood')!;
      const crateMesh = new THREE.Mesh(crateGeo, crateMat);
      crateMesh.position.set(
        position.x + i * 1.2,
        crateSize / 2,
        position.z
      );
      crateMesh.castShadow = true;
      this.scene.add(crateMesh);
      objects.meshes.push(crateMesh);
      
      // Physics crate
      const crateBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(crateSize / 2, crateSize / 2, crateSize / 2)),
        position: new CANNON.Vec3(
          position.x + i * 1.2,
          crateSize / 2,
          position.z
        )
      });
      this.world.addBody(crateBody);
      objects.colliders.push(crateBody);
    }
  }

  /**
   * Cleanup - dispose of all geometries and materials
   */
  public dispose() {
    this.materials.forEach(mat => mat.dispose());
    this.materials.clear();
  }
}
