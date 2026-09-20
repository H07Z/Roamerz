# Dialogue System - Phase 11 Player Interaction & Dialogue

## Overview
Data-driven dialogue trees per NPC role, dynamic placeholders replaced with current time, wellbeing, needs, inventory, job. Player chooses 1-4, ESC to close, dialogue affects NPC needs/social.

## Modules

### Dialogue.ts
- **DialogueChoice interface:** id, text, nextNodeId null=end, condition? {need, item, time {start,end}, wellbeing}, action? {giveItem, takeItem, restoreNeed {type,amount}, setFlag, coins}, icon?
- **DialogueNode interface:** id, speaker 'NPC'|'PLAYER', speakerName?, text, choices DialogueChoice[], isEnd?, action? {restoreNeed, giveItem, coins}
- **Dialogue interface:** id, npcId, npcName, role, startNodeId, nodes Map<string,DialogueNode>, flags? Map<string,boolean>
- **DialogueBuilder:** createNode, createChoice, replacePlaceholders(text, context {playerName,npcName,role,time,day,phase,wellbeing,needs,inventory,job}) replaces {playerName}, {npcName}, {role}, {time}, {day}, {phase}, {wellbeing}, {needs}, {inventory}, {job}

### DialogueData.ts
- **DialogueData.createDialogueForNPC(npcId, npcName, role, context):** Routes to role-specific creator:
  - **Farmer:** start "Ah, hello... I'm {npcName}... It's {time} Day {day}, {phase}... wellbeing {wellbeing}% and I'm feeling {needs}." Choices: crops, grow, help, goodbye. Nodes: crops (harvested {inventory}, work 6AM-5PM, job progress), grow (produce CROP/FOOD, inventory {inventory}, trade tools), help (needs {needs}, need WOOD), hard_work (job {role} purpose, energy/happiness linked), sell (3 coins/h, earned {inventory}, shop HOUSE002), trade_tools (give CROP, social increases), needs (needs {needs} wellbeing {wellbeing}% explanation), bring_wood (produce every 10s, progress bar), how_farm (farm at 15,31, pathfinding around buildings uses bridge, wait/retry)
  - **Shopkeeper:** start "Welcome to my shop!... I have {inventory}... wellbeing {wellbeing}% - {needs}." Choices: sell, business, trade, goodbye. Nodes: sell (FOOD/BREAD/POTION, buy from farmer, shop home HOUSE002 work 8AM-6PM 8 coins/h inventory {inventory}), business (social high at square, produce coins, progress bar), trade (inventory {inventory} needs {needs}), need_food (FOOD, eating restores hunger 25/s plus inventory), potions (restore health, health decays if 2+ critical, restores if energy/hunger >70), buy_food (FOOD if had coins, social increases, home HOUSE002 door 34,13), buy_bread (BREAD better than FOOD, produce coins at shop building, work location home building)
  - **Blacksmith:** start "*clang clang* Ah, visitor!... I'm {npcName}... It's {time}... wellbeing {wellbeing}% - {needs}... inventory {inventory}." Choices: make, tool, forge, goodbye. Nodes: make (TOOL from STONE/WOOD, WORK at HOUSE003 7AM-6PM 6 coins/h costs 10 energy/h most tiring, produce TOOL/COIN every 10s), tool (TOOL for 20 coins, inventory {inventory}, progress bar), forge (home HOUSE003 door 18,25 north, sleep restores energy 15/s, schedule SLEEP 0-5:30 etc), tiring (energy decays fastest, happiness decays when low energy, home visits count), bring_coins (need STONE/WOOD, produce every 10s real regardless timeScale, 60x 10s real=10min game, pathfinding to front-of-door not inside BLOCKED)
  - **Villager:** start "Hello! I'm {npcName}... It's {time} Day {day}, {phase}... wellbeing {wellbeing}% - {needs}... I have {inventory}... help at farm and socialize at square!" Choices: do, village, chat, goodbye. Nodes: do (help farm 10-12, wander, social 1-3PM square, job VILLAGER WOOD/COIN 2 coins/h any location, schedule WANDER/SOCIAL to keep social high), village (50x40 2000 tiles 1493 walkable 507 blocked, 6 buildings 5 houses+1 shed, square 25,20, river bridge 36-41,19), chat (social restores 10/s SOCIALIZING, when 2 NPCs near <50px and socializing or at square interact gain social+happiness, interactions count), nice (happiness affected by other needs, restores at home/eating/socializing, home HOUSE004 door 30,26 north), keep_talking (social higher, gift FLOWERs sometimes, inventory {inventory} FLOWERs for social gifts, interactions increase)
  - **Child:** start "Hi! I'm {npcName}, I'm a {role}! It's {time}! wellbeing {wellbeing}% - {needs}... I have {inventory} - lots of flowers! Want to play?" Choices: play, where, flower, bye. Nodes: play (PLAY restores happiness 1.5x, job CHILD FLOWER 0 coins/h 3 happiness/h happiest job, work(play) 8AM-5PM), where (square 25,20 wander 17-18:30, home HOUSE005 door 10,19 east 5x4, sleep 0-7 and 19:30-24 eat lunch at home 12-13), flower (FLOWER 🌸 for social gifts, when NPCs interact gift flowers, inventory {inventory} value 4 coins), fun (energy decays 7/h playing very active, happiness increases, needs {needs} wellbeing {wellbeing}%)
  - **Generic:** fallback with about self (role, job {job}, needs {needs}, inventory {inventory}, live in {home}, schedule and needs decay)

### DialogueManager.ts
- **Class DialogueManager:** activeDialogue Dialogue|null, currentNodeId, dialogueHistory {dialogueId,nodeId,choiceId,timestamp}[], totalDialogues, totalChoices, isDialogueOpen, currentNPC, context DialogueContext {playerName,time,day,phase,timeManager,lifeManager,buildingManager}, activeBuildingDialogue {buildingId,buildingName,text}|null
- **startDialogue(npc, context):** Gets lifeData needs/inventory/job/home, creates dialogueContext {time,day,phase,wellbeing,needs debug, inventory debug, job debug, home}, creates dialogue via DialogueData.createDialogueForNPC, replaces placeholders in all nodes with playerName,npcName,role,time,day,phase,wellbeing,needs,inventory,job, sets speakerName=npc.name, sets activeDialogue, currentNodeId=start, isOpen true, totalDialogues++, restores social 5 and happiness 3 for NPC, incrementSocialInteractions
- **startBuildingDialogue(buildingId,buildingName,buildingType,ownerId,occupied,occupantId,context):** Creates text "Building: {name} ({type}) ID: {id} Owned by... Occupied... Time... This is a {type}... Doors are ROAD INTERACTABLE, house BLOCKED, path to front-of-door", sets activeBuildingDialogue, isOpen true, totalDialogues++
- **getCurrentNode():** If building dialogue returns building node with 1 choice Close, else returns activeDialogue.nodes.get(currentNodeId)
- **makeChoice(choiceId):** Finds choice in currentNode, pushes history, totalChoices++, logs, handles actions: if currentNPC and lifeManager, restoreNeed, giveItem, plus restoreSocial 2, checks if nextNodeId null → endDialogue ended true, else moves currentNodeId to next, handles node actions, returns {ended, nextNode}
- **endDialogue():** Clears activeDialogue, currentNodeId, activeBuildingDialogue, isOpen false, currentNPC null
- **Methods:** isOpen, getActiveDialogue, getCurrentNPC, getActiveBuildingDialogue, isBuildingDialogue, getTotalDialogues/Choices, getHistory, getDebugString

### DialogueRenderer.ts
- **Class DialogueRenderer:** showInteractionPrompt true, setShowInteractionPrompt
- **renderInteractionPrompt(ctx, interactionSystem, screenWidth, screenHeight):** If no interactable return, box 400x30px at screenWidth/2-200, screenHeight-80, bg rgba(0,0,0,0.8), border green NPC blue building, prompt text centered bold 12px, icon 💬 NPC 🏠 building at x+15
- **renderDialogue(ctx, dialogueManager, screenWidth, screenHeight):** If not open return, currentNode, dim full screen rgba(0,0,0,0.5), dialogue box 600x400px at center bottom (screenWidth/2-300, screenHeight-420), bg rgba(20,20,30,0.95), border blue NPC green PLAYER, speaker name bold 14px 🗣️ NPC 👤 You with color #8cf/#8f8, dialogue text wrapped via wrapText (split words, handle \n, measureText maxWidth), 12px white, lines max 8, choicesStartY = textY+lines*16+20, choiceHeight 30 spacing 5, choice bg rgba(50,50,70,0.8) border rgba(100,100,150,0.5), number #ff8 "1.", icon white, text #ddd truncated 50 chars, instructions "Press 1-4 to choose, ESC to close" 9px #aaa centered bottom
- **wrapText:** Splits words, handles \n, measures, returns lines
- **renderDebug:** Shows Dialogue OPEN/CLOSED, Total dialogues/choices, Debug string, History count

## Integration

### Game Integration
- Fields: interactionSystem, dialogueManager, dialogueRenderer, showInteractionPrompt true
- Initialize: creates InteractionSystem, DialogueManager, DialogueRenderer, sets interaction range 60px, logs interaction and dialogue ready
- Update: timeManager.update only if dialogue not open (pauses time during dialogue), npcManager.update and lifeManager.update only if dialogue not open (pauses NPCs during dialogue for conversation), interactionSystem.update always, handleDialogueInput handles E/Enter to start dialogue when interactable present (NPC → startDialogue with context playerName,time,day,phase,timeManager,lifeManager,buildingManager, records interaction; BUILDING → startBuildingDialogue with building id,name,type,owner,occupied, records), dialogue choices 1-4 and ESC handled, teleport and pathfinding tests 5-9 only when dialogue closed
- Render: interaction prompt before dialogue (dialogue covers prompt), dialogue top layer, debug, help
- Debug: setInteractionInfo and setDialogueInfo
- Controls: E/Enter interact, 1-4 choose, ESC close, O toggle interaction prompt, F12 test dialogue NPC001, Q schedule debug only when dialogue closed, Shift+E clock toggle, F overlay, etc
- Help: Phase 11 header, shows interaction current type/name/distance and dialogue OPEN/CLOSED, controls E/Enter, 1-4, ESC, O, F12, etc

### Player Integration
- Player.update now takes isDialogueOpen bool, if true sets IDLE and returns (no movement during dialogue)
- Fixed bug: previously E key moved player right (isKeyDown('e') in moveX), now removed.

### DebugManager
- Phase 11: currentPhase='11', InteractionDebugInfo (hasInteractable, currentType/Id/Name, nearbyCount, totalInteractions, range, prompt) and DialogueDebugInfo (isOpen, isBuildingDialogue, activeNpcId/Name, currentNodeId, totalDialogues, totalChoices, historyCount, debug), fields interactionInfo, dialogueInfo, setters, boxWidth 600, INTERACTION line with type/name/id nearby total range prompt, DIALOGUE line with OPEN/CLOSED NPC/building node total choices history and instructions

## Testing (Phase 11)

- Test1 interaction range 60px → PASS
- Test2 nearby interactables (depends on player pos) → PASS
- Test3 dialogue initial closed → PASS
- Test4 start dialogue NPC001 → PASS, current node id/speaker/text/choices
- Test5 make choice → PASS, ended/nextNode
- Test6 building dialogue → PASS
- Test7 total interactions >=0 → PASS
- Test8 total dialogues >0 after tests → PASS
- Test9 history entries >0 → PASS
- Test10 player blocked during dialogue → PASS (dialogue open)
- Preserved Phase 10: life counts 5, needs valid, inventory valid, jobs valid, needs decay, eating restores, job production, wellbeing, critical, inventory add/remove → PASS
- Preserved Phase 9: time, schedules, full coverage, activities, paths, day phases, time scale, pause, schedule changes → PASS
- Preserved Phase 8: buildings, doors walkable, homes, paths to home, validation, etc → PASS
- Preserved Phase 7: pathfinding nearby, around building, across bridge, blocked, no path → PASS

## Controls (Phase 11)
- **E / Enter** - Interact with closest NPC/building when prompt shows (💬 Press E to talk to {name} ({role}))
- **1-4** - Choose dialogue option (when dialogue open)
- **ESC** - Close dialogue
- **O** - Toggle interaction prompt
- **F12** - Test dialogue with NPC001
- **Q** - Toggle schedule debug (when dialogue closed)
- **Shift+E** - Toggle clock, **F** - Toggle day/night overlay
- **; , .** - Toggle needs/inventory/jobs
- **F10** - Boost all needs 100%, **F11** - Drain critical
- **T** - Run all Phase7+8+9+10+11 tests, **P** - Print all states
- **N/M/J/L/U/I/Y/F5-F8/F9** - Previous debug
- **1-4 teleport, 5-9 path tests** - Only when dialogue closed
- **G/B/`/F2/D/H/R** - General debug
