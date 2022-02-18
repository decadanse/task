const { expect } = require("chai")
const { ethers } = require("hardhat")
const { api } = require("./utils/gnosis.js");



describe("Voting dApp", function () {

    //assigning global variables to be used within the unit tests
    let owner;
    let cand1;
    let cand2;
    let cand3;
    let voter1;
    let voter2;
    let voter3;
    let voters;

    let Voting;
    let BallotVoting;


//https://stackoverflow.com/questions/70553717/error-trying-to-obtain-set-of-fields-from-array-of-solidity-objects

    const proposalNames = [ethers.utils.formatBytes32String("Proposal_1"),
                           ethers.utils.formatBytes32String("Proposal_2"),
                           ethers.utils.formatBytes32String("Proposal_3")];

    //beforeEach will be executed before every unit test

    beforeEach(async function () {

        //linking the contract ABI
        Voting = await ethers.getContractFactory("Ballot");

        BallotVoting  = await Voting.deploy(proposalNames);

        //deconstructing array into owner, candidates and voters
        //signers returns an array of 20 signers on the hardhat testing node
        //the address at index 0 is the owner's address
        [owner, cand1, cand2, cand3, voter1, voter2, voter3, ...voters] = await ethers.getSigners();

        //giveRightToVote three candidates
        await BallotVoting.giveRightToVote(cand1.address);
        await BallotVoting.giveRightToVote(cand2.address);
        await BallotVoting.giveRightToVote(cand3.address);

        //vote three ballots
        await BallotVoting.vote(1);
        // await BallotVoting.vote(2);
        // await BallotVoting.vote(3);

    }
    );

  // 2) Voting dApp
  //      "before each" hook for "Minting a ballot and transfering it to an address on the network":
  //    Error: Transaction reverted: function call to a non-contract account
      // at Ballot.constructor (contracts/voting/Ballot.sol:46)


    describe("safeMint, safeMintMany", function () {
        it("Minting a ballot and transfering it to an address on the network", async function () {
            expect(await BallotVoting.balanceOf(voter1.address)).to.equal(1);
        });

        it("Attempting to send a voter a ballot twice", async function () {
            await expect(BallotVoting.vote(1)).to.be.revertedWith("The voter already voted.");
        });

        it("Testing safeMintMany", async function () {
            //mapping voters to an array of addresses
            let addresses = [];
            for (let i = 0; i < voters.length; i++) {
                addresses[i] = voters[i].address
            }

            BallotVoting.safeMintMany(addresses)

            for (let i = 0; i < voters.length; i++) {
                expect(await BallotVoting.balanceOf(addresses[0])).to.equal(1);
            }
        });
    });


    describe("Adding Candidates", function () {
        it("Checking if a candidate exists", async function () {
            expect(await BallotVoting.candidates(0)).to.equal(cand1.address);
        });

        it("Attempting to add an existing candidate", async function () {
            await expect(BallotVoting.addCandidates(cand1.address)).to.be.revertedWith("Candidate Exists");
        });
    });


    describe("Voting", function () {
        it("Placing a valid vote for a candidate", async function () {
            await BallotVoting.connect(voter1).vote(cand1.address);
            expect(await BallotVoting.votesForCandidate(cand1.address)).to.equal(1);
        });
        -
            it("Failed vote without a ballot", async function () {
                await BallotVoting.connect(voter1).vote(cand1.address);

                await expect(BallotVoting.connect(voter1).vote(cand1.address)).to.be.revertedWith("No Ballots");
            });

        it("Failed vote after election has concluded", async function () {

            await BallotVoting.conclude()
            await expect(BallotVoting.connect(voter1).vote(cand1.address)).to.be.revertedWith("Concluded");
        });


    });


    //Testing the conlude function
    describe("conclude()", function () {
        it("Checking if active status is changed to false", async function () {
            await BallotVoting.connect(voter1).vote(cand1.address);
            await BallotVoting.connect(voter2).vote(cand2.address);
            await BallotVoting.connect(voter3).vote(cand2.address);
            await BallotVoting.conclude();

            expect(await BallotVoting.active()).to.equal(false);
        });

        it("Correct winner is declared", async function () {
            await BallotVoting.connect(voter1).vote(cand1.address);
            await BallotVoting.connect(voter2).vote(cand2.address);
            await BallotVoting.connect(voter3).vote(cand2.address);
            await BallotVoting.conclude();

            expect(await BallotVoting.winner()).to.equal(cand2.address);
        });

        it("Draw scenario", async function () {
            await BallotVoting.connect(voter1).vote(cand1.address);
            await BallotVoting.connect(voter2).vote(cand2.address);
            await BallotVoting.conclude();

            expect(await BallotVoting.winner()).to.equal("0x0000000000000000000000000000000000000000");
        });
    });
});