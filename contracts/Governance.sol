//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Governance is Ownable{
    Token private token;
    enum voteOption {vote_for, vote_against, vote_abstain}

    uint8 public upperPercentageRejectedLimit;
    uint8 public lowerPercentageAcceptedLimit;
    uint32 public minimumVotesRequired;
    uint256 public votingStartTime;
    uint256 public votingEndTime;
    mapping(address => bool) private whitelist;

    modifier isWhitelisted(address _address) {
        require(whitelist[_address] != true, "This address is blacklisted");
        _;
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
