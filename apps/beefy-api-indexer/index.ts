import { runMain } from "@beefy-databarn/async-tools";
import { SamplingPeriod, allSamplingPeriods } from "@beefy-databarn/time";
import yargs from "yargs";
import { watchBeefyApi } from "./src/watch";

async function main() {
    await yargs
        .usage("$0 <cmd> [args]")
        .command({
            command: "watch",
            describe: "watch beefy api and index it into the db",
            builder: yargs =>
                yargs.options({
                    interval: {
                        choices: allSamplingPeriods,
                        alias: "i",
                        demand: true,
                        default: "15min",
                        describe: "Refresh interval",
                    },
                }),
            handler: async argv => {
                await watchBeefyApi(argv.interval as SamplingPeriod);
            },
        })
        .demandCommand()
        .help().argv;
}

runMain(main);
