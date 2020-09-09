const BigNumber = require('bignumber.js');
const { web3 } = require('./web3');
const { matchTokenContract } = require('./contracts');
const { callMethod, sendTransaction } = require('./utils');
const config = require('../../config');

// Getters
export const checkAllowance = async (owner, spender) => {
  const count = await callMethod(matchTokenContract.contract.methods['allowance'], [owner, spender]);
  return Number(count);
}

export const getBalance = async (address) => {
  const decimalBN = new BigNumber(10).pow(18);
  const result = await callMethod(matchTokenContract.contract.methods['balanceOf'], [address]);
  const balance = new BigNumber(result).dividedBy(decimalBN);
  return Number(balance);
}
