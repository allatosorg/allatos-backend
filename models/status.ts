export class Status
{
    name: string;
    description: string;
    counter: number;
    countsDown: boolean;

    constructor(name: string, description: string, counter: number, countsDown = true)
    {
        this.name = name;
        this.description = description;
        this.counter = counter;
        this.countsDown = countsDown;
    }
}