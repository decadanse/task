const { expect } = require("chai")
const { ethers } = require("hardhat")
// const { api } = require("./utils/gnosis.js");
const { lbp } = require("./deploy-lbp.js");
const { seed } = require("./deploy-seed.js");
const { constants } = require("@openzeppelin/test-helpers");
const init = require("../test-init.js");

const deploy = async () => {
  const setup = await init.initialize(await ethers.getSigners());

  setup.gnosisSafe = await init.getContractInstance(
    "GnosisSafe",
    setup.roles.prime
  );

  setup.proxySafe = await init.getGnosisProxyInstance(setup);

  setup.seedFactory = await init.getContractInstance(
    "SeedFactory",
    setup.roles.prime
  );

  setup.seed = await init.getContractInstance("Seed", setup.roles.prime);


  // // setup.ballot = await init.getContractInstance("Ballot", setup.roles.prime, [], setup.seed); //error
  //   const proposalNames = [ethers.utils.formatBytes32String("Proposal_1"),
  //                           ethers.utils.formatBytes32String("Proposal_2"),
  //                           ethers.utils.formatBytes32String("Proposal_3")];
  // Voting = await ethers.getContractFactory("Ballot");
  // // BallotVoting  = await Voting.deploy(proposalNames, setup.Signer_Factory.address); //error here in Ballot.sol
  // BallotVoting  = await Voting.deploy(proposalNames, setup.seed.address); //error here in Ballot.sol

  await setup.seedFactory
    .connect(setup.roles.prime)
    .setMasterCopy(setup.seed.address);

  setup.data = {};

  return setup;
};

// есть несколько верояностей, во первых в Voting.deploy нужен был setup.seed.address
// Вероятно проблема в том что в реальности seed не задеплоен
// Я бы советовал попробовать задеплоить его локально, и уже потом ранить 
// тесты с этим локально задеплоеным сидом(Через Factory, все как обычно)



describe("Contract: Voting", async () => {
  let setup;
  let nonce = 0;
  let Signer_Factory;
  let Voting;

    const proposalNames = [ethers.utils.formatBytes32String("Proposal_1"),
                            ethers.utils.formatBytes32String("Proposal_2"),
                            ethers.utils.formatBytes32String("Proposal_3")];
    const zeroProposalNames = [];//ethers.utils.formatBytes32String("")];


  before("!! setup", async () => {
    setup = await deploy();
    Signer_Factory = await ethers.getContractFactory(
      "Signer",
      setup.roles.root
    );
    Voting = await ethers.getContractFactory(
      "Ballot",
      setup.roles.root
    )

    // Voting = await ethers.getContractFactory("Ballot");
    BallotVoting  = await Voting.deploy(proposalNames, setup.seed.address); //FINE //NO MORE error here in Ballot.sol


    // //linking the contract ABI
    // Voting = await ethers.getContractFactory("Ballot");
    // BallotVoting  = await Voting.deploy(proposalNames, setup.signer.address); //error here in Ballot.sol

  });
  context(">> deploy voting contract", async () => {
    context("invalid constructor parameters", async () => {
      // it("reverts when voting propasals is empty", async () => {
      //   await expect(
      //     BallotVoting.delegate()
      //   ).to.revertedWith(
      //     "BallotVoting:  cannot be empty"
      //   );
      // });
      it("Has no right to vote" , async () => {
        await expect(
            BallotVoting.vote(1)
        ).to.revertedWith(
          'Has no right to vote'
        );         
      }); 

      it("giveRightToVote" , async () => {
        // BallotVoting.delegate(setup.roles.buyer1.address);
        BallotVoting.giveRightToVote(setup.roles.buyer2.address);        
      });

      it("addOwnerToGnosis" , async () => {
        // BallotVoting.delegate(setup.roles.buyer1.address);
        BallotVoting.addOwnerToGnosis(setup.roles.buyer1.address);        
      });

      it("removeOwnerFromGnosis" , async () => {
        // BallotVoting.delegate(setup.roles.buyer1.address);
        BallotVoting.addOwnerToGnosis(setup.roles.root, setup.roles.buyer1.address);        
      });
      // it("reverts when seed factory address is zero", async () => {
      //   await expect(
      //   // Signer_Factory.deploy(setup.proxySafe.address, constants.ZERO_ADDRESS)
      //       Voting.deploy([], 0)
      //   ).to.revertedWith(
      //     "Signer: Safe and SeedFactory address cannot be zero"
      //   );
      // });
    });

    // context(">> add Owner To Gnosis", async () => {
    //   it("deploys voter contract", async () => {

    //     // Voting.deploy(proposalNames, setup.seed.address); 
    //     // BallotVoting.addOwnerToGnosis(setup.roles.buyer1.address);

    //     // setup.signer = await Signer_Factory.deploy(
    //     //   setup.proxySafe.address,
    //     //   setup.seedFactory.address
    //     // );
    //     // expect(await BallotVoting.addOwnerToGnosis(setup.roles.buyer1.address));
    //     // expect(
    //     //   await setup.signer.connect(setup.roles.root).seedFactory()
    //     // ).to.equal(setup.seedFactory.address);
    //   });
    // });

  });

});




// describe("Voting dApp", function () {

//     //assigning global variables to be used within the unit tests
//     let owner;
//     let cand1;
//     let cand2;
//     let cand3;
//     let voter1;
//     let voter2;
//     let voter3;
//     let voters;

//     let Voting;
//     let BallotVoting;


// //https://stackoverflow.com/questions/70553717/error-trying-to-obtain-set-of-fields-from-array-of-solidity-objects


//     // const setup = await init.initialize(await ethers.getSigners());
//     // setup.seed = await init.getContractInstance("Seed", setup.roles.prime);

//     //beforeEach will be executed before every unit test

//     beforeEach(async function () {

//         setup = await deploy();

//         //linking the contract ABI
//         Voting = await ethers.getContractFactory("Ballot");

//         BallotVoting  = await Voting.deploy(proposalNames, setup.seedFactory.address); //error here in Ballot.sol

//         //deconstructing array into owner, candidates and voters
//         //signers returns an array of 20 signers on the hardhat testing node
//         //the address at index 0 is the owner's address
//         [owner, cand1, cand2, cand3, voter1, voter2, voter3, ...voters] = await ethers.getSigners();

//         //giveRightToVote three candidates
//         await BallotVoting.giveRightToVote(cand1.address);
//         await BallotVoting.giveRightToVote(cand2.address);
//         await BallotVoting.giveRightToVote(cand3.address);

//         //vote three ballots
//         await BallotVoting.vote(1);
//         // await BallotVoting.vote(2);
//         // await BallotVoting.vote(3);

//     }
//     );

//   // 2) Voting dApp
//   //      "before each" hook for "Minting a ballot and transfering it to an address on the network":
//   //    Error: Transaction reverted: function call to a non-contract account
//       // at Ballot.constructor (contracts/voting/Ballot.sol:46)


//     describe("safeMint, safeMintMany", function () {
//         it("Minting a ballot and transfering it to an address on the network", async function () {
//             expect(await BallotVoting.balanceOf(voter1.address)).to.equal(1);
//         });

//         it("Attempting to send a voter a ballot twice", async function () {
//             await expect(BallotVoting.vote(1)).to.be.revertedWith("The voter already voted.");
//         });

//         // it("Testing safeMintMany", async function () {
//         //     //mapping voters to an array of addresses
//         //     let addresses = [];
//         //     for (let i = 0; i < voters.length; i++) {
//         //         addresses[i] = voters[i].address
//         //     }

//         //     BallotVoting.safeMintMany(addresses)

//         //     for (let i = 0; i < voters.length; i++) {
//         //         expect(await BallotVoting.balanceOf(addresses[0])).to.equal(1);
//         //     }
//         // });
//     });


//     describe("Adding Candidates", function () {
//         it("Checking if a candidate exists", async function () {
//             expect(await BallotVoting.candidates(0)).to.equal(cand1.address);
//         });

//         it("Attempting to add an existing candidate", async function () {
//             await expect(BallotVoting.addCandidates(cand1.address)).to.be.revertedWith("Candidate Exists");
//         });
//     });


//     describe("Voting", function () {
//         it("Placing a valid vote for a candidate", async function () {
//             await BallotVoting.connect(voter1).vote(cand1.address);
//             expect(await BallotVoting.votesForCandidate(cand1.address)).to.equal(1);
//         });
//         -
//             it("Failed vote without a ballot", async function () {
//                 await BallotVoting.connect(voter1).vote(cand1.address);

//                 await expect(BallotVoting.connect(voter1).vote(cand1.address)).to.be.revertedWith("No Ballots");
//             });

//         it("Failed vote after election has concluded", async function () {

//             await BallotVoting.conclude()
//             await expect(BallotVoting.connect(voter1).vote(cand1.address)).to.be.revertedWith("Concluded");
//         });


//     });


//     // //Testing the conlude function
//     // describe("conclude()", function () {
//     //     it("Checking if active status is changed to false", async function () {
//     //         await BallotVoting.connect(voter1).vote(cand1.address);
//     //         await BallotVoting.connect(voter2).vote(cand2.address);
//     //         await BallotVoting.connect(voter3).vote(cand2.address);
//     //         await BallotVoting.conclude();

//     //         expect(await BallotVoting.active()).to.equal(false);
//     //     });

//     //     it("Correct winner is declared", async function () {
//     //         await BallotVoting.connect(voter1).vote(cand1.address);
//     //         await BallotVoting.connect(voter2).vote(cand2.address);
//     //         await BallotVoting.connect(voter3).vote(cand2.address);
//     //         await BallotVoting.conclude();

//     //         expect(await BallotVoting.winner()).to.equal(cand2.address);
//     //     });

//     //     it("Draw scenario", async function () {
//     //         await BallotVoting.connect(voter1).vote(cand1.address);
//     //         await BallotVoting.connect(voter2).vote(cand2.address);
//     //         await BallotVoting.conclude();

//     //         expect(await BallotVoting.winner()).to.equal("0x0000000000000000000000000000000000000000");
//     //     });
//     // });
// });
