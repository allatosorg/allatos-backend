import { ServerCreature } from "../models/serverCreature";
import { generateStartingSkills } from "./skillGenerator";

export function generateCreature(): ServerCreature
{
    let randomStr = rndInt(7, 14);
    let randomInt = rndInt(7, 14);
    let randomAgi = rndInt(7, 14);
    let randomCon = rndInt(65, 85);
    let randomStam = rndInt(80, 100);
    let randomIni = rndInt(50, 100);

    const startingSkills = generateStartingSkills();

    return new ServerCreature('', names[rndInt(0, names.length - 1)], types[rndInt(0, types.length - 1)], randomStr, randomAgi, randomInt, randomCon, randomIni, '', startingSkills, [], randomStam, 0, new Date(), 1, [], 0, 0);
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