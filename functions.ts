import { Creature } from "./models/creature";
import { Skill } from "./models/skill";
import { User } from "./models/user";
import { createServer } from "http";
import { Server, Socket} from "socket.io"
import * as express from "express";

const app = express();
const server = createServer(app);
const io = new Server(server,
{
    cors:   
    {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true 
    }
});

let userSkillOptions = new Map<string, Skill[]>;

io.on('connection', (socket: any) =>
{
    console.log("connected");

    io.on('disconnect', (socket: any) =>
    {
        console.log("dc");
    });
});

server.listen(process.env.PORT || 3005, () => {
    console.log('Server listening on port', process.env.PORT || 3005);
});