import { BattleSession } from "./battleSession";
import { ServerCreature } from "./models/serverCreature";
import { CrService } from "./db_services/crService";
import * as express from "express";
import { createServer } from "https";
import { Server, Socket} from "socket.io"
import * as fs from 'fs';
import * as http from "http";

const crService = new CrService;
const battlesInProgress = new Map<string, BattleSession>;
const waiting: Array<any> = [];
let pairingPeople = false;
let roomCounter = 0;

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

io.on('connection', (socket: any) =>
{
  socket.on('queue-up', async (uid: string, crID: string, successCb: Function) =>
  {
    const cr = await crService.getCreatureById(crID);
    if (cr.ownedBy !== uid) socket.disconnect();

    socket.data.uid = uid;
    socket.data.crID = crID;
    if (!waiting.includes(socket) && !(cr.currentAct))
    {
      waiting.push(socket);
      successCb();
    }
  });

  socket.on('disconnect', () =>
  {
    waiting.splice(waiting.indexOf(socket), 1);
    console.log('Socket disconnected: '+ socket.id);
  });

  socket.on('game-state-requested', () =>
  {
    battlesInProgress.get(socket.data.roomID)?.sendGameState();
  });

  socket.on('play-skill', (owneruid: string, index: number) =>
  {
    let battle = battlesInProgress.get(socket.data.roomID);
    battle.skillPicked(owneruid, index, socket);
  });
});

//TODO: handle abandoned matches (needs timer etc) to avoid memory leak
//start matching people every 5 seconds
setInterval(async () =>
{
  if (!pairingPeople)
  {
    pairingPeople = true;

    while (waiting.length >= 2)
    { 
      console.log("can match");
      let socket1 = waiting.shift();
      let socket2 = waiting.shift();
      roomCounter++;
      await joinRoom(socket1, socket1.data.crID, roomCounter.toString());
      await joinRoom(socket2, socket2.data.crID, roomCounter.toString());
    }

    pairingPeople = false;
  }
}, 5000);

async function joinRoom(socket: any, crID: string, roomID: string)
{
  await socket.join(roomID);
  socket.data.roomID = roomID;

  if (!battlesInProgress.has(roomID)) //if it's the first user joining the room (for the first time)
  {
    let newBattle = new BattleSession(roomID, await crService.getCreatureById(crID), io, async (winner: ServerCreature) =>
    {
      if (winner) await crService.addWin(winner);
      battlesInProgress.delete(roomID);
    });
    newBattle.sockets[0] = socket;

    battlesInProgress.set(roomID, newBattle);
  }
  else if (battlesInProgress.get(roomID)!.uids[1] === undefined) //if joining user is the second one to connect (to new match)
  {
    let battle = battlesInProgress.get(roomID);
    battle.sockets[1] = socket;

    battle.addSecondPlayer(await crService.getCreatureById(crID));
    io.to(roomID).emit('players-ready');
  }
  else //user is rejoining, check if its p1 or p2
  {
    let battle = battlesInProgress.get(roomID);
    battle.playerRejoin(socket);
  }
};

server.listen(1300, () => {
  console.log('Server listening on port', 1300);
});