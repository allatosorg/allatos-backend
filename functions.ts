import { CrService } from "./db_services/crService";
import { UserService } from "./db_services/userService";
import { generateCreature } from "./tools/creatureGenerator";
import * as express from "express";
import { createServer } from "https";
import * as http from "http";
import { Server, Socket} from "socket.io"
import * as fs from 'fs';

const app = express();
let server: any;
try 
{
    var privateKey = fs.readFileSync( 'privkey.pem' );
    var certificate = fs.readFileSync( 'fullchain.pem' );
    server = createServer(
    {
        key: privateKey,
        cert: certificate
    }, app);
    var io = new Server(server,
    {
        cors:   
        {
            origin: 'https://allatos-umber.vercel.app'
        }
    });
}
catch (error)
{
    server = http.createServer(
    {}, app);
    var io = new Server(server,
    {
        cors:   
        {
            origin: '*'
        }
    });
}

let crService = new CrService;
let userService = new UserService;

io.on('connection', (socket: any) =>
{
    socket.on('skill-learn-requested', async (uid: string, crID: string) =>
    {
        try
        {
            let cr = await crService.getCreatureById(crID);
            if (uid === cr.ownedBy && cr.skillPicks.length !== 0 && !(cr.currentAct))
            {
                const options = cr.skillPicks.shift();
                socket.emit('skill-pick-ready', options);
    
                socket.on('skill-option-selected', async (index: number) =>
                {
                    try
                    {
                        await crService.learnSkill(crID, options[index]);
                        await crService.replaceSkillPicks(crID, cr.skillPicks);
                    }
                    catch(err)
                    {
                        console.error(err);
                    }
                    finally
                    {
                        socket.disconnect();
                    }
                });
    
                socket.on('skill-pick-skipped', async () =>
                {
                    await crService.replaceSkillPicks(crID, cr.skillPicks);
                    socket.disconnect();
                });
            }
            else socket.disconnect();
        }
        catch(err)
        {
            console.error(err);
            socket.disconnect();
        }
    });

    socket.on('attr-plus', async (uid: string, crID: string, which: string) =>
    {
        try
        {
            let cr = await crService.getCreatureById(crID);
            if (cr.lvlup > 0 && cr.ownedBy === uid)
            {        
                switch (which)
                {
                    case 'str':
                        if (cr.str < 20) cr.str++;
                        break;
    
                    case 'agi':
                        if (cr.agi < 20) cr.agi++;
                        break;
    
                    case 'int':
                        if (cr.int < 20) cr.int++;
                        break;
    
                    default:
                        break;
                }
                cr.lvlup--;
                await crService.updateCreature(crID, cr);
            }
        }
        catch(err)
        {
            console.error(err);
        }
        finally
        {
            socket.disconnect();
        }
    });

    socket.on('create-creature', async (uid: string) =>
    {
        try
        {
            let user = await userService.getUser(uid);
            if (user.ownedCreatures.length === 0)
            {
                let newCr = await generateCreature();
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
        }
        catch(err)
        {
            console.error(err);
        }
        finally
        {
            socket.disconnect();
        }
    });
});

server.listen(1200, () => {
    console.log('Server listening on port', 1200);
});