import { processDatabase } from "kanel";
import { kanelConfig } from "./kanelrc";

async function run() {
    await processDatabase(kanelConfig);
}

run();
