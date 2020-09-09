import React, { Component } from "react";
import { Button } from "reactstrap";
import { NotificationManager } from '../common/react-notifications';
import * as api from "../../utils/api";
import { connect } from "react-redux";
import { setAddress } from "../../redux/actions";

class AddressButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connecting: false,
    };
  }

  handleClick = async () => {
    if (this.state.connecting) {
      return;
    }
    if (typeof window.ethereum === 'undefined') {
      NotificationManager.warning('Please install metamask!', 'warning', 3000, null, null, '');
      return;
    }
    if (window.ethereum.networkVersion !== '3') {
      NotificationManager.warning('Please select ropsten testnet to proceed!', 'warning', 3000, null, null, '');
      return;
    }
    if (window.ethereum.selectedAddress === null) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (err) {
        //console.log('err :>> ', err);
      }
    }
  };

  handleSignMessage = ({ address, nonce }) => {
    const web3 = window.web3;
    return new Promise((resolve, reject) =>
      web3.eth.personal.sign(
        web3.utils.utf8ToHex(`I am signing my one-time nonce: ${nonce}`),
        address,
        (err, signature) => {
          if (err) return reject(err);
          return resolve({ address, signature });
        }
      )
    );
  };

  render() {
    const { address } = this.props;
    if (address) {
      return (
        <Button color="default" onClick={e => {
          window.open(`https://ropsten.etherscan.io/address/${address}`, '_blank');
        }}>
          {`${address.substring(0, 5)}...${address.substring(address.length - 3, address.length)}`}
        </Button>
      )
    }
    return (
      <Button
        color="primary"
        onClick={this.handleClick}
        className={`btn-shadow btn-multiple-state ${
          this.state.connecting ? "show-spinner" : ""
          }`}
      >
        <span className="spinner d-inline-block">
          <span className="bounce1" />
          <span className="bounce2" />
          <span className="bounce3" />
        </span>
        <span className="label">Connect to a Metamask</span>
      </Button>
    )
  }
}

const mapStateToProps = ({ authUser }) => {
  const { address } = authUser;
  return { address };
};

export default connect(
  mapStateToProps,
  { setAddress }
)(AddressButton);