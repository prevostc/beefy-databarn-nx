import { runMain } from "@beefy-databarn/async-tools";
import yargs from "yargs";
import { migrate } from "./src/run-migrations";

async function main() {
    await yargs
        .usage("$0 <cmd> [args]")
        .command({
            command: "migrate",
            describe: "apply db migrations",
            builder: yargs =>
                yargs.options({
                    target: {
                        type: "number",
                        alias: "t",
                        describe: "Target migration version",
                    },
                }),
            handler: async argv => {
                await migrate(argv.target === undefined ? "max" : argv.target);
            },
        })
        .demandCommand()
        .help().argv;
}

runMain(main);
