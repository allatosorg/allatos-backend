import { Creature } from "./models/creature";
import { Skill } from "./models/skill";
import { User } from "./models/user";

const io = require('socket.io')(3005,
{
    cors:
    {
        origin: ['*'],
    }
});

let userSkillOptions = new Map<string, Skill[]>;

io.on('connection', (socket: any) =>
{
    console.log("asd");
});
