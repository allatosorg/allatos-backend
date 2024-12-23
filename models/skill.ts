import { allStatuses } from "../db_services/shared/statuses";

export class Skill
{
    type: string;
    description = '';
    selfTarget: boolean; 
    effects: Map<string, any>;
    fatCost: number;
    rarity: number;
    name: string;
    usedByID = '';
    
    constructor(type: string, selfTarget: boolean, effects: Map<string, any>, fatCost: number, rarity: number, name: string, description?: string)
    {
        this.type = type;
        this.selfTarget = selfTarget;
        this.effects = effects;
        this.fatCost = fatCost;
        this.rarity = rarity;
        this.name = name;
        if (description)
        {
            this.description = description;
        }

        this.buildDescription();
    }

    buildDescription()
    {
        this.description = '';
        switch(this.type)
        {
            case 'attack':
                this.addBasicEffects(this.effects);
                this.addStatusApplyText(this.effects);
                this.addComboText();
                break;

            case 'block':
                this.addBasicEffects(this.effects);
                this.addStatusApplyText(this.effects);
                this.addStanceText();
                break;

            default:
                break;
        }

        //for cards with unique effects (add a base description)
        switch(this.name)
        {
            case "Throw Off Balance":
                this.description += "If opponent used at least " + this.effects.get('offBalanceReq') + " stamina, they become Vulnerable at end of turn.";
                break;

            case "Body Slam":
                this.description += "Deals damage equal to your block.";
                break;

            case "Unrelenting Defence":
                this.description += "Gain the block value of the previous block card played.";
                break;

            case "Take The High Ground":
                this.description += "Double the stamina cost of your opponent's next attack.";
                break;

            case "Punishing Blow":
                this.description += "If opponent is over fatigue limit, this deals +50% base damage.";
                break;

            case "Shake It Off":
                this.description += "Count down your status effects by 1.";
                break;

            case "Pummel":
                this.description += "Gain 1 block for each damage dealt.";
                break;

            default:
                break;
        }
    }

    //dont break line for sub-effects (combo, stance etc)
    addStatusApplyText(effects: Map<string, any>, breakLine = true)
    {
        for (let st of allStatuses.keys())
        {
            if (effects.has(st))
            {
                this.description += "Apply " + effects.get(st)[0] + " " + st;
                if (effects.get(st)[1])
                {
                    this.description += " to self.";
                }
                else this.description += ".";
                breakLine ? this.description += "\n" : this.description += " ";
            }
        }
    }

    //dont break line for sub-effects (combo, stance etc)
    addBasicEffects(effects: Map<string, any>, breakLine = true)
    {
        if (effects.has('dmg'))
        {
            this.description += "Deal " + effects.get('dmg') + " damage.";
            breakLine ? this.description += "\n" : this.description += " ";
        }
        if (effects.has('shred'))
        {
            this.description += "Shred " + effects.get('shred') + " block."
            breakLine ? this.description += "\n" : this.description += " ";
        }
        if (effects.has('heavy'))
        {
            this.description += "Heavy: " + effects.get('heavy');
            breakLine ? this.description += "\n" : this.description += " ";
        }
        if (effects.has('selfDmg'))
        {
            this.description += "Deal " + effects.get('selfDmg') + " damage to self.";
            breakLine ? this.description += "\n" : this.description += " ";
        }

        if (effects.has('block'))
        {
            this.description += "Gain " + effects.get('block') + " block.";
            breakLine ? this.description += "\n" : this.description += " ";
        }
        if (effects.has('retaliate'))
        {
            this.description += "Retaliate: ";
            this.addBasicEffects(effects.get('retaliate'), false);
            this.addStatusApplyText(effects.get('retaliate'), false);
            this.description += "\n";
        }
        if (effects.has('fatigue'))
        {
            this.description += "Inflict " + effects.get('fatigue') + " fatigue.";
            breakLine ? this.description += "\n" : this.description += " ";
        }
        if (effects.has('steadfast'))
        {
            this.description += "Steadfast\n";
        }
        
    }

    addComboText()
    {
        if (this.effects.has('combo'))
        {
            this.description += "Combo: ";
            this.addBasicEffects(this.effects.get('combo'), false);
            this.addStatusApplyText(this.effects.get('combo'), false);
            this.description += "\n";
        }
    }

    addStanceText()
    {
        if (this.effects.has('stance'))
        {
            this.description += "Stance: ";
            this.addBasicEffects(this.effects.get('stance'), false);
            this.addStatusApplyText(this.effects.get('stance'), false);
            this.description += "\n";
        }
    }

    addEffect(effect: string, n: number, mapName?: string)
    {
        if (mapName)
        {
            if (this.effects.has(mapName))
            {
                if (this.effects.get(mapName).has(effect))
                {
                    this.effects.get(mapName).set(effect, n + this.effects.get(mapName).get(effect));
                }
                else this.effects.get(mapName).set(effect, n);
            }
            else this.effects.set(mapName, new Map<string, any>([ [effect, n] ]))
        }
        else
        {
            if (this.effects.has(effect))
            {
                this.effects.set(effect, n + this.effects.get(effect));
            }
            else this.effects.set(effect, n);
        }
    }
}