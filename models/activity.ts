export class Activity
{
    name: string; //unique identifier
    description: string;
    duration: number; //milliseconds
    props: Object; //does not exist on client side
    startDate?: Date;

    constructor(name: string, description: string, duration: number, props: Object, startDate?: Date)
    {
        this.name = name;
        this.description = description;
        this.duration = duration;
        this.props = props;
        this.startDate = startDate;
    }
}