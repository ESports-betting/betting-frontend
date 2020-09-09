const BigNumber = require('bignumber.js');
const { web3 } = require('./web3');
const { bettingContract } = require('./contracts');
const { callMethod, sendTransaction } = require('./utils');
const config = require('../../config');

const decimalBN = new BigNumber(10).pow(18);

// Getters
export const getBettingStatus = async () => {
  const result = await callMethod(bettingContract.contract.methods['betStatus'], []);
  return Number(result);
}

export const getPotAmount = async () => {
  const result = await callMethod(bettingContract.contract.methods['pot'], []);
  const amount = new BigNumber(parseInt(result)).dividedBy(decimalBN);
  return Number(amount);
}

export const getMinBetAmount = async () => {
  const result = await callMethod(bettingContract.contract.methods['minimumBet'], []);
  const amount = new BigNumber(parseInt(result)).dividedBy(decimalBN);
  return Number(amount);
}
