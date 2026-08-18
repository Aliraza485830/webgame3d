import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PlayerBody } from './player/PlayerPhysics';
import { PlayerController } from './player/PlayerController';
import { WorldBuilder } from './scene/WorldBuilder';
import { LightingManager } from './scene/LightingManager';
import { NPC, createVillager } from './npc/NPC';
import { Enemy } from './npc/Enemy';
import { LoadingScreen } from './ui/LoadingScreen';
import { HUD } from './ui/HUD';
import { DialogueBox, type DialogueData } from './ui/DialogueBox';
import { useGameStore } from './utils/GameStore';
import { audioManager } from './utils/AudioManager';

/**
 * Main Game Component - Integrates all systems
 */

export const Game: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dialogue, setDialogue] = useState<DialogueData | null>(null);
  
  // Game state refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const physicsWorldRef = useRef<CANNON.World | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);
  const lightingManagerRef = useRef<LightingManager | null>(null);
  const npcsRef = useRef<NPC[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  
  const setIsLoading = useGameStore((state) => state.setLoading);
  const setQuest = useGameStore((state) => state.setQuest);
  const addToInventory = useGameStore((state) => state.addToInventory);
  const completeQuest = useGameStore((state) => state.completeQuest);
  const activeQuest = useGameStore((state) => state.activeQuest);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 50, 150);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Renderer setup with shadow support
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Physics world setup
    const physicsWorld = new CANNON.World();
    physicsWorld.gravity.set(0, -9.82, 0);
    physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld);
    physicsWorld.allowSleep = true;
    physicsWorldRef.current = physicsWorld;

    // Build the world
    const worldBuilder = new WorldBuilder(scene, physicsWorld);
    worldBuilder.build();

    // Setup lighting
    const lightingManager = new LightingManager(scene);
    lightingManagerRef.current = lightingManager;

    // Add torches for atmosphere
    const torchPositions = [
      new THREE.Vector3(-6, 3, -15),
      new THREE.Vector3(6, 3, -15),
      new THREE.Vector3(0, 4, -25),
      new THREE.Vector3(-12, 3, -30),
      new THREE.Vector3(12, 3, -30)
    ];
    torchPositions.forEach(pos => lightingManager.addTorch(pos));

    // Create player
    const playerBody = new PlayerBody(physicsWorld, new THREE.Vector3(0, 3, 5));
    const playerController = new PlayerController(playerBody, camera);
    
    // Create player visual mesh
    const playerMesh = createPlayerMesh();
    scene.add(playerMesh);
    playerController.setMesh(playerMesh);
    playerControllerRef.current = playerController;

    // Create NPCs
    const elderNPC = createVillager(
      'Elder Thomas',
      new THREE.Vector3(2, 0, -25),
      [
        {
          id: 'greeting',
          text: 'Greetings, traveler! Our village has been plagued by a foul beast lurking near the castle. Would you help us?',
          nextDialogueId: 'quest_offer'
        },
        {
          id: 'quest_offer',
          text: 'Defeat the enemy guarding the castle entrance and I shall reward you handsomely.',
          nextDialogueId: 'quest_given',
          givesQuest: {
            id: 'defeat_enemy',
            title: 'Clear the Castle',
            description: 'The Elder has asked you to defeat the enemy near the castle.',
            objective: 'Defeat the castle guardian'
          }
        },
        {
          id: 'quest_given',
          text: 'Return once the beast is vanquished.',
          nextDialogueId: 'quest_given'
        },
        {
          id: 'quest_complete',
          text: 'You have done it! The village is safe once more. Take this as a token of our gratitude.',
          nextDialogueId: 'farewell',
          givesItem: { id: 'gold_pouch', name: 'Gold Pouch', icon: '💰' }
        },
        {
          id: 'farewell',
          text: 'Safe travels, hero!',
          nextDialogueId: 'farewell'
        }
      ],
      0x4a90d9
    );

    const elderMesh = elderNPC.createMesh();
    scene.add(elderMesh);
    npcsRef.current.push(elderNPC);

    // Create enemy near castle
    const enemy = new Enemy({
      position: new THREE.Vector3(0, 0, -55),
      detectionRange: 15,
      attackRange: 2.5,
      damage: 10,
      health: 100,
      speed: 3,
      patrolPoints: [
        new THREE.Vector3(-5, 0, -55),
        new THREE.Vector3(5, 0, -55),
        new THREE.Vector3(0, 0, -50),
        new THREE.Vector3(0, 0, -60)
      ]
    });

    const enemyMesh = enemy.createMesh();
    scene.add(enemyMesh);
    enemiesRef.current.push(enemy);

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Simulate loading progress
    let progress = 0;
    const loadInterval = setInterval(() => {
      progress += 5;
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(loadInterval);
        setIsLoading(false);
        
        // Start ambient audio
        audioManager.resume();
        audioManager.playAmbient();
      }
    }, 100);

    // Interaction state
    let currentNPC: NPC | null = null;
    let inDialogue = false;

    // Check for interactions
    const checkInteractions = () => {
      if (inDialogue) return;

      const playerPos = playerController.getPosition();

      // Check NPC interactions
      for (const npc of npcsRef.current) {
        if (npc.canInteract(playerPos, 3)) {
          currentNPC = npc;
          return;
        }
      }
      currentNPC = null;
    };

    // Handle interaction input
    const handleInteraction = () => {
      if (!currentNPC || inDialogue) return;

      audioManager.playDialogueOpen();
      
      const dialogueResult = currentNPC.startDialogue();
      if (dialogueResult) {
        inDialogue = true;
        setDialogue({
          npcName: currentNPC.getName(),
          text: dialogueResult.text,
          hasMore: !!dialogueResult.nextDialogueId
        });

        // Handle quest/item giving
        if (dialogueResult.givesQuest) {
          setQuest({
            id: dialogueResult.givesQuest.id,
            title: dialogueResult.givesQuest.title,
            description: dialogueResult.givesQuest.description,
            completed: false,
            objective: dialogueResult.givesQuest.objective
          });
        }
      }
    };

    // Handle dialogue advance/close
    const advanceOrCloseDialogue = () => {
      if (!currentNPC) return;

      const nextDialogue = currentNPC.advanceDialogue();
      
      if (nextDialogue) {
        setDialogue({
          npcName: currentNPC.getName(),
          text: nextDialogue.text,
          hasMore: !!nextDialogue.nextDialogueId
        });

        // Handle quest completion
        if (nextDialogue.givesItem && activeQuest?.id === 'defeat_enemy') {
          completeQuest('defeat_enemy');
          addToInventory(nextDialogue.givesItem);
          audioManager.playPickup();
        }
      } else {
        setDialogue(null);
        inDialogue = false;
        currentNPC = null;
      }
    };

    // Keyboard handler for interaction
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        if (!inDialogue) {
          handleInteraction();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Attack handler
    const handleClick = () => {
      if (inDialogue) return;

      audioManager.playSwordSwing();

      // Check if attacking enemy
      const playerPos = playerController.getPosition();
      for (const enemy of enemiesRef.current) {
        if (!enemy.isAlive()) continue;

        const enemyPos = enemy.getPosition();
        const distance = playerPos.distanceTo(enemyPos);

        if (distance < 4) {
          const killed = enemy.takeDamage(35);
          audioManager.playHit();

          if (killed) {
            console.log('Enemy defeated!');
            // Update quest
            if (activeQuest?.id === 'defeat_enemy') {
              setDialogue({
                npcName: 'System',
                text: 'Enemy defeated! Return to Elder Thomas for your reward.',
                hasMore: false
              });
              setTimeout(() => setDialogue(null), 2000);
            }
          }
        }
      }
    };

    document.addEventListener('click', handleClick);

    // Also close dialogue on click
    const handleDialogueClick = () => {
      if (inDialogue) {
        advanceOrCloseDialogue();
      }
    };
    document.addEventListener('click', handleDialogueClick);

    // Animation loop
    let lastTime = performance.now();
    let frameCount = 0;
    let footstepTimer = 0;

    const animate = () => {
      requestAnimationFrame(animate);

      const currentTime = performance.now();
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap delta
      lastTime = currentTime;

      // Update physics
      physicsWorld.step(1 / 60, delta, 3);

      // Update player
      if (!inDialogue && playerControllerRef.current) {
        playerControllerRef.current.update(delta);

        // Footstep sounds
        const velocity = playerBody.getVelocity();
        if (velocity.lengthSq() > 0.5) {
          footstepTimer += delta;
          if (footstepTimer > 0.5) {
            footstepTimer = 0;
            audioManager.playFootstep();
          }
        }
      }

      // Update lighting
      if (lightingManagerRef.current) {
        lightingManagerRef.current.update(delta);
      }

      // Update enemies
      enemiesRef.current.forEach(enemy => {
        if (enemy.isAlive()) {
          enemy.update(delta, playerController.getPosition());
        }
      });

      // Check interactions
      checkInteractions();

      // Render
      renderer.render(scene, camera);

      frameCount++;
    };

    animate();

    // Cleanup
    return () => {
      clearInterval(loadInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('click', handleDialogueClick);

      // Dispose Three.js resources
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();

      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      // Cleanup game objects
      playerController.dispose();
      playerBody.dispose();
      lightingManagerRef.current?.dispose();
      worldBuilder.dispose();
      npcsRef.current.forEach(npc => npc.dispose());
      enemiesRef.current.forEach(enemy => enemy.dispose());

      audioManager.stopAmbient();
    };
  }, [setIsLoading, setQuest, addToInventory, completeQuest, activeQuest]);

  const handleCloseDialogue = () => {
    setDialogue(null);
  };

  return (
    <>
      <div ref={containerRef} style={styles.container} />
      <LoadingScreen progress={loadingProgress} />
      <HUD />
      <DialogueBox dialogue={dialogue} onClose={handleCloseDialogue} />
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    height: '100vh',
    margin: 0,
    padding: 0,
    overflow: 'hidden'
  }
};

/**
 * Create simple player character mesh
 */
function createPlayerMesh(): THREE.Group {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.4, 1, 8, 16);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x3366cc,
    roughness: 0.7
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

  return group;
}

export default Game;
