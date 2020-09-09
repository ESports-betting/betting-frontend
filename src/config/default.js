const config = {
  web3Provider: process.env.REACT_APP_WEB3_PROVIDER || 'https://ropsten.infura.io/v3/608777ea4b3343e291b5ec70d42f2214',
  contractOwner: {
    matchTokenContractAddress: process.env.REACT_APP_MATCH_TOKEN_CONTRACT_ADDRESS,
    bettingContractAddress: process.env.REACT_APP_BETTING_CONTRACT_ADDRESS
  },
  decimals: 18,
};

module.exports = config;
