import { ServerCreature } from "../models/serverCreature";
import { Notification } from "../models/notification";
import { generateSkill } from "./skillGenerator";
import { Activity } from "../models/activity";
import { GenericService } from "../db_services/genericService";

/*
    for now you get xp | traits | skills from activities
    - Longer activity -> more rewards
    - Guaranteed XP, influenced by int (between 1x and 2x modifier)
    - Can get/choose skill or trait (somewhat rare)
    - Can succeed/fail on attribute checks in events for extra/less rewards
    - Chance of some events happening is based on cr attributes
    - (will implement in future: item loot)
    - ("choose your own" style events?)
    - rerolls: players can acquire rerolls, use them for event skill check rr, skillpick rr etc.
    - event fights: certain events can unlock AI fights
*/

const genericService = new GenericService;

let notiDescription = '';
//modify cr and return a notification
export async function resolveAct(cr: ServerCreature, act: Activity): Promise<Notification>
{
    notiDescription = '';

    for (const eventArr of actEventTable[act.name])
    {
        if (Math.random() <= eventArr[1])
        {
            await eventsMap.get(String([eventArr[0]]))(act, cr);
        }
    }

    if (act.props['xp'])
    {
        const rolledXP = rollXP(cr.int, act.props['xp']);
        cr.addXP(rolledXP);
        notiDescription += "Gained " + rolledXP + " xp.\n";
    }

    return new Notification(cr.name + " back from " + act.name, notiDescription, 'activity-summary', new Date());
}



//give random number multiplied by between ~1 and ~2 (influenced by int stat)
function rollXP(int: number, baseXP: number): number
{
    let rand = Math.random()*20;
    let modi = 0;
    
    if (rand >= 10)
    {
        modi = rand - Math.pow(rand-10,  1 - (0.06 * int));
    }
    else
    {
        modi = rand + Math.pow(10 - rand,  0.06 * int);
    }

    return (Math.floor((modi/20 + 1) * baseXP));
}

function rndInt(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/* -------------------------------------------------------------------------- EVENTS -------------------------------------------------------------------------- */

/*
    name:
    [
        [eventName, chance]
        ...
    ]
*/

//Object bc it might get uploaded to firestore at some point
const actEventTable =
{
    'Climb the Mountains':
    [
        ['Become stronger', 0.26]
    ],
    'Explore the Jungle':
    [
        ['Hidden treasure', 0.3]
    ],
    'Visit the Magical Pond':
    [
        ['Blessed by spirit', 0.15]
    ]
}


let eventsMap = new Map<string, Function>
([
    ['Blessed by spirit', (act: Activity, cr: ServerCreature) =>
        {
            const randomSkill = generateSkill(false, false, true);
            cr.addSkillPick([randomSkill]);

            notiDescription += "You have been blessed by a magical spirit! You can learn a legendary skill: " + randomSkill.name + ". ";
        }
    ],
    ['Become stronger', async (act: Activity, cr: ServerCreature) =>
        {
            if (cr.getTraitNames().includes('Absolutely Jacked'))
            {
                return;
            }
            else if (cr.getTraitNames().includes('Muscular'))
            {
                cr.removeTrait('Muscular');
                cr.addTrait(await genericService.getTrait('Absolutely Jacked'));

                notiDescription += "Regular exercise has shaped " + cr.name + "'s physique into an exceptional form. Gained a new trait: Absolutely Jacked. " ;
            }
            else if (cr.getTraitNames().includes('Strong'))
            {
                cr.removeTrait('Strong');
                cr.addTrait(await genericService.getTrait('Muscular'));

                notiDescription += cr.name + " seems to get stronger with each trip. Gained a new trait: Muscular. " ;
            }
            else
            {
                cr.addTrait(await genericService.getTrait('Strong'));

                notiDescription += "Mountain climbing turned out to be a decent workout. Gained a new trait: Strong. " ;
            }
        }
    ],
    ['Hidden treasure', (act: Activity, cr: ServerCreature) =>
        {
            if (rndInt(0, 1))
            {
                const extraXP = rollXP(cr.int, 15);
                cr.addXP(extraXP);

                notiDescription += "You found a hidden stash of supplies. Gained " + extraXP + " extra XP. ";
            }
            else
            {
                let skills = [];
                for (let i = 0; i < 3; i++) skills.push(generateSkill(true, false, false));
                cr.addSkillPick(skills);
    
                notiDescription += "You found a hidden stash of supplies. You can learn a common skill. ";
            }
        }
    ],
])