const hre = require("hardhat");

async function main() {
    const Registry = await hre.ethers.getContractFactory("EvidenceRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    console.log("Contract deployed at:", await registry.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
