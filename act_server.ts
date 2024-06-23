import { initializeApp } from "firebase/app";
import { getFirestore} from 'firebase/firestore/lite';
import { firebaseConfig } from "./fbaseconfig";
import { CrService } from "./db_services/crService";
import { Activity } from "./models/activity";
import { resolveAct } from "./tools/actResolver";
import { UserService } from "./db_services/userService";
import { GenericService } from "./db_services/genericService";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);
const io = require('socket.io')(3010,
{
    cors:
    {
    origin: ['https://allatos-umber.vercel.app/'],
    }
});
const schedule = require('node-schedule');
const crService = new CrService;
const userService = new UserService;
const genericService = new GenericService;

const actMap = new Map<string, any>;
rebuildOngoingActs();

io.on('connection', (socket: any) =>
{
    //act is validated here
    socket.on('start-activity', async (crID: string, act: Activity) =>
    {
        if (canGo(crID, act))
        {
            let newAct = await genericService.getAct(act.name)
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
    crs.forEach(cr =>
    {
        if (cr.currentAct)
        {
            const endDate = calcEndDate(cr.currentAct.startDate, cr.currentAct.duration);
            if (endDate > new Date())
            {
                scheduleAct(cr.crID, cr.currentAct);
            }
            else
            {
                finishAct(cr.crID, cr.currentAct);
            }
        }
    });
}

async function scheduleAct(crID: string, act: Activity)
{
    actMap.set(crID, schedule.scheduleJob(calcEndDate(act.startDate, act.duration), () => { finishAct(crID, act) }));
    await crService.setAct(crID, act);
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