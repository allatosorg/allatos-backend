import { Creature } from "./models/creature";
import { Skill } from "./models/skill";
import { User } from "./models/user";

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http,
{
    cors:
    {
        origin: '*',
    }
});

let userSkillOptions = new Map<string, Skill[]>;

io.on('connection', (socket: any) =>
{
    console.log("asd");
});

http.listen(3005, () => {
    console.log('Server listening on port', 3005);
});