import { ServerCreature } from "../../models/serverCreature";

export const traitFuncs = new Map<string, Function>
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
    ["Cursed", (cr: ServerCreature): ServerCreature =>
        {
            cr.str --;
            cr.agi --;
            cr.int--;
            cr.con -= 5;
            return(cr);
        }
    ],
]);