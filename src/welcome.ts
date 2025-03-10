import chalk from "chalk";
import figlet from "figlet";
import os from "os";

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for(const name of Object.keys(interfaces)) {
        for(const item of interfaces[name] || []) {
            const { address, family, internal } = item;
            if(family === "IPv4" && !internal) {
                return address;
            }
        }
    }
}

export function welcome(port: number) {
    const { green, bold } = chalk;
    const localIP = getLocalIP();
    console.log(
        green(
            figlet.textSync("TimesEats", {
                font: "Standard",
                horizontalLayout: "default",
                verticalLayout: "default",
            })
        )
    );
    console.log(bold("Welcome to TimesEats!"));
    console.log(`Server is running on port ${port}`);
    console.log(bold("Server Info:"));
    console.log(`- Local: http://localhost:${port}`);
    console.log(`- Network: http://${localIP}:${port}`);
}