# Medieval Quest - 3D Web Game

A production-quality, interactive 3D web-based game set in a medieval fantasy world.

## Quick Start

```bash
cd medieval-game
npm install
npm run dev
```

Then open your browser to the URL shown (typically `http://localhost:5173`).

## Controls

| Action | Key/Button |
|--------|------------|
| Move | WASD or Arrow Keys |
| Look Around | Mouse |
| Run | Shift |
| Interact | E |
| Attack | Left Click |

## Game Features

### Core Gameplay
- **Third-person character controller** with smooth camera follow
- **Physics-based collision detection** - you can't walk through walls or objects
- **Medieval village environment** with huts, castle, trees, and props
- **Day/night lighting cycle** with dynamic shadows
- **Atmospheric torch lighting** with flicker effects

### Quest System
1. Talk to **Elder Thomas** (standing near the well at position 2, 0, -25)
2. Accept the quest to defeat the enemy guarding the castle
3. Find and attack the enemy near the castle entrance (click when close)
4. Return to Elder Thomas for your reward

### NPC Interaction
- Approach NPCs and press **E** to interact
- Dialogue system with typewriter effect
- Quests and rewards tied to dialogue progression

### Combat
- One enemy type with patrol AI
- Enemy detects player within range and gives chase
- Click to attack when in range (35 damage per hit, 3 hits to defeat)

### Audio
- Procedural ambient background music (medieval atmosphere)
- Sound effects for: footsteps, sword swings, hits, pickups, dialogue

## Project Structure

```
src/
├── Game.tsx              # Main game component integrating all systems
├── player/
│   ├── PlayerController.ts   # Input handling and camera control
│   └── PlayerPhysics.ts      # Physics body using Cannon.js
├── scene/
│   ├── WorldBuilder.ts       # Environment generation (buildings, props)
│   └── LightingManager.ts    # Day/night cycle and torch lights
├── npc/
│   ├── NPC.ts                # Non-player characters with dialogue
│   └── Enemy.ts              # Enemy AI with state machine
├── ui/
│   ├── LoadingScreen.tsx     # Loading overlay
│   ├── DialogueBox.tsx       # NPC conversation UI
│   └── HUD.tsx               # Quest tracker and inventory
├── utils/
│   ├── GameStore.ts          # Zustand state management
│   └── AudioManager.ts       # Procedural audio synthesis
├── App.tsx                   # React app entry
└── main.tsx                  # DOM render entry
```

## Extending the Game

### Adding a New NPC

```typescript
import { createVillager, Dialogue } from './npc/NPC';

const dialogues: Dialogue[] = [
  {
    id: 'greeting',
    text: 'Hello traveler!',
    nextDialogueId: 'farewell'
  },
  {
    id: 'farewell',
    text: 'Safe journeys!',
    nextDialogueId: 'farewell'
  }
];

const newNPC = createVillager(
  'Merchant',                    // Name
  new THREE.Vector3(5, 0, -20),  // Position
  dialogues,                      // Dialogues
  0x44aa44                        // Color (green for merchant)
);

scene.add(newNPC.createMesh());
npcsRef.current.push(newNPC);
```

### Adding a New Quest

In the NPC's dialogue, add a `givesQuest` property:

```typescript
{
  id: 'quest_offer',
  text: 'Can you help me find my lost sword?',
  nextDialogueId: 'quest_given',
  givesQuest: {
    id: 'find_sword',
    title: 'The Lost Sword',
    description: 'Find the merchant\'s sword somewhere in the village.',
    objective: 'Locate the missing weapon'
  }
}
```

Then complete it with:
```typescript
completeQuest('find_sword');
addToInventory({ id: 'sword', name: 'Rusty Sword', icon: '⚔️' });
```

### Adding a New Area

Edit `WorldBuilder.ts` and add a new method:

```typescript
private createForest(objects: WorldObjects) {
  // Add trees, rocks, etc.
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    this.createTree(objects, new THREE.Vector3(x, 0, z));
  }
}
```

Call it in `build()`:
```typescript
this.createForest(objects);
```

### Adding More Enemies

```typescript
import { Enemy } from './npc/Enemy';

const boss = new Enemy({
  position: new THREE.Vector3(0, 0, -80),
  detectionRange: 20,
  attackRange: 3,
  damage: 25,
  health: 300,
  speed: 2.5,
  patrolPoints: [...]
});

scene.add(boss.createMesh());
enemiesRef.current.push(boss);
```

## Tech Stack

- **Rendering:** Three.js
- **Physics:** Cannon-es
- **Language:** TypeScript
- **Bundler:** Vite
- **State Management:** Zustand
- **UI:** React with inline styles

## Performance Notes

- Shadow map sizes are tuned for quality/performance balance
- Pixel ratio capped at 2 for high-DPI displays
- Physics step fixed at 60Hz with delta capping
- Delta time used for all movement (frame-rate independent)

## Browser Compatibility

Works on any modern browser with WebGL support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

For lower-end devices, the game automatically:
- Reduces shadow quality
- Caps pixel ratio
- Uses simpler geometry where possible

## License

All assets are procedurally generated or use open-license primitives.
No copyrighted content is included.
