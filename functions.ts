import { Creature } from "./models/creature";
import { Skill } from "./models/skill";
import { User } from "./models/user";
import { createServer } from "http";

const express = require('express');
const app = express();
const server = createServer(app);
const { Server } = require("socket.io");
const io = new Server(server,
{
    cors:   
    {
        origin: '*',
    }
});

let userSkillOptions = new Map<string, Skill[]>;

io.on('connection', (socket: any) =>
{
    console.log("connected");
});

io.on('disconnect', (socket: any) =>
    {
        console.log("dc");
    });

server.listen(3005, () => {
    console.log('Server listening on port', 3005);
});