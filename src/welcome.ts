import chalk from "chalk";
import figlet from "figlet";
import os from "os";

function getIPv4LocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const item of interfaces[name] || []) {
            const { address, family, internal } = item;
            if (family === "IPv4" && !internal) {
                return address;
            }
        }
    }
}

function getIPv6LocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const item of interfaces[name] || []) {
            const { address, family, internal } = item;
            if (family === "IPv6" && !internal) {
                return address;
            }
        }
    }
}

export function welcome(port: number) {
    const { green, bold } = chalk;
    const IPv4 = getIPv4LocalIP();
    const IPv6 = getIPv6LocalIP();
    const memoryGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const cpu = os.cpus()[0].model;

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
    console.log(`- Network(IPv4): http://${IPv4}:${port}`);
    console.log(`- Network(IPv6): http://[${IPv6}]:${port}`);
    console.log(`- CPU: ${cpu}`);
    console.log(`- Memory: ${memoryGB}GB`);
}
