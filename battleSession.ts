import { ServerCreature } from "./models/serverCreature";
import { Skill } from "./models/skill";
import { allStatuses } from "./db_services/shared/statuses";
import { Socket } from "socket.io";

export class BattleSession
{
    roomID!: string;
    crs: Array<ServerCreature> = [];
    uids: Array<String> = [];
    io: any;
    sockets: Array<Socket> = [];
    gameOverCb: Function;

    //gameStates -> 0: initializing || 10: turn start || 20: 1-1 skills picked (reveal phase) || 30: 2-2 skills picked (action phase) || 40: turn ending
    gameState = 0; 
    playerOneFirst: boolean; //who won ini roll, player one = players[0], player two = players[1]
    skillsPicked: Array<Array<Skill>> = [[], []];
    skillsUsed: Array<Array<Skill>> = [[], []];
    canPicks: Array<boolean> = [];

    combatLog = "";
    skillsOrdered: Array<Skill> = [];

    constructor(roomID: string, cr: ServerCreature, io: any, gameOverCb: Function)
    {
        this.gameOverCb = gameOverCb;

        this.crs[0] = cr;
        this.uids[0] = cr.ownedBy;
        this.crs[0].HP = cr.con;
        this.crs[0].fatigue = 0;
        this.crs[0].deck = [];
        this.crs[0].deck.push(...this.crs[0].skills);
        this.crs[0].skills.splice(0, this.crs[0].skills.length);
        this.crs[0].grave = [];
        this.crs[0].lingering = {};
        this.crs[0].statuses = [];

        this.roomID = roomID;
        this.io = io;
    }

    addSecondPlayer(cr: ServerCreature)
    {
        this.crs[1] = cr;
        this.uids[1] = cr.ownedBy;
        this.crs[1].HP = cr.con;
        this.crs[1].fatigue = 0;
        this.crs[1].deck = [];
        this.crs[1].deck.push(...this.crs[1].skills);
        this.crs[1].skills.splice(0, this.crs[1].skills.length);
        this.crs[1].grave = [];
        this.crs[1].lingering = {};
        this.crs[1].statuses = [];

        this.crs[0].block = 0;
        this.crs[1].block = 0;
        this.resetTurnInfo();
        this.startOfTurn();
    }

    playerRejoin(socket: any)
    {
        if (socket.data.uid === this.uids[0])
        {
            this.sockets[0] = socket;
        }
        else
        {
            this.sockets[1] = socket;
        }

        let decoy1 = { ...this.crs[0] };
        let decoy2 = { ...this.crs[1] };
        decoy1.skills = [];
        decoy2.skills = [];

        this.sockets[0].emit('player-rejoin');
        this.sockets[1].emit('player-rejoin');
    }

    //this is the main function driving the gameplay
    //players can pick 1-1 skill, after both players picked, they can pick 1-1 again (reveal phase), then action phase
    skillPicked(owneruid: string, index: number, socket: any)
    {
        //block foul play from a client
        if (owneruid === this.uids[0] && !this.canPicks[0]) return;
        if (owneruid === this.uids[1] && !this.canPicks[1]) return;

        let pickedBy: ServerCreature;
        let skill: Skill;

        try
        {
            if (this.gameState === 10 || this.gameState === 20)
            {
                if (owneruid === this.uids[0])
                {
                    pickedBy = this.crs[0];
                    skill = pickedBy.skills[index];
                    this.skillsPicked[0].push(skill);
                    this.canPicks[0] = false;
                }
                else
                {
                    pickedBy = this.crs[1];
                    skill = pickedBy.skills[index];
                    this.skillsPicked[1].push(skill);
                    this.canPicks[1] = false;
                }
                skill.usedByID = pickedBy.crID;
    
    
            pickedBy.skills.splice(pickedBy.skills.indexOf(skill), 1);
    
                if (!this.canPicks[0] && !this.canPicks[1])
                {
                    if (this.gameState === 10)
                        this.revealPhase();
                    else if (this.gameState === 20)
                        this.actionPhase();
                    
                }
                else this.sendGameState();
            }
        }
        catch(err)
        {
            console.error(err);
            this.sockets[0].emit('crash');
            this.sockets[1].emit('crash');
            this.gameOverCb();
        }
    }

    //roll ini, set blocks to 0, start of turn triggers
    startOfTurn()
    {
        this.gameState = 10;

        //chance of who goes first is relative to each other's ini -> if 30v20 then 30 ini has 60% chance of going first
        const iniTotal = this.crs[0].ini + this.crs[1].ini;
        const randomNumber = iniTotal * Math.random();
        if (randomNumber > this.crs[0].ini)
        {
            this.crs[1].addStatus("First", 1);
            this.playerOneFirst = false;
            this.combatLog += this.crs[1].name + " won the initiative roll. (";
        }
        else
        {
            this.crs[0].addStatus("First", 1);
            this.playerOneFirst = true;
            this.combatLog += this.crs[0].name + " won the initiative roll. (";
        }
        this.combatLog += "rolled " + randomNumber + "/" + iniTotal + ")\n";
        this.drawHand(this.crs[0]);
        this.drawHand(this.crs[1]);
        this.canPicks[0] = true;
        this.canPicks[1] = true;
        this.sendLog();
        this.sendGameState();
    }

    revealPhase()
    {
        this.gameState = 20;

        this.combatLog += this.crs[0].name + " picked skill:\n" + this.skillsPicked[0][0].description + "\n";
        this.combatLog += this.crs[1].name + " picked skill:\n" + this.skillsPicked[1][0].description + "\n";
        if (!(this.crs[0].hasStatus("Fatigued"))) this.canPicks[0] = true;
        if (!(this.crs[1].hasStatus("Fatigued"))) this.canPicks[1] = true;

        this.sendLog();
        if(!this.canPicks[0] && !this.canPicks[1])
        {
            this.actionPhase();
        }
        else
        {
            this.sockets[0].emit('skill-revealed', this.skillsPicked[1][0]);
            this.sockets[1].emit('skill-revealed', this.skillsPicked[0][0]);
            this.sendGameState();
        }
    }

    actionPhase()
    {
        this.sendGameState();

        this.gameState = 30;
        this.skillsOrdered = [];

        //activate blocks
        let p1turn = this.playerOneFirst;

        const p1Blocks = this.skillsPicked[0].filter((s) => { s.type === 'block' });
        const p2Blocks = this.skillsPicked[1].filter((s) => { s.type === 'block' });

        while (0 < p1Blocks.length + p2Blocks.length)
        {
            if (p1turn && p1Blocks.length > 0)
            {
                this.skillsOrdered.push(p1Blocks.shift());
            }
            else if (p2Blocks.length > 0)
            {
                this.skillsOrdered.push(p2Blocks.shift());

            }
            p1turn = !p1turn;
        }

        this.gameState = 35;
        //construct attack skill order and activate them
        p1turn = this.playerOneFirst;

        const p1Attacks = this.skillsPicked[0].filter((s) => { s.type === 'attack' });
        const p2Attacks = this.skillsPicked[1].filter((s) => { s.type === 'attack' });

        while (0 < p1Attacks.length + p2Attacks.length)
        {
            if (p1turn && p1Attacks.length > 0)
            {
                this.skillsOrdered.push(p1Attacks.shift());
            }
            else if (p2Attacks.length > 0)
            {
                this.skillsOrdered.push(p2Attacks.shift());

            }
            p1turn = !p1turn;
        }

        for (let i = 0; i < this.skillsOrdered.length; i++)
        {
            let currentSkill = this.skillsOrdered[i];
            let actor: number;
            let opponent: number;

            if (this.skillsOrdered[i].usedByID === this.crs[0].crID)
            {
                actor = 0;
                opponent = 1;
            }
            else
            {
                actor = 1;
                opponent = 0;
            }

            this.useSkill(actor, opponent, currentSkill);

            this.checkIfGameEnd();
        }

        this.endOfTurn();
        this.startOfTurn();
        this.sendLog();
    }

    endOfTurn()
    {
        this.gameState = 40;

        this.turnEndEffects();

        this.checkIfGameEnd();

        this.io.to(this.roomID).emit('turn-ended');
    }

    turnEndEffects()
    {
        let actor = this.playerOneFirst ? 0 : 1;
        let opp = this.playerOneFirst ? 1 : 0;

        for (let i = 0; i < 2; i++)
        {
            if (this.crs[actor].turnInfo.has('retaliate') && !(this.crs[actor].turnInfo.get('gotHit')) && this.crs[opp].turnInfo.get('attacked'))
            {
                if (this.crs[actor].turnInfo.get('retaliate').has('dmg'))
                {
                    this.hit(this.crs[actor], this.crs[opp], this.crs[actor].turnInfo.get('retaliate').get('dmg'));
                }
                if (this.crs[actor].turnInfo.get('retaliate').has('fatigue'))
                {
                    this.crs[opp].fatigue += this.crs[actor].turnInfo.get('retaliate').get('fatigue');
                }
            }
            if (this.crs[actor].hasStatus("Controlled Breathing")) this.removeFatigue(this.crs[actor], this.crs[actor].getStatus("Controlled Breathing").counter);
            if (this.crs[actor].hasTrait("Iron Lungs")) this.removeFatigue(this.crs[actor], 2);


            this.io.to(this.roomID).emit('action-happened', {type: ''});
            this.sendSnapshot();

            if (!this.crs[actor].hasStatus("Steadfast")) this.removeBlock(this.crs[actor], this.crs[actor].block);

            //count down statuses
            this.crs[actor].countStatusesDown();

            //apply end of turn status gains
            if (this.crs[actor].fatigue >= this.crs[actor].stamina)
            {
                this.crs[actor].addStatus("Fatigued", 1);
                if (!this.crs[actor].hasTrait("Hardy")) this.crs[actor].addStatus("Vulnerable", 1);
                this.crs[actor].fatigue -= this.crs[actor].stamina;
            }
            if (this.crs[actor].turnInfo.has('offBalance'))
            {
                let fatSum = 0;
                this.skillsUsed[actor].forEach((s: Skill) =>
                {
                    fatSum += s.fatCost;
                });
                if (this.crs[actor].turnInfo.get('offBalance') <= fatSum) this.crs[actor].addStatus("Vulnerable", 1);
            }


            actor = this.playerOneFirst ? 1 : 0;
            opp = this.playerOneFirst ? 0 : 1;
        }

        this.resetTurnInfo();
    }

    removeFatigue(target: ServerCreature, amount: number)
    {
        if (target.fatigue < amount) amount = target.fatigue;
        target.fatigue -= amount;
    }

    addBlock(actor: ServerCreature, amount: number, skill?: Skill)
    {
        if (actor.hasStatus("Bolstered")) amount += actor.getStatus("Bolstered").counter;

        let opp = actor === this.crs[0] ? this.crs[1] : this.crs[0];
        actor.block += amount;
        this.combatLog += actor.name + " is blocking " + amount + ".\n"

        //apply statuses from skill
        if (skill) this.applyStatuses(skill, actor, opp);

        this.io.to(this.roomID).emit('action-happened', {type: 'gain-block', block: amount, actorID: actor.crID});
        this.sendSnapshot();
    }

    removeBlock(cr: ServerCreature, amount: number)
    {
        if (amount > cr.block) amount = cr.block;
        cr.block -= amount;

        this.io.to(this.roomID).emit('action-happened', {type: 'remove-block', block: -1 * amount, actorID: cr.crID});
        this.sendSnapshot();
    }

    hit(actor: ServerCreature, target: ServerCreature, dmg: number, skill?: Skill)
    {
        if (actor.hasStatus("Strengthened")) dmg += actor.getStatus("Strengthened").counter;

        if (actor.hasStatus("Weakened")) dmg *= 0.75;
        if (actor.hasStatus("Pumped")) dmg *= 1.25;
        if (target.hasStatus("Vulnerable")) dmg *= 1.25;

        dmg = Math.floor(dmg);
        if (dmg < 0) dmg = 0;
        
        if (dmg > target.block)
        {
            //hit
            target.turnInfo.gotHit = true;
            dmg -= target.block;
            this.removeBlock(target, target.block);
        }
        else
        {
            //miss
            this.removeBlock(target, dmg);
            dmg = 0;
        }
        target.HP -= dmg;
        if (skill && skill.name === "Pummel") actor.block += dmg;

        //apply statuses from skill
        if (skill) this.applyStatuses(skill, actor, target);

        this.combatLog += target.name + " got hit for " + dmg + " damage.\n"
        this.io.to(this.roomID).emit('action-happened', {type: 'hit', dmg: dmg, targetID: target.crID});
        this.sendSnapshot();
    }

    //discard hand, draw X skills from deck
    drawHand(cr: ServerCreature)
    {
        //put leftover skills from last turn into deck
        cr.deck.push(...cr.skills);
        cr.skills.splice(0, cr.skills.length);
        this.drawCards(cr, 5);
    }

    drawCards(cr: ServerCreature, n: number)
    {
        for (let i = 0; i < n; i++)
        {
            //if deck is empty, shuffle grave back to deck
            if (cr.deck.length === 0)
            {
                cr.deck.push(...cr.grave);
                cr.grave.splice(0, cr.grave.length);
            }

            const drawIndex = Math.floor(Math.random() * cr.deck.length);
            cr.skills.push(cr.deck.splice(drawIndex, 1)[0]);
        }
    }

    //check if cr1 or cr2 hp is below 0 (tie if both below 0)
    checkIfGameEnd()
    {
        if (this.crs[0].HP <= 0)
        {
/*             if (this.crs[1].HP <= 0)
            {
                //tie
            }
            else */
            {
                //p2 won
                this.gameState = 666;
                this.playerWon(this.crs[1]);
            }
        }
        else if (this.crs[1].HP <= 0)
        {
            //p1 won
            this.gameState = 666;
            this.playerWon(this.crs[0]);
        }
    }

    resetTurnInfo()
    {
        this.crs[0].turnInfo = new Map<string, any>([]);
        this.crs[1].turnInfo = new Map<string, any>([]);
    }

    playerWon(cr: ServerCreature)
    {
        this.io.to(this.roomID).emit('turn-ended');
        this.sendGameState();
        this.io.to(this.roomID).emit('player-won', cr.ownedBy);
        this.sockets[0].disconnect();
        this.sockets[1].disconnect();
        this.gameOverCb(cr);
    }

    sendGameState()
    {
        console.log("sent to:", this.sockets[0].id, this.sockets[1].id)
        const cr1SkillsLength = this.crs[0].skills.length;
        const cr2SkillsLength = this.crs[1].skills.length;
        let decoy1 = { ...this.crs[0] };
        let decoy2 = { ...this.crs[1] };
        decoy1.skills = [];
        decoy2.skills = [];
        decoy1.ownedBy = null;
        decoy2.ownedBy = null;

        this.sockets[0].emit('game-state-sent', this.crs[0], this.canPicks[0], decoy2, cr2SkillsLength, this.gameState);
        this.sockets[1].emit('game-state-sent', this.crs[1], this.canPicks[1], decoy1, cr1SkillsLength, this.gameState);
    }

    //send 1 for every action-happened
    //TODO: combine action-happened and sendSnapshot
    sendSnapshot()
    {
        const cr1SkillsLength = this.crs[0].skills.length;
        const cr2SkillsLength = this.crs[1].skills.length;
        let decoy1 = { ...this.crs[0] };
        let decoy2 = { ...this.crs[1] };
        decoy1.skills = [];
        decoy2.skills = [];
        decoy1.ownedBy = null;
        decoy2.ownedBy = null;

        this.sockets[0].emit('snapshot-sent', this.crs[0], decoy2, cr2SkillsLength);
        this.sockets[1].emit('snapshot-sent', this.crs[1], decoy1, cr1SkillsLength);
    }

    gameStateRequested(socket: any)
    {
        const cr1SkillsLength = this.crs[0].skills.length;
        const cr2SkillsLength = this.crs[1].skills.length;
        let decoy1 = { ...this.crs[0] };
        let decoy2 = { ...this.crs[1] };
        decoy1.skills = [];
        decoy2.skills = [];

        if (socket === this.sockets[0])
        {
            this.sockets[0].emit('game-state-sent', this.crs[0], this.canPicks[0], decoy2, cr2SkillsLength, this.gameState);
        }
        if (socket === this.sockets[1])
        {
        this.sockets[1].emit('game-state-sent', this.crs[1], this.canPicks[1], decoy1, cr1SkillsLength, this.gameState);
        }
    }

    //send log to clients and clear it
    sendLog()
    {
        this.io.to(this.roomID).emit('log-sent', this.combatLog);
        this.combatLog = "";
    }

    useSkill(actor: number, opponent: number, ogSkill: Skill)
    {
        //make a clone thats modifiable (and put ogSkill into grave)
        let skill = Object.assign(Object.create(Object.getPrototypeOf(ogSkill)), ogSkill);
        this.io.to(this.roomID).emit('action-happened', skill);
        this.sendSnapshot();

        //for cards with unique effects (before everything else)
        switch(skill.name)
        {
            case "Body Slam":
                skill.effects.set('dmg', this.crs[actor].block);
                break;

            case "Throw Off Balance":
                this.crs[opponent].turnInfo.set('offBalance', skill.effects.get('offBalanceReq'));
                break;

            case "Unrelenting Defence":
                if (this.crs[actor].turnInfo.has('lastSkill') && 'block' === this.crs[actor].turnInfo.get('lastSkill').type && this.crs[actor].turnInfo.get('lastSkill').effects.has('block'))
                {
                    skill.effects.set('block', this.crs[actor].turnInfo.get('lastSkill').effects.get('block'));
                }
                break;

            case "Take The High Ground":
                this.crs[opponent].turnInfo.set('highGroundDebuff', true);
                break;

            case "Punishing Blow":
                if (this.crs[opponent].fatigue >= this.crs[opponent].stamina) skill.effects.set('dmg', skill.effects.get('dmg') * 1.5);
                break;

            default:
                break;
        }

        switch(skill.type)
        {
            case 'attack':
                if (this.crs[actor].hasTrait("Bad Tempered") && !this.crs[actor].turnInfo.has('attacked'))
                {
                    if (this.crs[actor].hasStatus("First"))
                    {
                        if (skill.fatCost < 4)
                        {
                            skill.fatCost = 0;
                        }
                        else skill.fatCost -= 4;
                    }
                    else skill.addEffect('dmg', 2);
                }
                this.crs[actor].turnInfo.set('attacked', true);

                if (this.crs[actor].turnInfo.get('highGroundDebuff'))
                {
                    skill.fatCost *= 2;
                    this.crs[actor].turnInfo.set('highGroundDebuff', false);
                }
                if (this.crs[actor].turnInfo.has('lastSkill') && this.crs[actor].turnInfo.get('lastSkill').effects.has('combo'))
                {
                    for (let [effect, value] of this.crs[actor].turnInfo.get('lastSkill').effects.get('combo'))
                    {
                        if (skill.effects.has(effect))
                        {
                            skill.effects.set(effect, skill.effects.get(effect) + value);
                        }
                        else
                        {
                            skill.effects.set(effect, value);
                        }
                    }
                }
                if (skill.effects.has('shred'))
                {
                    this.removeBlock(this.crs[opponent], skill.effects.get('shred'));
                }
                if (skill.effects.has('heavy'))
                {
                    this.crs[opponent].fatigue += skill.effects.get('heavy');
                }
                if (skill.effects.has('selfDmg'))
                {
                    this.hit(this.crs[actor], this.crs[actor], skill.effects.get('selfDmg'));
                }

                this.hit(this.crs[actor], this.crs[opponent], skill.effects.get('dmg'), skill);
                break;
            
                
            case 'block':
                if (this.crs[actor].hasTrait("Hardy")) skill.addEffect('block', 3, 'stance');

                if (skill.effects.has('stance') && this.crs[actor].turnInfo.has('lastSkill'))
                {
                    for (let [effect, value] of skill.effects.get('stance'))
                    {
                        if (skill.effects.has(effect))
                        {
                            skill.effects.set(effect, skill.effects.get(effect) + value);
                        }
                        else
                        {
                            skill.effects.set(effect, value);
                        }
                    }
                }
                if (skill.effects.has('retaliate'))
                {
                    for (let [effect, value] of skill.effects.get('retaliate'))
                    {
                        if (this.crs[actor].turnInfo.get('retaliate').has(effect))
                        {
                            this.crs[actor].turnInfo.get('retaliate').set(effect, this.crs[actor].turnInfo.get('retaliate').get(effect) + value);
                        }
                        else
                        {
                            this.crs[actor].turnInfo.get('retaliate').set(effect, value);
                        }
                    }
                }

                this.addBlock(this.crs[actor], skill.effects.get('block'), skill);
                break;
        }

        //for cards with unique effects (after everything else)
        switch(skill.name)
        {
            case "Shake It Off":
                this.crs[actor].countStatusesDown();
                break;

            default:
                break;
        }

        this.crs[actor].fatigue += skill.fatCost;
        this.crs[actor].turnInfo.set('lastSkill', skill);
        this.crs[actor].grave.push(ogSkill);
        let whichPlayer = this.crs[0].crID === skill.usedByID ? 0 : 1;
        this.skillsUsed[whichPlayer].push(skill);

        this.io.to(this.roomID).emit('action-happened', {type: ''});
        this.sendSnapshot();
        this.sendLog();
    }

    //apply statuses from skill
    applyStatuses(skill: Skill, actor: ServerCreature, opp: ServerCreature)
    {
        for (let key of skill.effects.keys())
        {
            if (allStatuses.has(key))
            {
                skill.effects.get(key)[1] ? actor.addStatus(key, skill.effects.get(key)[0]) : opp.addStatus(key, skill.effects.get(key)[0]);
            }
        }
    }
}