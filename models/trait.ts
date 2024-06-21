export class Trait
{
    name: string;
    description: string;
    isScaling: boolean;
    isBattle: boolean;

    constructor(name: string, description: string, isScaling: boolean, isBattle: boolean)
    {
        this.name = name;
        this.description = description;
        this.isScaling = isScaling;
        this.isBattle = isBattle;
    }
}