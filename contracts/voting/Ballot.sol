// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

// import balance pool; to get amount of stake with weight
// import "./Imports.sol";
// import "./GnosisAllowanseModule.sol";

import "../seed/Seed.sol"; //need this
import "../utils/interface/ILBP.sol";
import "./SampleModule.sol";
// import "../utils/interface/Safe.sol";

/// @title Voting with delegation.
contract Ballot {
    Seed seed;
    RecoveryKeyModule rkmc;
    // ILBP public lbp; // Address of LBP that is managed by this contract.
    // This declares a new complex type which will
    // be used for variables later.
    // It will represent a single voter.
    struct Voter {
        uint256 weight; // = balanceOf(address(this)); // weight is accumulated by stacking balance
        bool voted; // if true, that person already voted
        address delegate; // person delegated to
        uint256 vote; // index of the voted proposal
    }

    // This is a type for a single proposal.
    struct Proposal {
        bytes32 name; // short name (up to 32 bytes)
        uint256 voteCount; // number of accumulated votes
    }

    address public chairperson;

    // This declares a state variable that
    // stores a `Voter` struct for each possible address.
    mapping(address => Voter) public voters;

    // A dynamically-sized array of `Proposal` structs.
    Proposal[] public proposals;

    /// Create a new ballot to choose one of `proposalNames`.
    constructor(bytes32[] memory proposalNames) {
        chairperson = msg.sender;
        voters[chairperson].weight = seed.calculateClaim(chairperson); //balanceOf(voters[chairperson]);

        // For each of the provided proposal names,
        // create a new proposal object and add it
        // to the end of the array.
        for (uint256 i = 0; i < proposalNames.length; i++) {
            // `Proposal({...})` creates a temporary
            // Proposal object and `proposals.push(...)`
            // appends it to the end of `proposals`.
            proposals.push(Proposal({name: proposalNames[i], voteCount: 0}));
        }
    }

    //https://github.com/gnosis/safe-core-sdk/tree/main/packages/safe-core-sdk#create-1
    //Only allow if caller has enough weight (51% and more)
    //require(вызов getGradualWeightUpdateParams ???)
    //проверка на >=51% --> вызов функции гнозис идет уже от лица владельца.
    //т.е. юзер инициирует вызов от владельца
    //call execTransaction with all necessary signatures and encoded transaction data for addOwnerThreshold

    function addOwnerToGnosis(address owner) public {
        //Only allow if caller has enough weight (51% and more)

        // require(balanceOf(owner)>= seed.fundingCollected()); //from  Seed.sol
        // require(seed.seedAmountForFunder(owner) >= seed.fundingCollected());
        // require(seed.FunderPortfolio.fundingAmount(owner) >= seed.fundingCollected());
        // require(seed.calculateClaim(owner) >= seed.fundingCollected());
        // require(seed.calculateClaim(owner) >= seed.fundingCollected()); //base

        require(seed.calculateClaim(owner) >= (seed.fundingCollected() / 100) * 51);

        // Owner address cannot be null, the sentinel or the Safe itself.
        require(owner != address(0));

        // function recover(GnosisSafe safe) external
        rkmc.setup(owner);
        rkmc.recover();
        // seed.addOwnerThreshold(owner);
    }

    function removeOwnerFromGnosis(address owner, address forRemOwner) public {
        //Only allow if caller has enough weight (51% and more)
      	require(seed.calculateClaim(owner)/100 >= seed.fundingCollected()/100*51);

          // Owner address cannot be null, the sentinel or the Safe itself.
          require(owner != address(0));

          // function recover(GnosisSafe safe) external
          rkmc.setup(owner);
          rkmc.remover(forRemOwner);
      }

    // Give `voter` the right to vote on this ballot.
    // May only be called by `chairperson`.
    function giveRightToVote(address voter) public {
        // If the first argument of `require` evaluates
        // to `false`, execution terminates and all
        // changes to the state and to Ether balances
        // are reverted.
        // This used to consume all gas in old EVM versions, but
        // not anymore.
        // It is often a good idea to use `require` to check if
        // functions are called correctly.
        // As a second argument, you can also provide an
        // explanation about what went wrong.
        require(
            msg.sender == chairperson,
            "Only chairperson can give right to vote."
        );
        require(!voters[voter].voted, "The voter already voted.");
        require(voters[voter].weight == 0);
        voters[voter].weight = seed.calculateClaim(voter); //balanceOf(voters[voter]);
    }

    /// Delegate your vote to the voter `to`.
    function delegate(address to) public {
        // assigns reference
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "You already voted.");

        require(to != msg.sender, "Self-delegation is disallowed.");

        // Forward the delegation as long as
        // `to` also delegated.
        // In general, such loops are very dangerous,
        // because if they run too long, they might
        // need more gas than is available in a block.
        // In this case, the delegation will not be executed,
        // but in other situations, such loops might
        // cause a contract to get "stuck" completely.
        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;

            // We found a loop in the delegation, not allowed.
            require(to != msg.sender, "Found loop in delegation.");
        }

        // Since `sender` is a reference, this
        // modifies `voters[msg.sender].voted`
        sender.voted = true;
        sender.delegate = to;
        Voter storage delegate_ = voters[to];
        if (delegate_.voted) {
            // If the delegate already voted,
            // directly add to the number of votes
            proposals[delegate_.vote].voteCount += sender.weight;
        } else {
            // If the delegate did not vote yet,
            // add to her weight.
            delegate_.weight += sender.weight;
        }
    }

    /// Give your vote (including votes delegated to you)
    /// to proposal `proposals[proposal].name`.
    function vote(uint256 proposal) public {
        Voter storage sender = voters[msg.sender];
        require(sender.weight != 0, "Has no right to vote");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposal;

        // If `proposal` is out of the range of the array,
        // this will throw automatically and revert all
        // changes.
        proposals[proposal].voteCount += sender.weight;
    }

    /// @dev Computes the winning proposal taking all
    /// previous votes into account.
    function winningProposal() public view returns (uint256 winningProposal_) {
        uint256 winningVoteCount = 0;
        for (uint256 p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    function getAllProposals() external view returns (Proposal[] memory) {
        Proposal[] memory items = new Proposal[](proposals.length);
        for (uint256 i = 0; i < proposals.length; i++) {
            items[i] = proposals[i];
        }
        return items;
    }

    // Calls winningProposal() function to get the index
    // of the winner contained in the proposals array and then
    // returns the name of the winner
    function winnerName() public view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }
}
