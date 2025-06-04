import { middlewareLoggedIn, handlerLogin, registerCommand, runCommand, registerHandler, resetHandler, getUsersHandler, aggHandler, addFeedHandler, getFeedsHandler, followingHandler, followHandler, unfollowHandler, browseHandler, type CommandsRegistry } from "./commands.js";

async function main() {
    const argv = process.argv;
    const [commandName, ...args] = argv.slice(2);

    const CommandsRegistry: CommandsRegistry = {};
    registerCommand(CommandsRegistry, "login", handlerLogin);
    registerCommand(CommandsRegistry, "register", registerHandler);
    registerCommand(CommandsRegistry, "reset", resetHandler);
    registerCommand(CommandsRegistry, "users", getUsersHandler);
    registerCommand(CommandsRegistry, "agg", aggHandler);
    registerCommand(CommandsRegistry, "addfeed", middlewareLoggedIn(addFeedHandler));    
    registerCommand(CommandsRegistry, "feeds", getFeedsHandler);
    registerCommand(CommandsRegistry, "following", middlewareLoggedIn(followingHandler));
    registerCommand(CommandsRegistry, "follow", middlewareLoggedIn(followHandler));
    registerCommand(CommandsRegistry, "unfollow", middlewareLoggedIn(unfollowHandler));
    registerCommand(CommandsRegistry, "browse", middlewareLoggedIn(browseHandler));

    if (!commandName) {
        console.log("Not enough arguments were provided.");
        process.exit(1);
    }

    try {
        await runCommand(CommandsRegistry, commandName, ...args);
    } catch (err) {
        console.log(`Error: ${err}`);
        process.exit(1);
    }

    process.exit(0);
}

main();
