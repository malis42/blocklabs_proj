import { ethers } from "hardhat";

async function main() {
  const [admin] = await ethers.getSigners();

  const tokenFactory = await ethers.getContractFactory("Token");
  const token = await tokenFactory.deploy();
  await token.deployed();

  const governanceFactory = await ethers.getContractFactory("Governance");
  const governance = await governanceFactory.deploy(token.address);
  await governance.deployed();

  await token.connect(admin).setGovernanceAddress(governance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
