# Roamerz - Living World Adventure Game

A 2D top-down living-world adventure where NPCs live independently.

## Phases

```
PHASE 1  — Project Foundation [COMPLETE]
PHASE 2  — World Map [COMPLETE]
PHASE 3  — Player Movement [COMPLETE]
PHASE 4  — Collision System [COMPLETE]
PHASE 5  — Camera System [COMPLETE]
PHASE 6  — NPC Foundation [COMPLETE]
PHASE 7  — NPC Pathfinding [COMPLETE]
PHASE 8  — NPC Homes & Buildings [COMPLETE]
PHASE 9  — Time & NPC Schedules [COMPLETE]
PHASE 10 — NPC Life Simulation [COMPLETE]
PHASE 11 — Player Interaction & Dialogue [CURRENT - COMPLETE]
PHASE 12 — Exploration & World Expansion
```

## Phase 11 - Player Interaction & Dialogue [CURRENT]

### Objective
Player can press E near NPC (60px, prioritize NPCs over buildings) to start dialogue; dialogue UI bottom box with NPC name, text, 1-4 choices; role-based dialogue trees data-driven with placeholders {playerName},{npcName},{time},{day},{phase},{wellbeing},{needs},{inventory},{job}; choices have conditions and actions; dialogue affects NPC needs (social++) and inventory gifts; building interaction prompt near door; while dialogue open player movement blocked, time pauses for conversation; interaction range debug, dialogue state debug.

### Interaction System
- **InteractionSystem**: range 60px (+20 buildings), nearbyInteractables sorted by distance, prioritize NPC if within 40px or closer than building, currentInteractable closest, totalInteractions, prompt "Press E to talk to {name} ({role})" or "Press E to enter {building}..." 
- **InteractableType**: NPC, BUILDING, NONE; Interactable {type,id,name,distance,npc?,building?,prompt}
- **Prompt UI**: bottom center 400x30px black bg, green border NPC blue building, icon 💬 NPC 🏠 building, text prompt centered
- **Game integration**: update player+NPCs+buildings, E/Enter to interact when prompt, recordInteraction, debug InteractionDebugInfo, O toggle prompt, teleports/path tests blocked when dialogue open
- **Player fix**: removed 'e' key from moveX right, added isDialogueOpen param to update early return IDLE blocks movement during dialogue

### Dialogue System
- **DialogueChoice**: id, text, nextNodeId null=end, condition {need,item,time{start,end},wellbeing}, action {giveItem,takeItem,restoreNeed{type,amount},setFlag,coins}, icon
- **DialogueNode**: id, speaker NPC|PLAYER, speakerName?, text, choices[], isEnd?, action {restoreNeed,giveItem,coins}
- **Dialogue**: id,npcId,npcName,role,startNodeId,nodes Map,flags?
- **DialogueBuilder**: createNode, createChoice, replacePlaceholders(text,context {playerName,npcName,role,time,day,phase,wellbeing,needs,inventory,job}) replaces {playerName},{npcName},{role},{time},{day},{phase},{wellbeing},{needs},{inventory},{job}
- **DialogueData.createDialogueForNPC**: role-based trees:
  - Farmer 🌾: start "Ah hello... {npcName}... {time} Day {day} {phase}... wellbeing {wellbeing}% feeling {needs}" Choices crops/grow/help/goodbye → crops (harvested {inventory}, work 6AM-5PM job progress), grow (produce CROP/FOOD inventory {inventory} trade tools), help (needs {needs} need WOOD), hard_work (job {role} purpose energy/happiness linked), sell (3 coins/h earned {inventory} shop HOUSE002), trade_tools (give CROP social++), needs (needs {needs} wellbeing {wellbeing}% explanation), bring_wood (produce every 10s progress), how_farm (farm at 15,31 pathfinding around buildings uses bridge)
  - Shopkeeper 🏪: "Welcome... {inventory}... wellbeing {wellbeing}% - {needs}" Choices sell/business/trade/goodbye → sell (FOOD/BREAD/POTION buy from farmer shop HOUSE002 8AM-6PM 8 coins/h inventory {inventory}), business (social high at square produce coins progress), trade (inventory {inventory} needs {needs}), need_food (FOOD eating restores hunger 25/s plus inventory), potions (restore health health decays if 2+ critical restores if energy/hunger >70), buy_food (FOOD if had coins social++ home HOUSE002 door 34,13), buy_bread (BREAD better than FOOD produce coins at shop building work location home building)
  - Blacksmith 🔨: "*clang* Ah visitor! {npcName}... {time}... wellbeing {wellbeing}% - {needs}... inventory {inventory}" Choices make/tool/forge/goodbye → make (TOOL from STONE/WOOD WORK at HOUSE003 7AM-6PM 6 coins/h costs 10 energy/h most tiring produce TOOL/COIN every 10s), tool (TOOL for 20 coins inventory {inventory} progress), forge (home HOUSE003 door 18,25 north sleep restores energy 15/s schedule SLEEP 0-5:30 etc), tiring (energy decays fastest happiness decays when low energy home visits count), bring_coins (need STONE/WOOD produce every 10s real regardless timeScale 60x 10s real=10min game pathfinding to front-of-door not inside BLOCKED)
  - Villager 👨: "Hello! {npcName}... {time} Day {day} {phase}... wellbeing {wellbeing}% - {needs}... {inventory}... help at farm and socialize at square!" Choices do/village/chat/goodbye → do (help farm 10-12 wander social 1-3PM square job VILLAGER WOOD/COIN 2 coins/h any location schedule WANDER/SOCIAL to keep social high), village (50x40 2000 tiles 1493 walkable 507 blocked 6 buildings 5 houses+1 shed square 25,20 river bridge 36-41,19), chat (social restores 10/s SOCIALIZING when 2 NPCs near <50px and socializing or at square interact gain social+happiness interactions count), nice (happiness affected by other needs restores at home/eating/socializing home HOUSE004 door 30,26 north), keep_talking (social higher gift FLOWERs sometimes inventory {inventory} FLOWERs for social gifts interactions increase)
  - Child 🧒: "Hi! {npcName} {role}! {time}! wellbeing {wellbeing}% - {needs}... {inventory} - lots of flowers! Want to play?" Choices play/where/flower/bye → play (PLAY restores happiness 1.5x job CHILD FLOWER 0 coins/h 3 happiness/h happiest job work(play) 8AM-5PM), where (square 25,20 wander 17-18:30 home HOUSE005 door 10,19 east 5x4 sleep 0-7 and 19:30-24 eat lunch at home 12-13), flower (FLOWER 🌸 for social gifts when NPCs interact gift flowers inventory {inventory} value 4 coins), fun (energy decays 7/h playing very active happiness increases needs {needs} wellbeing {wellbeing}%)
  - Generic: fallback about self role job {job} needs {needs} inventory {inventory} live in {home} schedule and needs decay
- **DialogueManager**: activeDialogue, currentNodeId, history[], totalDialogues/Choices, isOpen, currentNPC, context {playerName,time,day,phase,timeManager,lifeManager,buildingManager}, activeBuildingDialogue {buildingId,buildingName,text}|null, startDialogue(npc,context) gets lifeData needs/inventory/job/home builds context time/day/phase/wellbeing/needs debug inventory debug job debug home, creates dialogue via DialogueData.createDialogueForNPC, replacePlaceholders all nodes, sets speakerName, activeDialogue, currentNodeId=start, isOpen true, totalDialogues++, restores social 5 happiness 3 incrementSocialInteractions, startBuildingDialogue(buildingId,name,type,owner,occupied,occupant,context) text "Building: {name} ({type}) ID:{id} Owned by... Occupied... Time... This is a {type}... Doors are ROAD INTERACTABLE, house BLOCKED, path to front-of-door" sets activeBuildingDialogue isOpen true totalDialogues++, getCurrentNode if building returns building node 1 choice Close else activeDialogue.nodes.get(currentNodeId), makeChoice(choiceId) finds choice pushes history totalChoices++ logs handles actions restoreNeed/giveItem plus restoreSocial 2 if nextNodeId null endDialogue ended true else moves currentNodeId next handles node actions returns {ended,nextNode}, endDialogue clears, isOpen, getActiveDialogue, getCurrentNPC, getActiveBuildingDialogue, isBuildingDialogue, getTotalDialogues/Choices, getHistory, getDebugString
- **DialogueRenderer**: showInteractionPrompt true, renderInteractionPrompt(ctx,interactionSystem,screenW,screenH) if no interactable return box 400x30 bottom center screenH-80 bg rgba(0,0,0,0.8) border green NPC blue building prompt centered bold 12px icon 💬/🏠, renderDialogue(ctx,dialogueManager,screenW,screenH) if not open return currentNode dim full screen 0.5 box 600x400 center bottom screenH-420 bg rgba(20,20,30,0.95) border blue NPC green PLAYER speaker name bold 14px 🗣️ NPC 👤 You color #8cf/#8f8 dialogue text wrapped wrapText split words handle \n measureText maxWidth 12px white lines max 8 choicesStartY textY+lines*16+20 choiceHeight 30 spacing 5 choice bg rgba(50,50,70,0.8) border rgba(100,100,150,0.5) number #ff8 "1." icon white text #ddd truncated 50 chars instructions "Press 1-4 to choose, ESC to close" 9px #aaa centered bottom, wrapText splits words handles \n measures returns lines

### Integration Phase 11
- **Game**: fields interactionSystem, dialogueManager, dialogueRenderer, showInteractionPrompt true, initialize sets interaction range 60 logs ready, update timeManager.update only if !dialogue open (pauses time during dialogue), npcManager.update and lifeManager.update only if !dialogue open (pauses NPCs for conversation), interactionSystem.update always, handleDialogueInput ESC closes dialogue, 1-4 chooses when dialogue open, E/Enter starts dialogue when interactable (NPC → startDialogue with context playerName,time,day,phase,timeManager,lifeManager,buildingManager records interaction; BUILDING → startBuildingDialogue), teleports 1-4 and pathfinding tests 5-9 only when dialogue closed, render order world->NPCs->player->time overlay->clock->timeline->interaction prompt->dialogue->debug->help, debug setInteractionInfo/setDialogueInfo, help Phase 11 header shows interaction current type/name/distance and dialogue OPEN/CLOSED controls E/Enter 1-4 ESC O F12 Q etc
- **Player**: update now takes isDialogueOpen bool if true IDLE return no movement, fixed E key bug
- **DebugManager**: Phase 11 currentPhase='11', InteractionDebugInfo {hasInteractable,currentType,currentId,currentName,nearbyCount,totalInteractions,range,prompt} and DialogueDebugInfo {isOpen,isBuildingDialogue,activeNpcId/Name,currentNodeId,totalDialogues,totalChoices,historyCount,debug}, fields interactionInfo, dialogueInfo, setters, boxWidth 600, INTERACTION line yellow when hasInteractable with type/name/id nearby total range prompt, DIALOGUE line magenta when open with OPEN/CLOSED NPC/building node total choices history and instructions 1-4 ESC
- **Preserved Phase 10**: life counts 5 needs valid inventory valid jobs valid decay eating restores job production wellbeing critical inventory add/remove → PASS, Phase 9 time schedules full coverage activities paths day phases timeScale pause schedule changes → PASS, Phase 8 buildings doors walkable homes valid paths validation etc → PASS, Phase 7 pathfinding nearby around building across bridge blocked no path → PASS

### Tests (Phase 11)
- Test1 interaction range 60px → PASS
- Test2 nearby interactables count (depends on pos) → PASS (system works)
- Test3 dialogue initial closed → PASS
- Test4 start dialogue with NPC001 → PASS, current node id, speaker, text, choices
- Test5 make choice → PASS, ended/nextNode
- Test6 building dialogue → PASS
- Test7 total interactions >=0 → PASS
- Test8 total dialogues >0 after tests → PASS
- Test9 history entries >0 → PASS
- Test10 player blocked during dialogue → PASS
- Preserved Phase 10/9/8/7 → PASS (see above)

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 11)
- **E / Enter** - Interact with closest NPC/building when prompt shows (💬 Press E to talk to {name} ({role}))
- **1-4** - Choose dialogue option (when dialogue open)
- **ESC** - Close dialogue
- **O** - Toggle interaction prompt
- **F12** - Test dialogue with NPC001
- **Q** - Toggle schedule debug (when dialogue closed)
- **Shift+E** - Toggle clock, **F** - Toggle day/night overlay
- **; , .** - Toggle needs/inventory/jobs
- **WASD/Arrows** - Move player (blocked during dialogue)
- **C** - Center on player, **V** - Village
- **Z** - Zoom 1/1.5/0.75, **X** - Smoothing 5/0/10
- **K** - Collision overlay
- **N** - Toggle NPC paths, **M** - Toggle nav grid
- **J/L/U/I** - Building doors/labels/ownership/fronts
- **Space** - Pause/resume time (blocked when dialogue open), **= / +** - Faster x2 max 500x, **- / _** - Slower /2 min 1x, **]** - Advance 1 hour, **[** - Back 1 hour, **\** - Next phase
- **Y** - All go home, **F5-F8** - NPC1-4 go home, **F9** - Toggle schedules, **F10** - Boost all needs 100%, **F11** - Drain needs critical
- **T** - Run all Phase7+8+9+10+11 tests, **P** - Print time+NPC+building+schedule+life+interaction+dialogue, **O** - Toggle obstacle
- **5/6/7/8/9** - Pathfinding tests (blocked when dialogue open), **1/2/3/4** - Teleport (blocked when dialogue open)
- **G** - Grid, **B** - Tile coords, **` / F2 / D** - Debug, **H** - Help, **R** - Reset

### Architecture

```
src/
├── interaction/
│   ├── InteractionSystem.ts - range 60px, nearby sorted, prioritize NPC, currentInteractable, prompt, totalInteractions
│   └── README.md
├── dialogue/
│   ├── Dialogue.ts - DialogueChoice/Node/Dialogue, Builder replacePlaceholders
│   ├── DialogueData.ts - role-based trees farmer/shopkeeper/blacksmith/villager/child/generic with placeholders
│   ├── DialogueManager.ts - activeDialogue/currentNodeId/history, startDialogue dynamic context, building dialogue, makeChoice actions
│   ├── DialogueRenderer.ts - interaction prompt 400x30 bottom, dialogue box 600x400 dim + speaker + wrapped text + choices 1-4 + ESC
│   └── README.md
├── life/ - preserved Phase 10 (NeedType, NPCNeeds, NPCInventory, JobType, Job, LifeManager, LifeRenderer)
├── time/ - preserved Phase 9 (TimeManager, TimeRenderer)
├── schedule/ - preserved Phase 9 (ScheduleManager 5 schedules)
├── building/ - preserved Phase 8 (6 buildings, doors, ownership, occupancy)
├── core/Game.ts - + InteractionSystem/DialogueManager/Renderer, time/npc/life paused when dialogue open, E/Enter/ESC/1-4 handling, render prompt+dialogue top layer, debug interaction/dialogue, T runs Phase7+8+9+10+11
├── core/DebugManager.ts - + InteractionDebugInfo/DialogueDebugInfo, INTERACTION and DIALOGUE lines, Phase 11 boxWidth 600
├── player/Player.ts - + isDialogueOpen param blocks movement, fixed E key bug
├── npc/ - preserved with needs/inventory/job
├── pathfinding/ - preserved A*
├── world/ - 50x40 village
└── main.ts
```

### Previous Phases
- Phase 10: NPC Life Simulation - Needs 5 types decay/restore, Inventory 10 items role-based, Jobs 6 types produce every 10s, LifeManager eating/interactions, LifeRenderer bars
- Phase 9: Time & Schedules - TimeManager day phases, timeScale 60x, ScheduleManager 5 role schedules full coverage, NPC schedule changes
- Phase 8: 6 buildings, doors walkable, homes valid, paths to home, occupancy
- Phase 7: A* pathfinding, navigation grid, path request flow, failure handling WAITING retry, stuck detection, recalc limiting
- Phase 6: NPC foundation 5 NPCs A↔B, role colors
- Phase 5: Camera follow, clamp, smooth, zoom sync fixed
- Phase 4: Collision WALKABLE/BLOCKED/INTERACTABLE, AABB sliding
- Phase 3: Player 150px/s, 8-dir, IDLE/WALK, boundary
- Phase 2: Village 50x40, 8 terrain, square, houses, farm, river+bridge
- Phase 1: Game loop, renderer, input, debug

## Principles
Small changes, test before expanding, no unnecessary complexity, modular, data-driven, debug everything, placeholder graphics first
