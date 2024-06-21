import { GenericService } from "./db_services/genericService";

const actService = new GenericService;

let props =
{
    trait: null,
    xp: 6
}

actService.createAct('Visit the Magical Pond', '', 90000, props);