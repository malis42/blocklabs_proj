//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20{
  address public voter;
  
  constructor() payable ERC20("Governance Voting Token","GVT") {
    voter = msg.sender;
  }
}