const sendTransaction = async (fromAddress, toAddress, encodedABI, wei = `0x0`) => {
  const web3 = window.web3;
  if (window.ethereum && web3) {
    try {
      const gasPrice = await web3.eth.getGasPrice();

      const tx = {
        from: fromAddress,
        to: toAddress,
        gas: `0x286A0`,
        gasPrice: gasPrice,
        // chainId: 3,
        data: encodedABI,
        value: wei
      };
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
      });
      return txHash;
    } catch (err) {
      console.log('err :>> ', err);
      return null;
    }
  } else {
    return null;
  }
}

export {
  sendTransaction
};