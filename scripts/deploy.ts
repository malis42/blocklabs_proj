import { ethers } from "hardhat";

async function main() {
  const tokenFactory = await ethers.getContractFactory("Token");
  const token = await tokenFactory.deploy();
  await token.deployed();

  const governanceFactory = await ethers.getContractFactory("Governance");
  const governance = await governanceFactory.deploy(token.address);
  await governance.deployed();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
