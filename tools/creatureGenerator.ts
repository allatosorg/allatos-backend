import { ServerCreature } from "../models/serverCreature";
import { generateStartingSkills } from "./skillGenerator";
import { Trait } from "../models/trait";
import { GenericService } from "../db_services/genericService";

export async function generateCreature(): Promise<ServerCreature>
{
    const genericService = new GenericService;

    let randomStr = rndInt(7, 14);
    let randomInt = rndInt(7, 14);
    let randomAgi = rndInt(7, 14);
    let randomCon = rndInt(65, 85);
    let randomStam = rndInt(80, 100);
    let randomIni = rndInt(50, 100);

    const startingSkills = generateStartingSkills();

    const randomType = types[rndInt(0, types.length - 1)];
    const startingTraits: Array<Trait> = [];

    if (randomType === 'Mutchkuh')
    {
        randomIni += 10;
        randomCon -= 5;
        randomStam += 5;
        startingTraits.push(await genericService.getTrait("Bad Tempered"))
    }
    if (randomType === 'Tortel')
    {
        randomIni -= 15;
        randomCon += 10;
        startingTraits.push(await genericService.getTrait("Hardy"))
    }

    return new ServerCreature('', names[rndInt(0, names.length - 1)], randomType, randomStr, randomAgi, randomInt, randomCon, randomIni, '', startingSkills, startingTraits, randomStam, 0, new Date(), 1, [], 0, 0);
}

const names =
[
    "Xylar",
    "Zygon",
    "Lithos",
    "Nox",
    "Lunaia",
    "Ferros",
    "Ignis",
    "Glacius",
    "Aracnus",
    "Zephyros",
    "Fantome",
    "Hydraxis",
    "Kraken",
    "Behemoth",
    "Lumina",
    "Voltaic",
    "Gaia",
    "Zephyra",
    "Astraea",
    "Cryos",
    "Terraspin",
    "Aquarion",
    "Noctis",
    "Ferrax",
    "Fulgor",
    "Sylphina",
    "Chimera EX",
    "Leviathan Prime"
];

const types =
[
    "Mutchkuh",
    "Tortel"
];

function rndInt(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}