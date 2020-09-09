const { web3 } = require('./web3');
const BigNumber = require('bignumber.js');

const createEthAccount = () => {
  return web3.eth.accounts.create();
};

const getBalance = async (address) => {
  const ethBalance = await web3.eth.getBalance(address);
  return ethBalance;
}

const checkBalance = async (address, threshold = 0) => {
  const balance = await getBalance(address);
  if (balance <= threshold) {
    throw new Error('Insufficient balance');
  }
  return balance;
}

const callMethod = async (method, args = []) => {
  const result = await method(...args).call();
  return result;
}

const promisify = (promiEvent) => {
  return new Promise((resolve, reject) => {
    promiEvent
      // .on('confirmation', (confirmationNumber, receipt) => { // eslint-disable-line
      //   console.log('confirmation: ' + confirmationNumber);
      // })
      .on('error', (err) => {
        console.log('reject err : ', err);
        return reject(err);
      })
      .once('transactionHash', (hash) => {
        console.log('hash :>> ', hash);
        // return resolve(hash);
      })
      .once('receipt', receipt => { // eslint-disable-line
        console.log('reciept', receipt);
        return resolve(receipt);
      })
    // .then(console.log)
    // .catch(reject);
  })
}

const sendTransaction = async (privateKey, contractAddress, method, args = []) => {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  await checkBalance(account.address);

  const encodedABI = method(...args).encodeABI();
  const gasPrice = await web3.eth.getGasPrice();
  const gasEstimate = await web3.eth.estimateGas({
    from: account.address,
    to: contractAddress,
    data: encodedABI,
  });
  const tx = {
    from: account.address,
    to: contractAddress,
    // gas: gasEstimate,
    gas: 4000000,
    gasPrice: gasPrice,
    data: encodedABI,
  };
  const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
  const txHash = await promisify(web3.eth.sendSignedTransaction(signedTx.rawTransaction));

  return txHash;
}

export {
  createEthAccount,
  getBalance,
  checkBalance,
  callMethod,
  sendTransaction,
};
