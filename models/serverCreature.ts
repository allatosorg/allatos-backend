import { Activity } from "./activity";
import { Skill } from "./skill";
import { Trait } from "./trait";
import { generateSkill } from "../tools/skillGenerator";
import { Status } from "./status";
import { allStatuses } from "../db_services/shared/statuses";
import { calcXpRequirement } from "../tools/formulas";
import { traitFuncs } from "../db_services/shared/traits";

export class ServerCreature
{
    crID: string;
    name: string;
    type: string;
    str: number;
    agi: number;
    int: number;
    con: number;
    ini: number;
    stamina: number;
    ownedBy: string;
    skills: Array<Skill> = [];
    traits: Array<Trait> = [];
    xp: number;
    level: number;
    born: Date;
    skillPicks: Array<Array<Skill>>;
    lvlup: number;
    battlesWon: number;
    currentAct?: Activity;
    needsCopy = true;
    baseSelf: ServerCreature | undefined;
    
    //for battle
    HP?: number;
    block?: number;
    fatigue?: number;
    turnInfo?: any;
    lingering?: any;
    deck?: Array<Skill>;
    grave?: Array<Skill>;
    statuses?: Array<Status>;

    constructor(crID: string, name: string, type: string, str: number, agi: number, int: number, con: number, ini: number,
        ownedBy: string, skills: Array<Skill>, traits: Array<Trait>, stamina: number, xp: number, born: Date, level: number,
        skillPicks: Array<Array<Skill>>, lvlup: number, battlesWon: number, currentAct?: Activity)
    {
        this.crID = crID;
        this.name = name;
        this.type = type;
        this.str = str;
        this.agi = agi;
        this.int = int;
        this.con = con;
        this.ini = ini;
        this.ownedBy = ownedBy;
        this.skills = skills;
        this.traits = traits;
        this.stamina = stamina;
        this.xp = xp;
        this.born = born;
        this.currentAct = currentAct;
        this.skillPicks = skillPicks;
        this.level = level;
        this.lvlup = lvlup;
        this.battlesWon = battlesWon;

        if (this.needsCopy)
        {
            this.needsCopy = false;
            this.baseSelf = Object.assign({}, this);;
            this.applyTraits();
        }
    }

    getTraitNames(): Array<string>
    {
        let nameArr = [];
        for (let trait of this.traits) nameArr.push(trait.name);
        
        return nameArr;
    }

    hasStatus(statusName: string): boolean
    {
        let has = false;
        this.statuses!.forEach((s) =>
        {
          if (s.name === statusName) has = true;
        });
  
        return has;
    }

    hasTrait(traitName: string): boolean
    {
        let has = false;
        this.traits!.forEach((s) =>
        {
          if (s.name === traitName) has = true;
        });
  
        return has;
    }
    
    getStatus(statusName: string): Status | null
    {
        let status = null;
        this.statuses!.forEach((s) =>
        {
          if (s.name === statusName) status = s;
        });
  
        return status;
    }

    addStatus(name: string, counter: number)
    {
        if (this.hasStatus(name))
        {
            this.statuses.forEach((status) =>
            {
                if (status.name === name)
                {
                    status.counter += counter; 
                }
            });
        }
        else
        {
            let newStatus: Status = {...allStatuses.get(name)};
            newStatus.counter = counter;
            this.statuses.push(newStatus);
        }
    }

    addXP(gained: number)
    {
        this.xp += gained;
        if (this.xp > calcXpRequirement(this.level))
        {
            this.xp -= calcXpRequirement(this.level);
            this.level++;
            this.lvlup++;

            let newSkillPick = [];
            for (let i = 0; i < 3; i++) newSkillPick.push(generateSkill(true, true, false));
            this.addSkillPick(newSkillPick);
        }
    }

    addSkillPick(skillPick: Array<Skill>)
    {
        if (!(this.skillPicks)) this.skillPicks = [];
        //Math.random() to avoid overwrite of skillpicks added in quick succession
        this.skillPicks.push(skillPick);
    }

    addTrait(trait: Trait)
    {
        if (!this.traits) this.traits = [];
        this.traits.push(trait);

    }

    removeTrait(traitName: string)
    {
        if (!this.traits) return;

        this.traits = this.traits.filter((t) => t.name !== traitName);
    }

    applyTraits()
    {
        if (this.traits)
        {
            for (let t of this.traits)
            {
                if (!t.isScaling) traitFuncs.get(t.name)!(this);
            }
        }
    }
    
    countStatusesDown()
    {
        this.statuses.map((s) =>
        {
            if (s.countsDown && s.name !== "First") s.counter--;
        });
        this.statuses = this.statuses.filter((s) => !s.countsDown || s.counter > 0);
    }
}
