/* eslint-disable quote-props */
/* eslint-disable max-len */
const { web3 } = require('./web3');
const bettingContractAbi = require('./abis/BettingContract.json');
const matchTokenContractAbi = require('./abis/MatchTokenContract.json');
const config = require('../../config');

const matchTokenContractAddress = config.contractOwner.matchTokenContractAddress;
const matchTokenAbiContract = new web3.eth.Contract(matchTokenContractAbi, matchTokenContractAddress);

const bettingContractAddress = config.contractOwner.bettingContractAddress;
const bettingAbiContract = new web3.eth.Contract(bettingContractAbi, bettingContractAddress);

module.exports = {
  matchTokenContract: {
    address: matchTokenContractAddress,
    contractAbi: matchTokenContractAbi,
    contract: matchTokenAbiContract
  },
  bettingContract: {
    address: bettingContractAddress,
    contractAbi: bettingContractAbi,
    contract: bettingAbiContract
  }
};

