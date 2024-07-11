export function calcXpRequirement(lvl: number): number
{
    return Math.floor(90 + 10* Math.pow(((lvl + 2) / 3), 2));
}