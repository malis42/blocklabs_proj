//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Governance is Ownable {
    Token private token;

    // Available choices: 1 - for, 2 - abstain, 3 - against
    struct Vote {
        address voterAddress;
        uint8 choice;
    }

    uint8 public upperPercentageRejectedLimit;
    uint8 public lowerPercentageAcceptedLimit;
    uint32 public minimumVotesRequired;
    uint256 public votingStartTime;
    uint256 public votingEndTime;
    mapping(address => bool) private whitelist;
    mapping(uint => Vote) private votes;

    event VotingResults(uint votesFor, uint votesAbstain, uint votesAgainst);

    modifier isWhitelisted(address _address) {
        require(whitelist[_address] == true, "This address is blacklisted");
        _;
    }

    constructor(Token _token) {
        token = _token;
        upperPercentageRejectedLimit = 30;
        lowerPercentageAcceptedLimit = 70;
    }

    function submitVote(uint8 _choice) external isWhitelisted(msg.sender) { 
        require(token.balanceOf(msg.sender) == 0, "This address has already voted");
        require(_choice == 1 || _choice == 2 || _choice == 3, "Available choices: 1 - for, 2 - abstain, 3 - against");
        require(block.timestamp >= votingStartTime && block.timestamp <= votingEndTime, "Voting is not active right now");
        Vote memory v;
        v.voterAddress = msg.sender;
        v.choice = _choice;
        token.mint(msg.sender, 1);
        votes[token.totalSupply()] = v;
    }

    function generateVotingResult() external onlyOwner {
        require(block.timestamp > votingEndTime, "Voting is still active");
        require(token.totalSupply() >= minimumVotesRequired, "Not enough votes for voting to be valid");
        uint allVotes = token.totalSupply();
        uint votesFor = 0;    
        uint votesAbstain = 0;    
        uint votesAgainst = 0;
        for(uint i = 1; i <= allVotes; i++) {
            if(votes[i].choice == 1) {
                votesFor++;
            } else if (votes[i].choice == 2) {
                votesAbstain++;
            }  else if (votes[i].choice == 3) {
                votesAgainst++;
            }
            token.burn(votes[i].voterAddress, 1);
        }
        calculateSummary(votesFor, votesAgainst, upperPercentageRejectedLimit, lowerPercentageAcceptedLimit);
        emit VotingResults(votesFor, votesAbstain, votesAgainst);
    }

    function calculateSummary(uint _votesFor, uint _votesAgainst, uint8 _upperLimit, uint8 _lowerLimit) pure private {
      
    }

    function modifyWhitelistAccess(address _address, bool _hasAccess) external onlyOwner {
        whitelist[_address] = _hasAccess;
    }

    function checkIfAddressIsWhitelisted(address _address) external view onlyOwner returns(bool){
        return whitelist[_address];
    }

    function setVotingStartTime(uint256 _timestamp) external onlyOwner {
        require(_timestamp >= block.timestamp, "Cannot set past date as voting start time");
        votingStartTime = _timestamp;
    }

    function setVotingEndTime(uint256 _timestamp) external onlyOwner {
        require(votingStartTime != 0, "Voting start time has to be set, before setting end time");
        require(_timestamp >= (votingStartTime + 86400), "Voting end time has to occur at least 1 day after start time");
        votingEndTime = _timestamp;
    }

    function setMinimumVotesRequired(uint32 _number) external onlyOwner {
        require(_number >= 0 && _number < 2**32, "Minimum votes required value has to be a positive number up to 2^32");
        minimumVotesRequired = _number;
    }

    function setPercentageLimits(uint8 _rejectedLimit, uint8 _acceptedLimit) external onlyOwner {
        require(_rejectedLimit > 0, "Lower rejection percentage limit has to be bigger than 0%");
        require(_acceptedLimit <= 100, "Upper acceptance percentage limit has to be less or equal to 100%");
        require(_rejectedLimit < _acceptedLimit - 1, "Lower rejection limit has to be smaller than upper acceptance limit");
        upperPercentageRejectedLimit = _rejectedLimit;
        lowerPercentageAcceptedLimit = _acceptedLimit;
    }
}
