import { ServerCreature } from "../models/serverCreature";

export function applyTraits(cr: ServerCreature)
{
    if (cr.traits)
    {
        for (let t of cr.traits)
        {
            if (!t.isScaling) traitFuncs.get(t.name)!(cr);
        }
    }

    return cr;
}

const traitFuncs = new Map<string, Function>
([
    ["Strong", (cr: ServerCreature): ServerCreature =>
        {
            cr.str++;
            return(cr);
        }
    ],
    ["Muscular", (cr: ServerCreature): ServerCreature =>
        {
            cr.str += 2;
            return(cr);
        }
    ],
    ["Absolutely Jacked", (cr: ServerCreature): ServerCreature =>
        {
            cr.str += 4;
            return(cr);
        }
    ],
]);