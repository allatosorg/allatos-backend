import { Creature } from "./models/creature";
import { Skill } from "./models/skill";
import { CrService } from "./db_services/crService";
import { generateSkill } from "./tools/skillGenerator";
import { UserService } from "./db_services/userService";
import { User } from "./models/user";
import { generateCreature } from "./tools/creatureGenerator";
import * as express from "express";
import { createServer } from "https";
import { Server, Socket} from "socket.io"
import * as fs from 'fs';

var privateKey = fs.readFileSync( 'privkey.pem' );
var certificate = fs.readFileSync( 'fullchain.pem' );
const app = express();
const server = createServer(
{
    key: privateKey,
    cert: certificate
}, app);
const io = new Server(server,
{
    cors:   
    {
        origin: '*'
    }
});

let crService = new CrService;
let userService = new UserService;

io.on('connection', (socket: any) =>
{
    socket.on('skill-learn-requested', async (uid: string, crID: string) =>
    {
        let cr = await crService.getCreatureById(crID);
        if (uid === cr.ownedBy && cr.skillPicks.length !== 0)
        {
            const options = cr.skillPicks.shift();
            socket.emit('skill-pick-ready', options);

            socket.on('skill-option-selected', async (index: number) =>
            {
                await crService.learnSkill(crID, options[index]);
                await crService.replaceSkillPicks(crID, cr.skillPicks);
                socket.disconnect();
            });

            socket.on('skill-pick-skipped', async () =>
            {
                await crService.replaceSkillPicks(crID, cr.skillPicks);
                socket.disconnect();
            });
        }
        else socket.disconnect();
    });

    socket.on('attr-plus', async (uid: string, crID: string, which: string) =>
    {
        let cr = await crService.getCreatureById(crID);
        if (cr.lvlup > 0 && cr.ownedBy === uid)
        {        
            switch (which)
            {
                case 'str':
                    cr.str++;
                    break;

                case 'agi':
                    cr.agi++;
                    break;

                case 'int':
                    cr.int++;
                    break;

                default:
                    break;
            }
            cr.lvlup--;

            await crService.updateCreature(crID, cr);
            socket.disconnect();
        }
        else socket.disconnect();
    });

    socket.on('create-creature', async (uid: string) =>
    {
        let user = await userService.getUser(uid);
        if (user.ownedCreatures.length === 0)
        {
            let newCr = generateCreature();
            newCr.ownedBy = uid;
            const result = await crService.addCreature(newCr, uid);
            if (!result)
            {
                console.log("Failed to create creature.");
            }
            else
            {
                await userService.registerCreature(uid, result);
                socket.emit('creature-created');
            }
        }
        socket.disconnect();
    });
});

server.listen(1200, () => {
    console.log('Server listening on port', 1200);
});