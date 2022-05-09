import { ethers, waffle } from "hardhat";
import chai from "chai";
import { MockProvider, solidity } from "ethereum-waffle";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
const { expect } = chai;

let TIMESTAMP: number = Math.ceil(Date.now() / 1000) + 60;

describe("Governance", async () => {
  let token: Contract;
  let governance: Contract;
  let admin: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async () => {
    [admin, user] = await ethers.getSigners();
    // const tokenFactory = await ethers.getContractFactory("Token");
    // token = await tokenFactory.deploy();
    // await token.deployed();

    const governanceFactory = await ethers.getContractFactory("Governance");
    governance = await governanceFactory.deploy();
    await governance.deployed();
  });

  describe("Successfully deployed governance contract", () => {
    it("Should let only admin change voting start and end time", async () => {
      await expect(governance.connect(user).setVotingStartTime(TIMESTAMP)).to.be
        .reverted;
      await governance.connect(admin).setVotingStartTime(TIMESTAMP);
      expect(Number(await governance.votingStartTime())).to.be.greaterThan(0);
    });

    it("Shouldnt let admin set end time if start time hasnt been set", async () => {
      await expect(governance.connect(admin).setVotingEndTime(TIMESTAMP)).to.be
        .reverted;
    });

    it("Should let admin set VALID end time if start time has been set", async () => {
      await governance.connect(admin).setVotingStartTime(TIMESTAMP);
      await expect(governance.setVotingEndTime(TIMESTAMP + 86399)).to.be
        .reverted;
      await governance.setVotingEndTime(TIMESTAMP + 86400);
      expect(Number(await governance.votingEndTime())).to.be.greaterThan(0);
    });

    it("Should let only admin change minimum votes required", async () => {
      const minVotes = 100;
      await expect(governance.connect(user).setMinimumVotesRequired(minVotes))
        .to.be.reverted;
      await expect(governance.connect(admin).setMinimumVotesRequired(-1)).to.be
        .reverted;
      await expect(governance.setMinimumVotesRequired(2 ** 32)).to.be.reverted;
      await governance.setMinimumVotesRequired(minVotes);
      expect(Number(await governance.minimumVotesRequired())).to.be.greaterThan(
        0
      );
    });

    it("Should let only admin change settlement precentage values", async () => {
      const lowerLimit = 30;
      const upperLimit = 70;
      await expect(
        governance.connect(user).setPercentageLimits(lowerLimit, upperLimit)
      ).to.be.reverted;
      await expect(
        governance.connect(admin).setPercentageLimits(lowerLimit, lowerLimit)
      ).to.be.reverted;
      await expect(governance.connect(admin).setPercentageLimits(0, upperLimit))
        .to.be.reverted;
      await expect(
        governance.connect(admin).setPercentageLimits(lowerLimit, 101)
      ).to.be.reverted;
      await governance.setPercentageLimits(lowerLimit, upperLimit);
      expect(Number(await governance.upperPercentageRejectedLimit())).to.be.eq(
        30
      );
      expect(Number(await governance.lowerPercentageAcceptedLimit())).to.be.eq(
        70
      );
    });

    it("Should let only admin set and get whitelist info", async () => {
      await expect(
        governance.connect(user).modifyWhitelistAccess(user.address, true)
      ).to.be.reverted;
      await expect(governance.connect(user).checkIfAddressIsWhitelisted(user.address)).to.be
        .reverted;
      expect(
        await governance
          .connect(admin)
          .checkIfAddressIsWhitelisted(user.address)
      ).to.be.false;
      await governance.modifyWhitelistAccess(user.address, true);
      expect(await governance.checkIfAddressIsWhitelisted(user.address)).to.be
        .true;
    });
  });
});
