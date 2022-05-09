//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20{
  address public voter;
  
  constructor() payable ERC20("Governance Voting Token", "GVT"){}

  function mint(address _account, uint8 _amount) public {
    require(_amount <= 1, "Cannot mint more than 1 token for specific address");
    _mint(_account, _amount);
  }
}