import { Status } from "../../models/status";

export const allStatuses = new Map<string, Status>
([
    [ "Weakened", new Status("Weakened", "You deal 25% less damage with attacks.", 1) ],
    [ "Pumped", new Status("Pumped", "You deal 25% more damage with attacks.", 1) ],
    [ "Vulnerable", new Status("Vulnerable", "You take 25% more damage from attacks.", 1) ],
    [ "First", new Status("First", "You won the initiative roll, and you will be first to act.", 1) ],
    [ "Fatigued",  new Status("Fatigued", "You're exhausted and need to rest. You can only play 1 card this turn and you became Vulnerable.", 1) ],
    [ "Bolstered", new Status("Bolstered", "You gain more block from cards.", 1, false) ],
    [ "Strengthened", new Status("Strengthened", "You deal more damage with attacks.", 1, false) ],
    [ "Steadfast", new Status("Steadfast", "You don't lose your block at the end of turn.", 1) ],
    [ "Controlled Breathing", new Status("Controlled Breathing", "Recover stamina at the end of each turn.", 1) ],
]);
