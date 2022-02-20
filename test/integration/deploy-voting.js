const { expect } = require("chai")
const { ethers } = require("hardhat")
// const { api } = require("./utils/gnosis.js");
// const { parseUnits } = ethers.utils;

// const { lbp } = require("./deploy-lbp.js");
// const { seed } = require("./deploy-seed.js");
const { constants } = require("@openzeppelin/test-helpers");
const init = require("../test-init.js");

const { time, expectRevert, BN } = require("@openzeppelin/test-helpers");
const {
  utils: { parseEther, parseUnits },
  BigNumber,
} = ethers;


const deploy = async () => {
  const setup = await init.initialize(await ethers.getSigners());

  setup.gnosisSafe = await init.getContractInstance(
    "GnosisSafe",
    setup.roles.prime
  );
  setup.proxySafe = await init.getGnosisProxyInstance(setup);


  setup.seed = await init.getContractInstance("Seed", setup.roles.prime);
  setup.token = await init.gettokenInstances(setup);


  // setup.seedFactory = await init.getContractInstance(
  //   "SeedFactory",
  //   setup.roles.prime
  // );
  // await setup.seedFactory
  //   .connect(setup.roles.prime)
  //   .setMasterCopy(setup.seed.address);

  setup.data = {};

  return setup;
};

// есть несколько верояностей, во первых в Voting.deploy нужен был setup.seed.address
// Вероятно проблема в том что в реальности seed не задеплоен
// Я бы советовал попробовать задеплоить его локально, и уже потом ранить 
// тесты с этим локально задеплоеным сидом(Через Factory, все как обычно)
const getDecimals = async (token) => await token.decimals();

const getTokenAmount = (tokenDecimal) => (amount) =>
  parseUnits(amount, tokenDecimal.toString());


describe("Contract: Voting", async () => {
  let setup;
  let nonce = 0;
  let Signer_Factory;
  let Voting;

  const proposalNames = [ethers.utils.formatBytes32String("Proposal_1"),
                          ethers.utils.formatBytes32String("Proposal_2"),
                          ethers.utils.formatBytes32String("Proposal_3")];
  const zeroProposalNames = [];//ethers.utils.formatBytes32String("")];


  ///
// let setup;
  let root;
  let admin;
  let buyer1;
  let buyer2;
  let buyer3;
  let buyer4;
  let seedToken;
  let seedTokenDecimal;
  let getSeedAmounts;
  let fundingToken;
  let fundingTokenDecimal;
  let getFundingAmounts;
  let softCap;
  let hardCap;
  let price;
  let buyAmount;
  let smallBuyAmount;
  let buySeedAmount;
  let buySeedFee;
  let startTime;
  let endTime;
  let vestingDuration;
  let vestingCliff;
  let permissionedSeed;
  let fee;
  let seed;
  let metadata;
  let seedForDistribution;
  let seedForFee;
  let requiredSeedAmount;
  let claimAmount;
  let feeAmount;
  let totalClaimedByBuyer1;
  let seedAmount;
  let feeAmountOnClaim;

  // constants
  const zero = 0;
  const one = 1;
  const hundred = 100;
  const tenETH = parseEther("10").toString();
  const hundredTwoETH = parseEther("102").toString();
  const twoHundredFourETH = parseEther("204").toString();
  const hundredBn = new BN(100);
  const twoBN = new BN(2);
  const PRECISION = ethers.constants.WeiPerEther;
  const ninetyTwoDaysInSeconds = time.duration.days(92);
  const eightyNineDaysInSeconds = time.duration.days(89);
  const tenDaysInSeconds = time.duration.days(10);

  ///


  before("!! setup", async () => {
    setup = await deploy();
    Signer_Factory = await ethers.getContractFactory(
      "Signer",
      setup.roles.root
    );


//add Seed.initialize() !!!! //_price = 0 --> div by 0 error
      const CustomDecimalERC20Mock = await ethers.getContractFactory(
        "CustomDecimalERC20Mock",
        setup.roles.root
      );

      // Tokens used
      // fundingToken = setup.token.fundingToken;
      fundingToken = await CustomDecimalERC20Mock.deploy("USDC", "USDC", 16);
      fundingTokenDecimal = (await getDecimals(fundingToken)).toString();
      getFundingAmounts = getTokenAmount(fundingTokenDecimal);

      // seedToken = setup.token.seedToken;
      seedToken = await CustomDecimalERC20Mock.deploy("Prime", "Prime", 12);
      seedTokenDecimal = (await getDecimals(seedToken)).toString();
      getSeedAmounts = getTokenAmount(seedTokenDecimal);

      // // Roles
      root = setup.roles.root;
      beneficiary = setup.roles.beneficiary;
      admin = setup.roles.prime;
      buyer1 = setup.roles.buyer1;
      buyer2 = setup.roles.buyer2;
      buyer3 = setup.roles.buyer3;

      // // Parameters to initialize seed contract
      softCap = getFundingAmounts("10").toString();
      hardCap = getFundingAmounts("102").toString();
      price = parseUnits(
        "0.01",
        parseInt(fundingTokenDecimal) - parseInt(seedTokenDecimal) + 18
      ).toString();
      buyAmount = getFundingAmounts("51").toString();
      smallBuyAmount = getFundingAmounts("9").toString();
      buySeedAmount = getSeedAmounts("5100").toString();
      startTime = await time.latest();
      endTime = await startTime.add(await time.duration.days(7));
      vestingDuration = time.duration.days(365); // 1 year
      vestingCliff = time.duration.days(90); // 3 months
      permissionedSeed = false;
      fee = parseEther("0.02").toString(); // 2%
      metadata = `0x`;

      buySeedFee = new BN(buySeedAmount)
        .mul(new BN(fee))
        .div(new BN(PRECISION.toString()));
      seedForDistribution = new BN(hardCap)
        .mul(new BN(PRECISION.toString()))
        .div(new BN(price));
      seedForFee = seedForDistribution
        .mul(new BN(fee))
        .div(new BN(PRECISION.toString()));
      requiredSeedAmount = seedForDistribution.add(seedForFee);

//add Seed.initialize() 


    Voting = await ethers.getContractFactory(
      "Ballot",
      admin   //setup.roles.prime//root
    );
    // Voting = await ethers.getContractFactory("Ballot");
    BallotVoting  = await Voting.deploy(proposalNames, setup.seed.address, setup.proxySafe.address); 

    RecoveryKeyModule = await ethers.getContractFactory(
      "RecoveryKeyModule",
      admin   //setup.roles.prime//root
    );

  });

    describe(">> basic voting check", function () { //errors
        it("Checking root balance after deploy", async function () {
            expect(await BallotVoting.checkVoterBalance(admin.address)).to.equal(1);
        });

        it("Attempting to add an existing candidate", async function () {
            await expect(BallotVoting.delegate(admin.address)).to.be.revertedWith("Self-delegation is disallowed.");
        });
    });

  context(">> deploy voting contract", async () => {
    context("invalid constructor parameters", async () => {
      it("reverts when voting propasals is empty", async () => {
        await expect(
          Voting.deploy(zeroProposalNames, setup.seed.address)
        ).to.revertedWith(
          'Proposals can not be empty'
        );
      });
      it("Has no right to vote", async () => {
        await expect(
            //The signature is .connect(signer), not .connect(address). 
            BallotVoting.connect(buyer2).vote(1)
        ).to.revertedWith(
          'Has no right to vote'
        );         
      }); 

      it("Has no right to giveRightToVote" , async () => {
        // BallotVoting.delegate(setup.roles.buyer1.address);
        // BallotVoting.connect(setup.roles.root).giveRightToVote(setup.roles.buyer1.address);
        await expect(  
          BallotVoting.connect(buyer2).giveRightToVote(buyer1.address) 
        ).to.revertedWith(
          'Only chairperson can give right to vote.'
        );         
      });

      it("Delegating", async () => {
        BallotVoting.connect(admin).giveRightToVote(buyer2.address);        
        BallotVoting.connect(buyer2).vote(1);
        await expect(            
          BallotVoting.connect(buyer2).delegate(buyer3.address)
        ).to.revertedWith(
          'You already voted.'
        );         
      }); 

      it("$ initializes seed", async () => {
        // emulate creation & initialization via seedfactory & fund with seedTokens
        await setup.seed.initialize(
          beneficiary.address,
          admin.address,
          [seedToken.address, fundingToken.address],
          [softCap, hardCap],
          price,
          startTime.toNumber(),
          endTime.toNumber(),
          vestingDuration.toNumber(),
          vestingCliff.toNumber(),
          permissionedSeed,
          fee
        );

        //добавить buy tokens --> balance will NOT be 0
        await fundingToken
          .connect(root)
          .transfer(buyer1.address, getFundingAmounts("102"));
        await fundingToken
          .connect(buyer1)
          .approve(setup.seed.address, getFundingAmounts("102"));
      });

      it("$ setups gnosis safe", async () => {
        await setup.proxySafe
          .connect(admin)
          .setup(
            [admin.address],
            1,
            setup.proxySafe.address,
            "0x",
            constants.ZERO_ADDRESS,
            constants.ZERO_ADDRESS,
            0,
            admin.address
          );
      });


    it('should DEPLOY RecoveryKeyModule', async () => {
        // const setupData = await gnosisSafeMasterCopy.setup([lw.accounts[0], lw.accounts[1]], 2, ADDRESS_0, "0x", 0, 0, 0, 0)
        // const CALL = 0

        // Find event in tx and create contract instance
        // const safe = utils.getParamFromTxEvent(
        //     await proxyFactory.createProxy(gnosisSafeMasterCopy.address, setup.proxySafe),
        //     'ProxyCreation', 'proxy', proxyFactory.address, GnosisSafe, 'create Gnosis Safe' 
        // )
        
        // Setup module
        const testModule = await RecoveryKeyModule.deploy() //HOW can I deploy RecoveryKeyModule?

        
        // const enableModuleData = await setup.proxySafe.enableModule(testModule.address).encodeABI()
        // await execTransaction(setup.proxySafe.address, 0, enableModuleData, CALL, "enable module")
    });

// // To deploy run following js (web3js 0.4.x):

      it("addOwnerToGnosis" , async () => {

      // Uncaught Error: Transaction reverted: function call to a non-contract account
      // at Ballot.addOwnerToGnosis (contracts/voting/Ballot.sol:100)

      //NEED INITIALIZE RecoveryKeyModule --> setup on Ballot.sol:100 just NOT INITED

      // let moduleSetupData = await setup.proxySafe.contract.setup.getData()
      // let moduleCreationData = await setup.proxySafe.contract.createProxy.getData(recoveryModuleMasterCopy.address, moduleSetupData)
      // // see https://github.com/gnosis/safe-contracts/blob/development/test/utils/general.js#L9
      // let enableModuleParameterData = utils.createAndAddModulesData([moduleCreationData])
      // let enableModuleData = createAndAddModules.contract.createAndAddModules.getData(setup.proxySafe.address, enableModuleParameterData)
      // // generate sigs
      // let tx = await gnosisSafe.execTransaction(createAndAddModules.address, 0, enableModuleData, DelegateCall, 0, 0, 0, 0, 0, sigs)


        BallotVoting.addOwnerToGnosis(setup.roles.buyer1.address);//, setup.seed.address);        
      });

      it("removeOwnerFromGnosis" , async () => {
        // BallotVoting.delegate(setup.roles.buyer1.address);
        BallotVoting.removeOwnerFromGnosis(admin.address, buyer1.address);        
      });
    });

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
