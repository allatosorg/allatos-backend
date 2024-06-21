import { ServerCreature } from "./serverCreature";
import { Notification } from "./notification";

export class User
{
    uid: string;
    email: string;
    username: string;
    notifications: Array<Notification>;
    ownedCreatures: Array<string>;

    constructor(uid: string, email: string, username: string, notifications: Array<Notification>, ownedCreatures: Array<string>)
    {
        this.uid = uid;
        this.email = email;
        this.username = username;
        this.notifications = notifications;
        this.ownedCreatures = ownedCreatures;
    }
}