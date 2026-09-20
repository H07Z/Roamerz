/**
 * DialogueData - Phase 11 Player Interaction & Dialogue
 * Creates role-based dialogues with dynamic content
 */

import { Dialogue, DialogueNode, DialogueBuilder } from './Dialogue';

export class DialogueData {
  static createDialogueForNPC(
    npcId: string,
    npcName: string,
    role: string,
    context?: {
      time?: string;
      day?: number;
      phase?: string;
      wellbeing?: number;
      needs?: string;
      inventory?: string;
      job?: string;
      home?: string;
    }
  ): Dialogue {
    const lowerRole = role.toLowerCase();
    
    if (lowerRole.includes('farmer')) {
      return this.createFarmerDialogue(npcId, npcName, role, context);
    } else if (lowerRole.includes('shop')) {
      return this.createShopkeeperDialogue(npcId, npcName, role, context);
    } else if (lowerRole.includes('blacksmith')) {
      return this.createBlacksmithDialogue(npcId, npcName, role, context);
    } else if (lowerRole.includes('villager')) {
      return this.createVillagerDialogue(npcId, npcName, role, context);
    } else if (lowerRole.includes('child')) {
      return this.createChildDialogue(npcId, npcName, role, context);
    } else {
      return this.createGenericDialogue(npcId, npcName, role, context);
    }
  }

  private static createFarmerDialogue(
    npcId: string,
    npcName: string,
    role: string,
    context?: any
  ): Dialogue {
    const nodes = new Map<string, DialogueNode>();

    nodes.set('start', DialogueBuilder.createNode(
      'start',
      'NPC',
      `Ah, hello there! I'm {npcName}, the farmer. It's {time} on Day {day}, {phase} phase. The crops are growing well today! My wellbeing is {wellbeing}% and I'm feeling {needs}.`,
      [
        DialogueBuilder.createChoice('1', 'How are the crops doing?', 'crops', '🌾'),
        DialogueBuilder.createChoice('2', 'What do you grow?', 'grow', '🌱'),
        DialogueBuilder.createChoice('3', 'Can I help at the farm?', 'help', '🤝'),
        DialogueBuilder.createChoice('4', 'Goodbye!', null, '👋')
      ],
      npcName
    ));

    nodes.set('crops', DialogueBuilder.createNode(
      'crops',
      'NPC',
      `The crops are doing great! I've harvested {inventory} so far. Farming is hard work - I work from 6AM to 5PM. I have {job} progress today. The farm is at the north fields.`,
      [
        DialogueBuilder.createChoice('1', 'That sounds like hard work!', 'hard_work', '💪'),
        DialogueBuilder.createChoice('2', 'Do you sell your crops?', 'sell', '🪙'),
        DialogueBuilder.createChoice('3', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('grow', DialogueBuilder.createNode(
      'grow',
      'NPC',
      `I grow wheat, corn, and vegetables! The village depends on my farm. I produce CROP and FOOD. My inventory: {inventory}. Want to trade? I could use some tools!`,
      [
        DialogueBuilder.createChoice('1', 'I have tools to trade!', 'trade_tools', '🔨', undefined, { giveItem: 'CROP' }),
        DialogueBuilder.createChoice('2', 'What do you need?', 'needs', '❓'),
        DialogueBuilder.createChoice('3', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('help', DialogueBuilder.createNode(
      'help',
      'NPC',
      `You want to help? That's kind! Farming restores my happiness but costs energy. I'm currently at {needs}. If you bring me WOOD, I can build more farm plots!`,
      [
        DialogueBuilder.createChoice('1', 'I\'ll bring wood!', 'bring_wood', '🪵'),
        DialogueBuilder.createChoice('2', 'How does farming work?', 'how_farm', '❓'),
        DialogueBuilder.createChoice('3', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('hard_work', DialogueBuilder.createNode(
      'hard_work',
      'NPC',
      `It is! But I love it. My job as {role} gives me purpose. Working makes me tired but happy. My energy and happiness are linked - when I'm tired, I'm less happy. Take care of yourself too!`,
      [
        DialogueBuilder.createChoice('1', 'Thanks for the advice!', null, '😊')
      ],
      npcName,
      true
    ));

    nodes.set('sell', DialogueBuilder.createNode(
      'sell',
      'NPC',
      `Yes! I sell to the shopkeeper. 3 coins per hour of work. I've earned some coins - {inventory}. The shopkeeper in HOUSE002 buys my crops.`,
      [
        DialogueBuilder.createChoice('1', 'Good to know!', null, '👍')
      ],
      npcName,
      true
    ));

    nodes.set('trade_tools', DialogueBuilder.createNode(
      'trade_tools',
      'NPC',
      `Wonderful! Here's some fresh crops for you! (You received CROP) My social need increases when I talk to people. Thanks for chatting!`,
      [
        DialogueBuilder.createChoice('1', 'Thank you!', null, '🙏', undefined, { restoreNeed: { type: 'SOCIAL', amount: 10 } })
      ],
      npcName,
      true
    ));

    nodes.set('needs', DialogueBuilder.createNode(
      'needs',
      'NPC',
      `Right now: {needs}. My wellbeing is {wellbeing}%. I need energy (sleep), hunger (eat), social (talk), happiness (play/social), health (overall). When I'm critical, I go home or eat!`,
      [
        DialogueBuilder.createChoice('1', 'I see!', null, '💡')
      ],
      npcName,
      true
    ));

    nodes.set('bring_wood', DialogueBuilder.createNode(
      'bring_wood',
      'NPC',
      `Thank you! Wood helps me build. My job produces crops over time - every 10 seconds of work I produce something. Check my progress bar when I'm farming!`,
      [
        DialogueBuilder.createChoice('1', 'I\'ll be back!', null, '👋')
      ],
      npcName,
      true
    ));

    nodes.set('how_farm', DialogueBuilder.createNode(
      'how_farm',
      'NPC',
      `I go to the farm at 15,31 tile. Pathfinding finds the way around buildings and uses the bridge. If blocked, I wait and retry. My schedule says FARM from 6-12 and 13-17.`,
      [
        DialogueBuilder.createChoice('1', 'Interesting!', null, '🤔')
      ],
      npcName,
      true
    ));

    return {
      id: `dialogue_${npcId}`,
      npcId,
      npcName,
      role,
      startNodeId: 'start',
      nodes
    };
  }

  private static createShopkeeperDialogue(
    npcId: string,
    npcName: string,
    role: string,
    context?: any
  ): Dialogue {
    const nodes = new Map<string, DialogueNode>();

    nodes.set('start', DialogueBuilder.createNode(
      'start',
      'NPC',
      `Welcome to my shop! I'm {npcName}, the {role}. It's {time}, Day {day}. I have {inventory} in stock. My wellbeing is {wellbeing}% - {needs}. How can I help?`,
      [
        DialogueBuilder.createChoice('1', 'What do you sell?', 'sell', '🏪'),
        DialogueBuilder.createChoice('2', 'How is business?', 'business', '📈'),
        DialogueBuilder.createChoice('3', 'Can I trade?', 'trade', '🤝'),
        DialogueBuilder.createChoice('4', 'Goodbye!', null, '👋')
      ],
      npcName
    ));

    nodes.set('sell', DialogueBuilder.createNode(
      'sell',
      'NPC',
      `I sell FOOD, BREAD, POTION, and more! I buy crops from the farmer. My shop is my home HOUSE002. I work 8AM-6PM, 8 coins per hour. My inventory: {inventory}.`,
      [
        DialogueBuilder.createChoice('1', 'I need food!', 'need_food', '🍎', undefined, { takeItem: 'COIN', giveItem: 'FOOD' }),
        DialogueBuilder.createChoice('2', 'What about potions?', 'potions', '🧪'),
        DialogueBuilder.createChoice('3', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('business', DialogueBuilder.createNode(
      'business',
      'NPC',
      `Business is good! I interact with many people at the square, so my social need stays high. I produce coins when working. My job progress bar shows when I'm about to earn!`,
      [
        DialogueBuilder.createChoice('1', 'Nice!', null, '😊')
      ],
      npcName,
      true
    ));

    nodes.set('trade', DialogueBuilder.createNode(
      'trade',
      'NPC',
      `Sure! I have {inventory}. Trading restores social and happiness. My current needs: {needs}. What would you like?`,
      [
        DialogueBuilder.createChoice('1', 'Buy FOOD for 5 coins', 'buy_food', '🍎', { item: 'COIN' }, { takeItem: 'COIN', giveItem: 'FOOD' }),
        DialogueBuilder.createChoice('2', 'Buy BREAD for 10 coins', 'buy_bread', '🍞', { item: 'COIN' }, { takeItem: 'COIN', giveItem: 'BREAD' }),
        DialogueBuilder.createChoice('3', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('need_food', DialogueBuilder.createNode(
      'need_food',
      'NPC',
      `Here's some food! (FOOD) Eating restores hunger 25 per second plus extra if you have food in inventory. My hunger system makes me eat at noon at the square!`,
      [
        DialogueBuilder.createChoice('1', 'Thank you!', null, '🙏', undefined, { restoreNeed: { type: 'HUNGER', amount: 15 } })
      ],
      npcName,
      true
    ));

    nodes.set('potions', DialogueBuilder.createNode(
      'potions',
      'NPC',
      `Potions restore health! Health decays if 2+ needs are critical, restores if energy and hunger >70. My health is important for overall wellbeing!`,
      [
        DialogueBuilder.createChoice('1', 'I see!', null, '💡')
      ],
      npcName,
      true
    ));

    nodes.set('buy_food', DialogueBuilder.createNode(
      'buy_food',
      'NPC',
      `Here's your FOOD! (If you had coins) My social increases when I trade. Thanks for your business! Come back anytime. My home is HOUSE002, door at 34,13.`,
      [
        DialogueBuilder.createChoice('1', 'Thanks!', null, '👋')
      ],
      npcName,
      true
    ));

    nodes.set('buy_bread', DialogueBuilder.createNode(
      'buy_bread',
      'NPC',
      `Fresh BREAD! BREAD restores hunger better than FOOD. I produce coins when working at my shop building. My work location is my home building!`,
      [
        DialogueBuilder.createChoice('1', 'Yum!', null, '😋')
      ],
      npcName,
      true
    ));

    return {
      id: `dialogue_${npcId}`,
      npcId,
      npcName,
      role,
      startNodeId: 'start',
      nodes
    };
  }

  private static createBlacksmithDialogue(
    npcId: string,
    npcName: string,
    role: string,
    context?: any
  ): Dialogue {
    const nodes = new Map<string, DialogueNode>();

    nodes.set('start', DialogueBuilder.createNode(
      'start',
      'NPC',
      `*clang clang* Ah, a visitor! I'm {npcName}, the {role}. It's {time}. My forge is hot! Wellbeing {wellbeing}% - {needs}. My inventory: {inventory}. What do you need?`,
      [
        DialogueBuilder.createChoice('1', 'What do you make?', 'make', '🔨'),
        DialogueBuilder.createChoice('2', 'Can you make me a tool?', 'tool', '🛠️'),
        DialogueBuilder.createChoice('3', 'How is the forge?', 'forge', '🔥'),
        DialogueBuilder.createChoice('4', 'Goodbye!', null, '👋')
      ],
      npcName
    ));

    nodes.set('make', DialogueBuilder.createNode(
      'make',
      'NPC',
      `I make TOOLs! I need STONE and WOOD. My job: WORK at building HOUSE003 from 7AM-6PM, 6 coins per hour, but costs 10 energy per hour - most tiring job! I produce TOOL and COIN every 10 seconds of work.`,
      [
        DialogueBuilder.createChoice('1', 'That sounds tiring!', 'tiring', '😓'),
        DialogueBuilder.createChoice('2', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('tool', DialogueBuilder.createNode(
      'tool',
      'NPC',
      `I can make a TOOL for 20 coins! Tools help farmers and villagers. My current inventory: {inventory}. My work progress bar shows when I'm about to produce!`,
      [
        DialogueBuilder.createChoice('1', 'I\'ll bring coins!', 'bring_coins', '🪙'),
        DialogueBuilder.createChoice('2', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('forge', DialogueBuilder.createNode(
      'forge',
      'NPC',
      `The forge is my home HOUSE003, door at 18,25 north facing. I go home to sleep - sleeping restores energy 15 per second! My schedule: SLEEP 0-5:30, HOME 5:30-7, WORK 7-12, EAT 12-13, WORK 13-18, SOCIAL 18-19:30, HOME 19:30-20:30, INSIDE 20:30-24.`,
      [
        DialogueBuilder.createChoice('1', 'That\'s a long day!', null, '😮')
      ],
      npcName,
      true
    ));

    nodes.set('tiring', DialogueBuilder.createNode(
      'tiring',
      'NPC',
      `It is! That's why my energy decays fastest. When energy is low, happiness also decays. I need to sleep well! My home visits count shows how often I go home.`,
      [
        DialogueBuilder.createChoice('1', 'Take care!', null, '🙏')
      ],
      npcName,
      true
    ));

    nodes.set('bring_coins', DialogueBuilder.createNode(
      'bring_coins',
      'NPC',
      `Great! Bring STONE and WOOD too. My job produces every 10 seconds of real time work, regardless of timeScale. At 60x scale, 10 sec real = 10 min game. My pathfinding goes to front-of-door, not inside house tiles which are BLOCKED!`,
      [
        DialogueBuilder.createChoice('1', 'Understood!', null, '👍')
      ],
      npcName,
      true
    ));

    return {
      id: `dialogue_${npcId}`,
      npcId,
      npcName,
      role,
      startNodeId: 'start',
      nodes
    };
  }

  private static createVillagerDialogue(
    npcId: string,
    npcName: string,
    role: string,
    context?: any
  ): Dialogue {
    const nodes = new Map<string, DialogueNode>();

    nodes.set('start', DialogueBuilder.createNode(
      'start',
      'NPC',
      `Hello! I'm {npcName}, a {role}. It's {time} Day {day}, {phase}. My wellbeing is {wellbeing}% - {needs}. I have {inventory}. I help at the farm and socialize at the square!`,
      [
        DialogueBuilder.createChoice('1', 'What do you do?', 'do', '❓'),
        DialogueBuilder.createChoice('2', 'How is village life?', 'village', '🏘️'),
        DialogueBuilder.createChoice('3', 'Want to chat?', 'chat', '💬'),
        DialogueBuilder.createChoice('4', 'Goodbye!', null, '👋')
      ],
      npcName
    ));

    nodes.set('do', DialogueBuilder.createNode(
      'do',
      'NPC',
      `I help at the farm 10AM-12PM, wander morning and afternoon, socialize 1-3PM at square. My job VILLAGER produces WOOD and COIN, 2 coins per hour, work at any location. My schedule has WANDER and SOCIAL to keep social need high!`,
      [
        DialogueBuilder.createChoice('1', 'That sounds nice!', 'nice', '😊'),
        DialogueBuilder.createChoice('2', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('village', DialogueBuilder.createNode(
      'village',
      'NPC',
      `Village life is peaceful! 50x40 tiles, 2000 total, 1493 walkable, 507 blocked. We have 6 buildings, 5 houses + 1 shed. The square at 25,20 is where we meet. The river has a bridge at 36-41,19!`,
      [
        DialogueBuilder.createChoice('1', 'Cool!', null, '👍')
      ],
      npcName,
      true
    ));

    nodes.set('chat', DialogueBuilder.createNode(
      'chat',
      'NPC',
      `Sure! Chatting restores social need 10 per second when SOCIALIZING. When two NPCs are near (<50px) and socializing or at square, they interact and both gain social + happiness! My interactions count: check debug.`,
      [
        DialogueBuilder.createChoice('1', 'Let\'s keep talking!', 'keep_talking', '💬', undefined, { restoreNeed: { type: 'SOCIAL', amount: 10 } }),
        DialogueBuilder.createChoice('2', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('nice', DialogueBuilder.createNode(
      'nice',
      'NPC',
      `It is! My happiness is affected by other needs - if energy, hunger, social are low, happiness decays. If I'm at home or eating or socializing, happiness restores. My home is HOUSE004, door 30,26 north!`,
      [
        DialogueBuilder.createChoice('1', 'Good to know!', null, '💡')
      ],
      npcName,
      true
    ));

    nodes.set('keep_talking', DialogueBuilder.createNode(
      'keep_talking',
      'NPC',
      `Thanks! My social is now higher! I also gift FLOWERs sometimes when interacting. My inventory: {inventory}. Flowers are for social gifts. My social interactions increase when I talk to others!`,
      [
        DialogueBuilder.createChoice('1', 'Thanks for chatting!', null, '🙏')
      ],
      npcName,
      true
    ));

    return {
      id: `dialogue_${npcId}`,
      npcId,
      npcName,
      role,
      startNodeId: 'start',
      nodes
    };
  }

  private static createChildDialogue(
    npcId: string,
    npcName: string,
    role: string,
    context?: any
  ): Dialogue {
    const nodes = new Map<string, DialogueNode>();

    nodes.set('start', DialogueBuilder.createNode(
      'start',
      'NPC',
      `Hi! I'm {npcName}, I'm a {role}! It's {time}! My wellbeing is {wellbeing}% - {needs}. I have {inventory} - lots of flowers! Want to play?`,
      [
        DialogueBuilder.createChoice('1', 'What do you like to play?', 'play', '🧸'),
        DialogueBuilder.createChoice('2', 'Where do you play?', 'where', '🏃'),
        DialogueBuilder.createChoice('3', 'Can I have a flower?', 'flower', '🌸'),
        DialogueBuilder.createChoice('4', 'Bye!', null, '👋')
      ],
      npcName
    ));

    nodes.set('play', DialogueBuilder.createNode(
      'play',
      'NPC',
      `I like playing at the square! PLAY activity restores happiness 1.5x faster! My job CHILD produces FLOWER, 0 coins per hour, but 3 happiness per hour - happiest job! I work (play) 8AM-5PM.`,
      [
        DialogueBuilder.createChoice('1', 'That sounds fun!', 'fun', '😄'),
        DialogueBuilder.createChoice('2', 'Back', 'start', '↩️')
      ],
      npcName
    ));

    nodes.set('where', DialogueBuilder.createNode(
      'where',
      'NPC',
      `I play at the square 25,20 and wander 17-18:30! My home is HOUSE005, door 10,19 east facing, 5x4 size. I sleep 0-7 and 19:30-24. I eat lunch at home 12-13!`,
      [
        DialogueBuilder.createChoice('1', 'Cool!', null, '👍')
      ],
      npcName,
      true
    ));

    nodes.set('flower', DialogueBuilder.createNode(
      'flower',
      'NPC',
      `Sure! Here's a FLOWER! 🌸 Flowers are for social gifts. When NPCs interact, they sometimes gift flowers. My inventory: {inventory}. Flowers value 4 coins!`,
      [
        DialogueBuilder.createChoice('1', 'Thank you!', null, '🙏', undefined, { giveItem: 'FLOWER' })
      ],
      npcName,
      true
    ));

    nodes.set('fun', DialogueBuilder.createNode(
      'fun',
      'NPC',
      `It is! My energy decays 7 per hour when playing - I'm very active! But my happiness increases a lot. My needs: {needs}. My wellbeing is {wellbeing}%!`,
      [
        DialogueBuilder.createChoice('1', 'Have fun!', null, '😊')
      ],
      npcName,
      true
    ));

    return {
      id: `dialogue_${npcId}`,
      npcId,
      npcName,
      role,
      startNodeId: 'start',
      nodes
    };
  }

  private static createGenericDialogue(
    npcId: string,
    npcName: string,
    role: string,
    context?: any
  ): Dialogue {
    const nodes = new Map<string, DialogueNode>();

    nodes.set('start', DialogueBuilder.createNode(
      'start',
      'NPC',
      `Hello! I'm {npcName}, the {role}. It's {time} Day {day}. My wellbeing is {wellbeing}% - {needs}. I have {inventory}.`,
      [
        DialogueBuilder.createChoice('1', 'Tell me about yourself', 'about', '❓'),
        DialogueBuilder.createChoice('2', 'Goodbye', null, '👋')
      ],
      npcName
    ));

    nodes.set('about', DialogueBuilder.createNode(
      'about',
      'NPC',
      `I'm a {role}, my job is {job}. My needs: {needs}. My inventory: {inventory}. I live in {home}. I follow a schedule and have needs that decay over time!`,
      [
        DialogueBuilder.createChoice('1', 'Interesting!', null, '👍')
      ],
      npcName,
      true
    ));

    return {
      id: `dialogue_${npcId}`,
      npcId,
      npcName,
      role,
      startNodeId: 'start',
      nodes
    };
  }
}
