import { ethers, waffle } from "hardhat";
import chai from "chai";
import { MockProvider, solidity } from "ethereum-waffle";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
const { expect } = chai;

const VOTE_FOR = 1;
const VOTE_ABSTAIN = 2;
const VOTE_AGAINST = 3;

const TIMESTAMP: number = Math.ceil(Date.now() / 1000) + 60;

describe("Governance", async () => {
  let token: Contract;
  let governance: Contract;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  let user6: SignerWithAddress;

  beforeEach(async () => {
    [admin, user1, user2, user3, user4, user5, , user6] =
      await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("Token");
    token = await tokenFactory.deploy();
    await token.deployed();

    const governanceFactory = await ethers.getContractFactory("Governance");
    governance = await governanceFactory.deploy(token.address);
    await governance.deployed();

    await token.connect(admin).setGovernanceAddress(governance.address);
  });

  describe("Successfully deployed governance contract", () => {
    describe("Setting voting start and end date", () => {
      it("Should let only admin change voting start and end time", async () => {
        await expect(governance.connect(user1).setVotingStartTime(TIMESTAMP)).to
          .be.reverted;
        await governance.connect(admin).setVotingStartTime(TIMESTAMP);
        expect(Number(await governance.votingStartTime())).to.be.greaterThan(0);
      });

      it("Shouldnt let admin set end time if start time hasnt been set", async () => {
        await expect(governance.connect(admin).setVotingEndTime(TIMESTAMP)).to
          .be.reverted;
      });

      it("Should let admin set VALID end time if start time has been set", async () => {
        await governance.connect(admin).setVotingStartTime(TIMESTAMP);
        await expect(governance.setVotingEndTime(TIMESTAMP + 86399)).to.be
          .reverted;
        await governance.setVotingEndTime(TIMESTAMP + 86400);
        expect(Number(await governance.votingEndTime())).to.be.greaterThan(0);
      });
    });

    describe("Setting minimum votes required", () => {
      it("Should let only admin change minimum votes required", async () => {
        const minVotes = 100;
        await expect(
          governance.connect(user1).setMinimumVotesRequired(minVotes)
        ).to.be.reverted;
        await governance.connect(admin).setMinimumVotesRequired(minVotes);
        expect(
          Number(await governance.minimumVotesRequired())
        ).to.be.greaterThan(0);
      });

      it("Should let admin set only proper values", async () => {
        await expect(governance.connect(admin).setMinimumVotesRequired(-1)).to
          .be.reverted;
        await expect(governance.setMinimumVotesRequired(2 ** 32)).to.be
          .reverted;
      });
    });

    describe("Setting settlement percentage values", () => {
      const lowerLimit: number = 30;
      const upperLimit: number = 70;
      it("Should let only admin change settlement percentage values", async () => {
        await expect(
          governance.connect(user1).setPercentageLimits(lowerLimit, upperLimit)
        ).to.be.reverted;
        await governance
          .connect(admin)
          .setPercentageLimits(lowerLimit, upperLimit);
        expect(
          Number(await governance.upperPercentageRejectedLimit())
        ).to.be.eq(30);
        expect(
          Number(await governance.lowerPercentageAcceptedLimit())
        ).to.be.eq(70);
      });

      it("Should let admin set only proper values", async () => {
        await expect(
          governance.connect(admin).setPercentageLimits(lowerLimit, lowerLimit)
        ).to.be.reverted;
        await expect(governance.setPercentageLimits(0, upperLimit)).to.be
          .reverted;
        await expect(governance.setPercentageLimits(lowerLimit, 101)).to.be
          .reverted;
      });
    });

    describe("Setting and getting whitelist info", () => {
      it("Should let only admin get whitelist info", async () => {
        await expect(
          governance.connect(user1).modifyWhitelistAccess(user1.address, true)
        ).to.be.reverted;
        await expect(
          governance.connect(user1).checkIfAddressIsWhitelisted(user1.address)
        ).to.be.reverted;
        expect(
          await governance
            .connect(admin)
            .checkIfAddressIsWhitelisted(user1.address)
        ).to.be.false;
      });

      it("Should let only admin set whitelist info", async () => {
        await governance.modifyWhitelistAccess(user1.address, true);
        expect(await governance.checkIfAddressIsWhitelisted(user1.address)).to
          .be.true;
      });
    });

    describe("Submitting a vote and generating results", () => {
      it("Should let user1 vote after being added to whitelist", async () => {
        await governance.connect(admin).setVotingStartTime(TIMESTAMP);
        await governance.setVotingEndTime(TIMESTAMP + 86400);
        await ethers.provider.send("evm_mine", [TIMESTAMP + 61]);
        await governance.modifyWhitelistAccess(user1.address, true);
        expect(Number(await token.totalSupply())).to.be.eq(0);
        await governance.connect(user1).submitVote(VOTE_FOR);
        expect(Number(await token.totalSupply())).to.be.eq(1);
      });

      it("Should let admin generate results after simulated voting", async () => {
        await governance.connect(admin).setVotingStartTime(TIMESTAMP + 100);
        await governance.setVotingEndTime(TIMESTAMP + 86500);
        await ethers.provider.send("evm_mine", [TIMESTAMP + 161]);
        expect(Number(await token.totalSupply())).to.be.eq(0);
        await governance.modifyWhitelistAccess(user1.address, true);
        await governance.modifyWhitelistAccess(user2.address, true);
        await governance.modifyWhitelistAccess(user3.address, true);
        await governance.modifyWhitelistAccess(user4.address, true);
        await governance.modifyWhitelistAccess(user5.address, true);
        await governance.modifyWhitelistAccess(user6.address, true);

        await governance.connect(user1).submitVote(VOTE_FOR);
        await governance.connect(user2).submitVote(VOTE_FOR);
        await governance.connect(user3).submitVote(VOTE_FOR);
        await governance.connect(user4).submitVote(VOTE_ABSTAIN);
        await governance.connect(user5).submitVote(VOTE_AGAINST);
        await governance.connect(user6).submitVote(VOTE_AGAINST);
        expect(Number(await token.totalSupply())).to.be.eq(6);

        await ethers.provider.send("evm_mine", [TIMESTAMP + 90000]);
        const tx = await governance.connect(admin).generateVotingResult();
        expect(tx).to.emit(governance, "VotingResults").withArgs(3, 1, 2, 6);

        const receipt = await tx.wait();
        console.log(receipt.events);
      });
    });
  });
});
