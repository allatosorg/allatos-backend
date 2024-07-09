import { Skill } from "../models/skill";
/*
NOTES/IDEAS:
- attacks stronger than blocks, but fatigue significantly sooner, comboable
- blocks: less comboable, but can counter opponent's attacks, takes priority to attacks in combat
- fatigue: skills build up fatigue, have to rest after a certain amount
- diminishing returns on creature attributes (ie: 10 str -> 100% dmg , 15 str -> 120% dmg , 20 str -> 130% dmg)

- craft multiple cards of same rarity -> upgrade another card or smth
- "snap" keyword: free action (doesnt count as card played, but still has fat cost), small effect
*/

/*
TYPES:
- ATTACK
    base: 6-7-8-10
    keywords:
        shredder: remove X block from opp
        heavy: builds more fatigue on opponent (but also more on you?)
        combo: extra effect if next skill is attack too

- BLOCK
    base: 4-5-6-8
    keywords:
        stance: extra block if previous was block too
        retaliate: deal damage if opponent attacked and all damage blocked
        steadfast: keep remaining block for next turn
        heal

- DEBUFF
    keywords: stun || poison ? || 
- BUFF
    keywords: heal
*/

/*
Method of generation:
    - get the rarity and type of skill to be generated
    - add base skill properties
    - load skill (functions) of that type into "skills" array
    - choose a skill function randomly (and input rarity, so effects can be scaled accordingly), it adds/modifies the property variables
    - construct and return skill
*/

let selfTarget: boolean;
let effects: Map<string, any>;
let fatCost = 0;
let name: string;
let description = '';
let skills = [];
let rarity = -1;

//TODO: separate functions for adding each effect, these could be used for modifying skills too (after theyve already been generated)
export function generateSkill(c: boolean, r: boolean, l: boolean, type = 'random'): Skill
{
    effects = new Map<string, any>;
    fatCost = 0;
    skills = [];
    if (type === 'random')
    {
        const types = ['attack', 'block'];
        type = types[rndInt(0, 1)];
    }

    initCardBase(type);
    switch(type)
    {
        case 'attack':
            loadAttacks(c, r, l);
            break;

        case 'block':
            loadBlocks(c, r, l);
            break;

        case 'trick':
            loadTricks(c, r, l);
            break;

        default:
            break;
    }

    skills[Math.floor(Math.random() * skills.length)](); //get random element
    return new Skill(type, selfTarget, effects, fatCost, rarity, name);;
}

export function generateSkillByName(type: string, name: string): Skill
{
    effects = new Map<string, any>;
    fatCost = 0;
    initCardBase(type);

    allSkills.get(name)();
    return new Skill(type, selfTarget, effects, fatCost, rarity, name);
}

export function generateStartingSkills(): Array<Skill>
{
    const arr = [];
    for (let i = 0; i < 3; i++)
    {
        arr.push(generateSkillByName('attack', 'Strike'));
        arr.push(generateSkillByName('block', 'Block'));
    }
    
    return arr;
}

function loadAttacks(c: boolean, r: boolean, l: boolean)
{
    if (c)
    {
        skills.push(allSkills.get("Strike"));
        skills.push(allSkills.get("Heavy Attack"));
        skills.push(allSkills.get("Shred"));
        skills.push(allSkills.get("Twin Strike"));
        skills.push(allSkills.get("Debilitate"));
        skills.push(allSkills.get("Reckless Strike"));
        skills.push(allSkills.get("Wild Out"));
    }

    if (r)
    {
        skills.push(allSkills.get("Body Slam"));
        skills.push(allSkills.get("Overwhelm"));
        skills.push(allSkills.get("Punishing Blow"));
    }

    if (l)
    {
        skills.push(allSkills.get("Brutal Swing"));
        skills.push(allSkills.get("Expose Weakness"));
    }
}

function loadBlocks(c: boolean, r: boolean, l: boolean)
{
    if (c)
    {
        skills.push(allSkills.get("Block"));
        skills.push(allSkills.get("Blockade"));
        skills.push(allSkills.get("Barricade"));
        skills.push(allSkills.get("Riposte"));
        skills.push(allSkills.get("Stand Ready"));
        skills.push(allSkills.get("Warm Up"));
    }

    if (r)
    {
        
        skills.push(allSkills.get("Throw Off Balance"));
        skills.push(allSkills.get("Take The High Ground"));
        skills.push(allSkills.get("Bolster Defences"));
        skills.push(allSkills.get("Shake It Off"));
        skills.push(allSkills.get("Channel Rage"));
    }

    if (l)
    {
        skills.push(allSkills.get("Unrelenting Defence"));
        skills.push(allSkills.get("Last Resort"));
    }
}

function loadTricks(c: boolean, r: boolean, l: boolean)
{
    if (c)
    {
        
    }

    if (r)
    {

    }

    if (l)
    {

    }
}

const allSkills = new Map<string, Function>
([
    /* ------------------------- ATTACKS -------------------------- */
    //+8-10 dmg 
    ["Strike", () =>
    {
        name = "Strike";
        rarity = 0;

        const x = rndInt(0, 2);
        fatCost -= 2 - x;
        effects.set('dmg', effects.get('dmg') + x + 8);
    }],

    //+11-15 dmg, +3-7 selfDmg
    ["Wild Out", () =>
    {
        name = "Wild Out";
        rarity = 0;

        const x = rndInt(0, 4);
        fatCost += x;
        effects.set('selfDmg', x + 3);
        effects.set('dmg', effects.get('dmg') + x + 11);
    }],
        
    //+4 dmg, +9-11 heavy
    ["Heavy Attack", () =>
    {
        name = "Heavy Attack";
        rarity = 0;

        const x = rndInt(4, 6);
        fatCost -= 6 - x;
        effects.set('dmg', effects.get('dmg') + 4);
        effects.set('heavy', x + 5);
    }],

    //+4 dmg, +6-9 shred
    ["Shred", () =>
    {
        name = "Shred";
        rarity = 0;

        const x = rndInt(4, 7);
        fatCost -= 6 - x;
        effects.set('dmg', effects.get('dmg') + 4);
        effects.set('shred', x + 2);
    }],

    //+3 dmg, combo: +6-9 dmg
    ["Twin Strike", () =>
    {
        name = "Twin Strike";
        rarity = 0;

        const x = rndInt(0, 3);
        fatCost += 2*x + 2;
        effects.set('dmg', effects.get('dmg') + 3);
        effects.set('combo', new Map<string, any>([ ['dmg', x + 6] ]));
    }],

    //+3-5 dmg, apply weakened
    ["Debilitate", () =>
    {
        name = "Debilitate";
        rarity = 0;

        const x = rndInt(0, 2);
        fatCost += x;
        effects.set('dmg', effects.get('dmg') + x + 3);
        effects.set("Weakened", [1, false]);
    }],

    //+12-14 dmg, apply 2 Vulnerable to self
    ["Reckless Strike", () =>
    {
        name = "Reckless Strike";
        rarity = 0;

        const x = rndInt(0, 2);
        fatCost += 2*x;
        effects.set('dmg', effects.get('dmg') + x + 12);
        effects.set("Vulnerable", [2, true]);
    }],

    //deal damage equal to block
    ["Body Slam", () =>
    {
        name = "Body Slam";
        rarity = 1;

        effects.delete('dmg');
    }],

    //combo: +15-18 heavy
    ["Overwhelm", () =>
    {
        name = "Overwhelm";
        rarity = 1;

        const x = rndInt(11, 14);
        fatCost -= 12 - x;
        effects.set('combo', new Map<string, any>([ ['heavy', x + 4] ]));
    }],

    //+5-7 dmg, if opponent is at or over stam limit, +50% dmg
    ["Punishing Blow", () =>
    {
        name = "Punishing Blow";
        rarity = 1;

        const x = rndInt(5, 7);
        fatCost += x - 3;
        effects.set('dmg', effects.get('dmg') + x);
    }],

    //+25-30 dmg
    ["Brutal Swing", () =>
    {
        name = "Brutal Swing";
        rarity = 2;

        const x = rndInt(0, 5);
        fatCost += 29 + x;
        effects.set('dmg', effects.get('dmg') + 25 + x);
    }],

    //inflict Weakened, combo: inflict -2 bolstered
    ["Expose Weakness", () =>
    {
        name = "Expose Weakness";
        rarity = 0;

        effects.set("Weakened", [1, false]);
        effects.set('combo', new Map<string, any>([ ['bolstered', [-2, false]] ]));
    }],


    /* ------------------------- BLOCKS -------------------------- */

    //+5-7 block
    ["Block", () =>
    {
        name = "Block";
        rarity = 0;

        const x = rndInt(0, 2);
        fatCost -= 2 - x;
        effects.set('block', effects.get('block') + x + 5);
    }],

    //+10-13 block
    ["Blockade", () =>
    {
        name = "Blockade";
        rarity = 0;

        const x = rndInt(0, 3);
        fatCost += 12 + x;
        effects.set('block', effects.get('block') + x + 10);
    }],

    //stance: 7-9 block
    ["Barricade", () =>
    {
        name = "Barricade";
        rarity = 0;

        const x = rndInt(4, 6);
        fatCost -= 5 - x;
        effects.set('stance', new Map<string, any>([ ['block', x + 3] ]));
    }],

    //+2-4 block, retaliate: 6-8 dmg
    ["Riposte", () =>
    {
        name = "Riposte";
        rarity = 0;

        const x = rndInt(2, 4);
        fatCost -= 4 - x;
        effects.set('block', effects.get('block') + x);
        effects.set('retaliate', new Map<string, any>([ ['dmg', x + 2] ]));
    }],

    //+3-4 block, steadfast
    ["Stand Ready", () =>
    {
        name = "Stand Ready";
        rarity = 0;

        const x = rndInt(1, 2);
        fatCost += x;
        effects.set('steadfast', true);
        effects.set('block', effects.get('block') + x + 2);
    }],

    //+0-1 block, apply 2 pumped to self
    ["Warm Up", () =>
    {
        name = "Warm Up";
        rarity = 0;

        const x = rndInt(0, 1);
        fatCost += 9 + x;
        effects.set("Pumped", [2, true]);
        effects.set('block', effects.get('block') + x);
    }],

    //+2-4 block, if opponent used N fatigue: apply 1 Vulnerable
    ["Throw Off Balance", () =>
    {
        name = "Throw Off Balance";
        rarity = 1;

        const x = rndInt(0, 6);
        fatCost += 7 - x;
        effects.set('block', effects.get('block') + rndInt(0, 2) + 2);
        effects.set('offBalanceReq', 18 + x);
    }],

    //+3-5 block, your opponent's first attack this turn uses double fatigue
    ["Take The High Ground", () =>
    {
        name = "Take The High Ground";
        rarity = 1;

        const x = rndInt(0, 2);
        effects.set('block', effects.get('block') + x + 3);
    }],

    //+1-2 block, apply 2 bolstered to self
    ["Bolster Defences", () =>
    {
        name = "Bolster Defences";
        rarity = 1;

        const x = rndInt(1, 2);
        fatCost += 9 + x;
        effects.set('block', effects.get('block') + x);
        effects.set("Bolstered", [2, true]);
    }],

    //apply 2 strengthened to self
    ["Channel Rage", () =>
    {
        name = "Channel Rage";
        rarity = 1;

        fatCost += 11;
        effects.set("Bolstered", [2, true]);
    }],
    
    //+0-1 block, countdown 1 on statuses
    ["Shake It Off", () =>
    {
        name = "Shake It Off";
        rarity = 1;

        const x = rndInt(0, 1);
        fatCost += x;
        effects.set('block', effects.get('block') + x);
    }],

    //steadfast, double the base block of previous block
    ["Unrelenting Defence", () =>
    {
        name = "Unrelenting Defence";
        rarity = 2;

        effects.delete('block');
        effects.set('steadfast', true);
    }],

    //+35-38 block, apply debuffs to self
    ["Last Resort", () =>
    {
        name = "Last Resort";
        rarity = 2;

        const x = rndInt(0, 3);
        fatCost += x;
        effects.set('block', effects.get('block') + x + 30);
        effects.set("Bolstered", [-6, true]);
        effects.set("Weakened", [3, true]);
    }],
]);

function initCardBase(type: string)
{
    switch(type)
    {
        case 'attack':
            effects.set('dmg', 3);
            fatCost = 11;
            selfTarget = false;

            break;


        case 'block':
            effects.set('block', 2);
            fatCost = 3;
            selfTarget = true;

            break;

        default:
            break;
    }
}

function rndInt(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}