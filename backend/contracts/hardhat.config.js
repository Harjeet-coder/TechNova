require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

let PRIVATE_KEY = process.env.PRIVATE_KEY || "";
if (PRIVATE_KEY.length !== 64) {
    PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000000";
}

module.exports = {
    solidity: "0.8.20",
    networks: {
        amoy: {
            url: "https://rpc-amoy.polygon.technology",
            accounts: [`0x${PRIVATE_KEY}`],
        },
    },
};
