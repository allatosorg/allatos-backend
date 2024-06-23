import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc, deleteField} from 'firebase/firestore';
import { firebaseConfig } from "../fbaseconfig";
import { Skill } from "../models/skill";
import { ServerCreature } from "../models/serverCreature";
import { Trait } from "../models/trait";
import { Activity } from "../models/activity";
import { applyTraits } from "../tools/applyTraits";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);

export class CrService
{
  async getCreatureById(id: string, tries = 10): Promise<ServerCreature>
  {
    try
    {
      let data = (await getDoc(doc(db, "creatures", id))).data();
      let creature = this.convertDataToCreature(id, data);
      return(creature);
    }
    catch (error)
    {
      if (tries > 0)
      {
        return await this.getCreatureById(id, tries-1)
      }
      else throw error;
    }
  }

  async getAllCreatures(): Promise<Array<ServerCreature>>
  {
    const snapshot = await getDocs(collection(db, 'creatures'));
    const arr: Array<ServerCreature> = [];
    snapshot.forEach((doc) =>
    {
      let data = doc.data();
      arr.push(this.convertDataToCreature(doc.id, data));
    });

    return arr;
  }

  //DOES NOT UPDATE: currentAct, ownedBy, type, battleswon
  async updateCreature(crID: string, cr: ServerCreature)
  {
    let skillsConverted: Array<any> = [];
    if (cr.skills)
    {
      cr.skills.forEach((s) => skillsConverted.push(this.skillToObj(s)));
    }

    let traitsConverted = [];
    if (cr.traits) traitsConverted = cr.traits.map((obj)=> {return Object.assign({}, obj);});

    let skillPicksConverted = this.convertSkillPicks(cr.skillPicks);

    await updateDoc(doc(db, "creatures", crID),
    {
      agi: cr.agi,
      born: cr.born,
      con: cr.con,
      ini: cr.ini,
      int: cr.int,
      level: cr.level,
      name: cr.name,
      skills: skillsConverted,
      skillPicks: Object.keys(skillPicksConverted).length === 0 ? deleteField() : skillPicksConverted,
      stamina: cr.stamina,
      str: cr.str,
      traits: traitsConverted,
      xp: cr.xp,
      lvlup: cr.lvlup,
    });
  }

  async addCreature(cr: ServerCreature, uid: string): Promise<string>
  {
    const docRef = await addDoc(collection(db, "creatures"),
    {
      ownedBy: uid,
      type: cr.type,
      agi: cr.agi,
      born: cr.born,
      con: cr.con,
      ini: cr.ini,
      int: cr.int,
      level: cr.level,
      name: cr.name,
      skills: cr.skills.map((s) => { return this.skillToObj(s) }),
      stamina: cr.stamina,
      str: cr.str,
      traits: [],
      xp: cr.xp,
      lvlup: cr.lvlup,
      battlesWon: 0,
    });

    return docRef.id;
  }

  async learnSkill(crID: string, skill: Skill)
  {
    let temp = (await this.getCreatureById(crID)).skills;
    if (!temp) temp = [];
    temp.push(skill);

    const converted = temp.map((s)=> {return this.skillToObj(s);});
    
    await updateDoc(doc(db, "creatures", crID),
    {
      skills: converted
    });
  }

  async deleteAllSkills(crID: string)
  {
    await updateDoc(doc(db, "creatures", crID),
    {
      skills: []
    });
  }

  async addWin(cr: ServerCreature)
  {
    await updateDoc(doc(db, "creatures", cr.crID),
    {
      battlesWon: (cr.battlesWon++)
    });
  }

  async addTrait(crID: string, trait: Trait)
  {
    let temp = (await this.getCreatureById(crID)).traits;
    if (!temp) temp = [];
    temp.push(trait);
    const converted = temp.map((obj)=> {return Object.assign({}, obj)});

    await updateDoc(doc(db, "creatures", crID),
    {
      traits: converted
    });
  }

  async setAct(crID: string, act: Activity = null)
  {
    if(act) act = Object.assign({}, act);
    await updateDoc(doc(db, "creatures", crID),
    {
      currentAct: act
    });
  }

  async addSkillPick(crID: string, arr: Array<Skill>)
  {
    let temp = (await this.getCreatureById(crID)).skillPicks;
    if (!temp) temp = [];
    temp.push(arr);

    await updateDoc(doc(db, "creatures", crID),
    {
      skillPicks: this.convertSkillPicks(temp)
    });
  }

  async replaceSkillPicks(crID: string, skillPicks: Array<any>)
  {
    if (Object.keys(skillPicks).length === 0)
    {
      await updateDoc(doc(db, "creatures", crID),
      {
        skillPicks: deleteField()
      });
    }
    else await updateDoc(doc(db, "creatures", crID),
    {
      skillPicks: this.convertSkillPicks(skillPicks)
    });
  }

  //convert from firebase model to frontend model, apply traits if requested
  convertDataToCreature(crID: string, data: any, baseStats = true): ServerCreature
  {
    let cAct = undefined;
    if (data["currentAct"])
    {
      cAct = new Activity(data["currentAct"].name, data["currentAct"].description, data["currentAct"].duration, data["currentAct"].props, new Date(data["currentAct"].startDate.toDate()));
    }

    const skillsConverted: Array<Skill> = [];
    if (data["skills"])
    {
      data["skills"].forEach((s) => { skillsConverted.push(this.objToSkill(s)) });
    }

    let picksConverted = [];
    for (const p in data["skillPicks"])
    {
      const newPick = [];
      data["skillPicks"][p].forEach((s) => newPick.push(this.objToSkill(s)))
      picksConverted.push(newPick);
    }

    let cr = new ServerCreature(crID, data["name"], data["type"], data["str"], data["agi"], data["int"], data["con"], data["ini"],
      data["ownedBy"], skillsConverted, data["traits"], data["stamina"], data["xp"], new Date(data["born"].seconds*1000), data["level"],
      picksConverted, data["lvlup"], data["battlesWon"], cAct);
    if (!baseStats) applyTraits(cr);
    
    return cr;
  }

  skillToObj(skill: any): any
  {
    delete skill.usedByID;
    skill.effects = this.mapToObj(skill.effects);
    return Object.assign({}, skill);
  }

  objToSkill(skill: any): Skill
  {
    skill.effects = this.objToMap(skill.effects);
    return new Skill(skill.type, skill.selfTarget, skill.effects, skill.fatCost, skill.rarity, skill.name, skill?.description);
  }

  convertSkillPicks(skillPicks: Array<Array<any>>)
  {
    let obj = {};
    skillPicks.forEach((p, i) =>
    {
      obj[i] = (p.map((x) => { return this.skillToObj(x) }));
    });

    return obj;
  }

  mapToObj(map: Map<string, any>): any
  {
    for (let [key, value] of map)
    {
      if (value instanceof Map)
      {
        map.set(key, this.mapToObj(value));
      }
    }

    return Object.fromEntries(map.entries());
  }

  objToMap(obj: any)
  {
    if (obj instanceof Array) return obj;

    for (let prop in obj)
    {
      if (obj[prop] instanceof Object)
      {
        obj[prop] = this.objToMap(obj[prop]);
      }
    }

    return new Map(Object.entries(obj));
  }
}