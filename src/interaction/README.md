# Interaction System - Phase 11 Player Interaction & Dialogue

## Overview
Detects nearby interactable NPCs and buildings, shows prompt, handles E to interact. Prioritizes NPCs over buildings when close.

## Modules

### InteractionSystem.ts
- **InteractableType enum:** NPC, BUILDING, NONE
- **Interactable interface:** type, id, name, distance, npc?, building?, prompt
- **Class InteractionSystem:** interactionRange 60px, currentInteractable, nearbyInteractables, totalInteractions
- **update(player, npcs, buildingManager):** Checks NPCs within range (skip INSIDE/SLEEPING), calculates distance, creates Interactable with prompt "Press E to talk to {name} ({role})". Checks buildings doors within range+20, prompt with occupied info. Sorts by distance, prioritizes NPC if within 40px or closer than building. Sets currentInteractable to closest.
- **Methods:** getCurrentInteractable, getNearbyInteractables, hasInteractable, canInteractWithNPC/Building, getInteractableNPC/Building, recordInteraction, getTotalInteractions, getInteractionRange/setRange, getDebugString
- **Prompt:** Shows at bottom center 400x30px, black bg, green border for NPC, blue for building, icon 💬 for NPC, 🏠 for building, text prompt.

## Integration

### Player Integration
- Player.update now takes isDialogueOpen bool, if true sets IDLE and returns (no movement during dialogue)
- Fixed bug: previously E key moved player right (isKeyDown('e') in moveX), now removed.

### Game Integration
- Field interactionSystem, showInteractionPrompt true
- Initialize: setInteractionRange 60px
- Update: interactionSystem.update(player, allNPCs, buildingManager) always, handleDialogueInput handles E/Enter to start dialogue when interactable present, records interaction
- Render: dialogueRenderer.renderInteractionPrompt before dialogue (so dialogue covers prompt)
- Debug: setInteractionInfo (hasInteractable, currentType/Id/Name, nearbyCount, totalInteractions, range, prompt)
- Controls: E/Enter to interact, O toggle interaction prompt, 1-4 teleport only when dialogue closed, pathfinding tests 5-9 only when dialogue closed

## Testing (Phase 11)
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
- Preserved Phase 10: life counts 5, needs valid, inventory valid, jobs valid, needs decay, eating restores, job production, wellbeing, critical, inventory add/remove → PASS
- Preserved Phase 9: time, schedules, full coverage, activities, paths, day phases, time scale, pause, schedule changes → PASS
- Preserved Phase 8: buildings, doors walkable, homes, paths to home, validation, etc → PASS
- Preserved Phase 7: pathfinding nearby, around building, across bridge, blocked, no path → PASS

## Controls (Phase 11 Interaction)
- **E / Enter** - Interact with closest NPC/building when prompt shows
- **O** - Toggle interaction prompt
- **1-4** - Choose dialogue option (when dialogue open)
- **ESC** - Close dialogue
- **F12** - Test dialogue with NPC001
- Previous: Q schedule debug (when dialogue closed), E+Shift clock, F overlay, ; needs, , inventory, . jobs, F10 boost 100%, F11 drain critical, etc
