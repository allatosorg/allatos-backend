import { initializeApp } from "firebase/app";
import { getFirestore} from 'firebase/firestore/lite';
import { firebaseConfig } from "./fbaseconfig";
import { CrService } from "./db_services/crService";
import { Activity } from "./models/activity";
import { resolveAct } from "./tools/actResolver";
import { UserService } from "./db_services/userService";
import { GenericService } from "./db_services/genericService";
import * as express from "express";
import { createServer } from "https";
import { Server, Socket} from "socket.io"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import * as fs from 'fs';

var privateKey = fs.readFileSync( 'privatekey.pem' );
var certificate = fs.readFileSync( 'certificate.pem' );
const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);
const schedule = require('node-schedule');
const crService = new CrService;
const userService = new UserService;
const genericService = new GenericService;

const actMap = new Map<string, any>;

(async () =>
{
    try
    {
        await rebuildOngoingActs();
    } catch (e) {}
})();
const app = express();
const server = createServer(
{
    key: privateKey,
    cert: certificate
}, app);const io = new Server(server,
{
    cors:   
    {
        origin: '*'
    }
});

io.on('connection', (socket: Socket) =>
{
    //act is validated here
    socket.on('start-activity', async (crID: string, act: Activity) =>
    {
        if (canGo(crID, act))
        {
            let newAct = await genericService.getAct(act.name);
            newAct.startDate = new Date();
            await scheduleAct(crID, newAct);
        }
        else io.to(socket.id).emit('start-activity-failed');
        socket.disconnect();
    });
});

function canGo(crID: string, act: Activity): boolean
{
    if (actMap.has(crID))
    {
        return false;
    }
    else return true;
}

async function rebuildOngoingActs()
{
    let crs = await crService.getAllCreatures();
    crs.forEach(async cr =>
    {
        if (cr.currentAct)
        {
            const endDate = calcEndDate(cr.currentAct.startDate, cr.currentAct.duration);
            if (endDate > new Date())
            {
                await scheduleAct(cr.crID, cr.currentAct);
            }
            else
            {
                await finishAct(cr.crID, cr.currentAct);
            }
        }
    });
}

async function scheduleAct(crID: string, act: Activity)
{
    crService.setAct(crID, act);
    actMap.set(crID, schedule.scheduleJob(calcEndDate(act.startDate, act.duration), async () => { finishAct(crID, act) }));
}

function calcEndDate(startDate: Date, duration: number): Date
{
    return new Date(new Date(startDate).getTime() + duration);
}

async function finishAct(crID: string, act: Activity)
{
    let cr = await crService.getCreatureById(crID);
    const noti = await resolveAct(cr, act);
    await crService.updateCreature(crID, cr);
    await userService.sendNotification(cr.ownedBy, noti);

    actMap.delete(crID);
    await crService.setAct(crID);
}

server.listen(1100, () => {
    console.log('Server listening on port', 1100);
});