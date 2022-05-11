//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    address private admin;
    address private governance;

    modifier onlyAdmin(address _address) {
        require(_address == admin, "Only admin can call that method!");
        _;
    }

    modifier onlyGovernance(address _address) {
        require(_address == governance, "Only governance contract can call that method!");
        _;
    }

    constructor() ERC20("Governance Voting Token", "GVT"){
        admin = msg.sender;
    }

    function mint(address _account, uint8 _amount) external onlyGovernance(msg.sender) {
        require(_amount == 1, "You can mint only 1 token for specific address");
        _mint(_account, _amount);
    }

    function setAdminAddress(address _address) external onlyAdmin(msg.sender){
        admin = _address;
    }

    function setGovernanceAddress(address _address) external onlyAdmin(msg.sender) {
        governance = _address;
    }
}