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
                if (this.effects.has('dmg')) this.description += "Deal " + this.effects.get('dmg') + " damage.\n";

                for (let [effect, value] of this.effects)
                {
                    switch(effect)
                    {
                        case 'shred':
                            this.description += "Shred " + value + " block.\n";
                            break;

                        case 'heavy':
                            this.description += "Heavy: " + value + "\n";
                            break;

                        case 'selfDmg':
                            this.description += "Deal " + this.effects.get('selfDmg') + " damage to self.\n";
                            break;

                        case 'combo':
                            this.description += "Combo: ";
                            if (value.has('dmg')) this.description += "+" + value.get('dmg') + " damage. ";
                            if (value.has('heavy')) this.description += "+" + value.get('heavy') + " heavy. ";
                            this.description += "\n";
                            break;
                    

                        case "Weakened":
                            this.description += "Apply " + value[0] + " Weakened";
                            if (value[1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Vulnerable":
                            this.description += "Apply " + value[0] + " Vulnerable";
                            if (value[1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Pumped":
                            this.description += "Apply " + value[0] + " Pumped";
                            if (value[1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        default:
                            break;
                    }
                }
                break;

            case 'block':
                if (this.effects.has('block')) this.description += "Gain " + this.effects.get('block') + " block.\n";

                for (let [effect, value] of this.effects)
                {
                    switch(effect)
                    {
                        case 'stance':
                            this.description += "Stance: ";
                            if (value.has('block')) this.description += "+" + value.get('block') + " block. ";
                            this.description += "\n";
                            break;

                        case 'steadfast':
                            this.description += "Steadfast\n";
                            break;

                        case 'retaliate':
                            this.description += "Retaliate: ";
                            if (value.has('dmg')) this.description += "Deal " + value.get('dmg') + " damage. ";
                            this.description += "\n";
                            break;
                        

                        case "Weakened":
                            this.description += "Apply " + value[0] + " Weakened";
                            if (value[1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Vulnerable":
                            this.description += "Apply " + value[0] + " Vulnerable";
                            if (value[1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Pumped":
                            this.description += "Apply " + value[0] + " Pumped";
                            if (value[1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Bolstered":
                            this.description += "Apply " + value[0] + " Bolstered";
                            if (value[1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        default:
                            break;
                    }
                }
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
                this.description = "Deals damage equal to your block.";
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
                this.description = "Count down your status effects by 1.";
                break;

            default:
                break;
        }
    }

}