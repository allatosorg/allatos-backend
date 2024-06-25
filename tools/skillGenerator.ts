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
let rarity = 0; //right now this property is meaningless

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

    switch(type)
    {
        case 'attack':
            effects.set('dmg', 3); 
            fatCost = 11;
            selfTarget = false;

            loadAttacks(c, r, l);

            break;



        case 'block':
            effects.set('block', 2);
            fatCost = 3;
            selfTarget = true;

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
    switch(type)
    {
        case 'attack':
            effects.set('dmg', 7); 
            fatCost = 11;
            selfTarget = false;

            break;


        case 'block':
            effects.set('block', 5);
            fatCost = 3;
            selfTarget = true;

            break;

        default:
            break;
    }

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
    }
}

function loadBlocks(c: boolean, r: boolean, l: boolean)
{
    if (c)
    {
        skills.push(allSkills.get("Block"));
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

        const x = rndInt(4, 6);
        fatCost -= 6 - x;
        effects.set('dmg', effects.get('dmg') + x + 4);
    }],

    //+4 dmg, +9-11 heavy
    ["Heavy Attack", () =>
    {
        name = "Heavy Attack";

        const x = rndInt(4, 6);
        fatCost -= 6 - x;
        effects.set('dmg', effects.get('dmg') + 4);
        effects.set('heavy', x + 5);
    }],

    //+4 dmg, +6-9 shred
    ["Shred", () =>
    {
        name = "Shred";

        const x = rndInt(4, 7);
        fatCost -= 6 - x;
        effects.set('dmg', effects.get('dmg') + 4);
        effects.set('shred', x + 2);
    }],

    //combo: +9-12 dmg
    ["Twin Strike", () =>
    {
        name = "Twin Strike";

        const x = rndInt(0, 3);
        fatCost += x + 2;
        effects.set('combo', new Map<string, any>([ ['dmg', x + 9] ]));
    }],

    //+3-5 dmg, apply weakened
    ["Debilitate", () =>
    {
        name = "Debilitate";

        const x = rndInt(0, 2);
        fatCost += x;
        effects.set('dmg', effects.get('dmg') + x + 3);
        effects.set("Weakened", [1, false]);
    }],

    //+12-14 dmg, apply 2 Vulnerable to self
    ["Reckless Strike", () =>
    {
        name = "Reckless Strike";

        const x = rndInt(0, 2);
        fatCost += x;
        effects.set('dmg', effects.get('dmg') + x + 12);
        effects.set("Vulnerable", [2, true]);
    }],

    //deal damage equal to block
    ["Body Slam", () =>
    {
        name = "Body Slam";

        effects.delete('dmg');
    }],

    //combo: +15-18 heavy
    ["Overwhelm", () =>
    {
        name = "Overwhelm";

        const x = rndInt(11, 14);
        fatCost -= 12 - x;
        effects.set('combo', new Map<string, any>([ ['heavy', x + 4] ]));
    }],

    //+5-7 dmg, if opponent is at or over stam limit, +50% dmg
    ["Punishing Blow", () =>
    {
        name = "Punishing Blow";

        const x = rndInt(5, 7);
        fatCost += x - 3;
        effects.set('dmg', effects.get('dmg') + x);
    }],

    //+25-30 dmg
    ["Brutal Swing", () =>
    {
        name = "Brutal Swing";

        const x = rndInt(0, 5);
        fatCost += 29 + x;
        effects.set('dmg', effects.get('dmg') + 25 + x);
    }],



    /* ------------------------- BLOCKS -------------------------- */

    //+5-7 block
    ["Block", () =>
    {
        name = "Block";

        const x = rndInt(3, 5);
        fatCost -= 5 - x;
        effects.set('block', effects.get('block') + x + 2);
    }],

    //stance: 7-9 block
    ["Barricade", () =>
    {
        name = "Barricade";

        const x = rndInt(4, 6);
        fatCost -= 5 - x;
        effects.set('stance', new Map<string, any>([ ['block', x + 3] ]));
    }],

    //+2-4 block, retaliate: 6-8 dmg
    ["Riposte", () =>
    {
        name = "Riposte";

        const x = rndInt(2, 4);
        fatCost -= 4 - x;
        effects.set('block', effects.get('block') + x);
        effects.set('retaliate', new Map<string, any>([ ['dmg', x + 2] ]));
    }],

    //+3-4 block, steadfast
    ["Stand Ready", () =>
    {
        name = "Stand Ready";

        const x = rndInt(1, 2);
        fatCost += x;
        effects.set('steadfast', true);
        effects.set('block', effects.get('block') + x + 2);
    }],

    //+0-1 block, apply pumped to self
    ["Warm Up", () =>
    {
        name = "Warm Up";

        const x = rndInt(0, 1);
        fatCost += 5 + x;
        effects.set("Pumped", [1, true]);
        effects.set('block', effects.get('block') + x);
    }],

    //+2-4 block, if opponent used N fatigue: apply 1 Vulnerable
    ["Throw Off Balance", () =>
    {
        name = "Throw Off Balance";

        const x = rndInt(0, 6);
        fatCost += 7 - x;
        effects.set('block', effects.get('block') + rndInt(0, 2) + 2);
        effects.set('offBalanceReq', 18 + x);
    }],

    //+3-5 block, your opponent's first attack this turn uses double fatigue
    ["Take The High Ground", () =>
    {
        name = "Take The High Ground";

        const x = rndInt(0, 2);
        effects.set('block', effects.get('block') + x + 3);
    }],

    //+1-2 block, apply 2 bolstered to self
    ["Bolster Defences", () =>
    {
        name = "Bolster Defences";

        const x = rndInt(1, 2);
        fatCost += 9 + x;
        effects.set('block', effects.get('block') + x);
        effects.set("Bolstered", [2, true]);
    }],
    
    //+0-1 block, countdown 1 on statuses
    ["Shake It Off", () =>
    {
        name = "Shake It Off";

        const x = rndInt(0, 1);
        fatCost += x;
        effects.set('block', effects.get('block') + x);
    }],

    //steadfast, double the base block of previous block
    ["Unrelenting Defence", () =>
    {
        name = "Unrelenting Defence";

        effects.set('steadfast', true);
    }],

    //+40-43 block, apply debuffs to self
    ["Last Resort", () =>
    {
        name = "Last Resort";

        const x = rndInt(0, 3);
        fatCost += x;
        effects.set('block', effects.get('block') + x + 35);
        effects.set("Bolstered", [-6, true]);
        effects.set("Weakened", [3, true]);
    }],
]);

function rndInt(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}