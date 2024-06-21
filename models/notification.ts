export class Notification
{
    title: string;
    description: string;
    type: string;
    date: Date;

    constructor(title: string, description: string, type: string, date: Date)
    {
        this.title = title;
        this.description = description;
        this.type = type;
        this.date = date;
    }
}