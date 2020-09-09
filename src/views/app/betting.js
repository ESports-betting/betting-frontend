import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { Row, Col, CardText, CardSubtitle, Card, CardBody, CardTitle, FormGroup, Button, Badge, Label, Input } from "reactstrap";
import ReactTable from 'react-table';
import Switch from "rc-switch";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import moment from 'moment';
import { NotificationManager } from '../../components/common/react-notifications';
import { Colxx, Separator } from "../../components/common/CustomBootstrap";
import DataTablePagination from '../../components/DatatablePagination';
import Breadcrumb from "../../containers/navs/Breadcrumb";
import * as Api from '../../utils/api';
import extractErrors from '../../utils/error';

import { checkAllowance, getBalance } from '../../modules/crypto/token';
import { getBettingStatus, getPotAmount } from '../../modules/crypto/betting';
import { matchTokenContract, bettingContract } from '../../modules/crypto/contracts';
import BigNumber from 'bignumber.js';

class BettingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      total: 0,
      data: [],
      user: -1,
      loading: true,
      betting: false,
      getting: false,
      starting: false,
      winnering: false,
      payouting: false,
      status: 10,
      amount: 0,
      pot: 0,
      startingHash: null,
    };
    this.decimalBN = new BigNumber(10).pow(18);
  }
  async componentDidMount() {
    await this.getStatus();
  }

  getStatus = async () => {
    try {
      const result = await getBettingStatus();

      this.setState({
        status: result,
        loading: false,
        getting: false
      });
    } catch (err) {
      this.setState({
        status: 10,
        loading: false,
        getting: false
      });
    }
  }

  checkEthereum = () => {
    if (typeof window.ethereum === 'undefined') {
      NotificationManager.warning('Please install metamask.', 'warning', 3000, null, null, '');
      return false;
    }
    if (window.ethereum.networkVersion !== '3') {
      NotificationManager.warning('Please select ropsten testnet to proceed.', 'warning', 3000, null, null, '');
      return false;
    }
    const { address } = this.props;
    if (!address) {
      NotificationManager.warning('Please connect to your metamask account.', 'warning', 3000, null, null, '');
      return false;
    }
    return true;
  }

  handleBetting = async (player) => {
    if (player !== 1 && player !== 2) {
      NotificationManager.warn('Player value is invalid', "warn", 3000, null, null, '');
      return;
    }
    const { getting, betting, amount } = this.state;
    if (getting || betting || !this.checkEthereum()) {
      return;
    }

    const { address } = this.props;

    this.setState(
      {
        betting: true,
      },
      async () => {
        const web3 = window.web3;
        if (web3 && address) {
          const decimalBN = this.decimalBN;
          const allowanceValue = await checkAllowance(address, bettingContract.address);
          if (amount > allowanceValue || allowanceValue === 0) {
            const count = new BigNumber(10000).multipliedBy(decimalBN);

            const encodedABI = matchTokenContract.contract.methods.approve(bettingContract.address, `0x${count.toString(16)}`).encodeABI();
            const gasPrice = await web3.eth.getGasPrice();

            const tx = {
              to: matchTokenContract.address,
              gas: `0x186A0`,
              gasPrice: gasPrice,
              chainId: 3,
              from: address,
              data: encodedABI,
            };
            try {
              const hash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx],
              });
              this.setState({ betting: false, userHash: hash });
              NotificationManager.success('You requested to start betting', "Success", 3000, null, null, '');
            } catch (err) {
              console.log('err :>> ', err);
              this.setState({ betting: false, userHash: '' });
            }
          } else {
            const encodedABI = bettingContract.contract.methods.betPlayer(player).encodeABI();
            const gasPrice = await web3.eth.getGasPrice();

            const tx = {
              to: bettingContract.address,
              gas: `0x286A0`,
              gasPrice: gasPrice,
              chainId: 3,
              from: address,
              data: encodedABI,
            };
            try {
              const hash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx],
              });
              this.setState({ betting: false, userHash: hash });
              NotificationManager.success('You requested to start betting', "Success", 3000, null, null, '');
            } catch (err) {
              console.log('err :>> ', err);
              this.setState({ betting: false, userHash: '' });
            }
          }
        }
      });
  }

  handleStart = async () => {
    const { starting, status, amount } = this.state;
    if (starting || !this.checkEthereum()) {
      return;
    }
    if (amount === 0) {
      NotificationManager.warning('Please enter amount', 'warn', 3000, null, null, '');
      return;
    }

    if (amount < 2) {
      NotificationManager.warning('Please enter 2 at least', 'warn', 3000, null, null, '');
      return;
    }

    const { address } = this.props;

    this.setState(
      {
        starting: true,
      },
      async () => {
        const web3 = window.web3;
        if (web3 && address) {
          const count = new BigNumber(parseInt(amount)).multipliedBy(this.decimalBN);

          const encodedABI = bettingContract.contract.methods.startBetting(`0x${count.toString(16)}`).encodeABI();
          const gasPrice = await web3.eth.getGasPrice();

          const tx = {
            to: bettingContract.address,
            gas: `0x9C40`,
            gasPrice: gasPrice,
            chainId: 3,
            from: address,
            data: encodedABI,
          };
          try {
            const hash = await window.ethereum.request({
              method: 'eth_sendTransaction',
              params: [tx],
            });
            this.setState({ starting: false, ownerHash: hash });
            NotificationManager.success('You requested to start betting', "Success", 3000, null, null, '');
          } catch (err) {
            console.log('err :>> ', err);
            this.setState({ starting: false, ownerHash: '' });
          }
        }
      });
  }

  handleWinner = (player) => {
    const { winnering } = this.state;
    if (winnering || !this.checkEthereum()) {
      return;
    }
    const { address } = this.props;

    this.setState(
      {
        winnering: true,
      },
      async () => {
        const web3 = window.web3;
        if (web3 && address) {
          const encodedABI = bettingContract.contract.methods.makeWinner(player).encodeABI();
          const gasPrice = await web3.eth.getGasPrice();

          const tx = {
            to: bettingContract.address,
            gas: `0x9C40`,
            gasPrice: gasPrice,
            chainId: 3,
            from: address,
            data: encodedABI,
          };
          try {
            const hash = await window.ethereum.request({
              method: 'eth_sendTransaction',
              params: [tx],
            });
            this.setState({ winnering: false, ownerHash: hash });
            NotificationManager.success('You requested to start betting', "Success", 3000, null, null, '');
          } catch (err) {
            console.log('err :>> ', err);
            this.setState({ winnering: false, ownerHash: '' });
          }
        }
      });
  }

  handlePayout = (player) => {
    const { payouting } = this.state;
    if (payouting || !this.checkEthereum()) {
      return;
    }
    const { address } = this.props;

    this.setState(
      {
        payouting: true,
      },
      async () => {
        const web3 = window.web3;
        if (web3 && address) {
          const encodedABI = bettingContract.contract.methods.payouts().encodeABI();
          const gasPrice = await web3.eth.getGasPrice();

          const tx = {
            to: bettingContract.address,
            gas: `0x186A0`,
            gasPrice: gasPrice,
            chainId: 3,
            from: address,
            data: encodedABI,
          };
          try {
            const hash = await window.ethereum.request({
              method: 'eth_sendTransaction',
              params: [tx],
            });
            this.setState({ payouting: false, ownerHash: hash });
            NotificationManager.success('You requested to start betting', "Success", 3000, null, null, '');
          } catch (err) {
            console.log('err :>> ', err);
            this.setState({ payouting: false, ownerHash: '' });
          }
        }
      });
  }

  render() {
    if (this.state.loading) {
      return (<div className="loading" />);
    }

    const { getting, betting, starting, amount, status, winnering, payouting, userHash, ownerHash } = this.state;

    return (
      <Fragment>
        <Row className="mb-4">
          <Colxx xxs="12" md="6">
            <Card>
              <CardBody>
                <CardTitle>
                  <h2><strong>Betting</strong></h2>
                </CardTitle>
                <Col sm="12">
                  <a href={`https://ropsten.etherscan.io/tx/${userHash}`} target="_blank" without="true" rel="noopener noreferrer" color="primary">{userHash}</a>
                </Col>
                <div className="row mb-4">
                  <Button color="primary" type="submit" size="sm"
                    className={`mr-2 btn-shadow btn-multiple-state
                    ${getting ? "show-spinner" : ""}`}
                    onClick={this.getStatus}
                  >
                    <span className="spinner d-inline-block">
                      <span className="bounce1" />
                      <span className="bounce2" />
                      <span className="bounce3" />
                    </span>
                    <span className="label">
                      Get Betting Status
                    </span>
                  </Button>
                  <h3 className="my-auto">
                    {
                      status === 0 ? "Not Started" :
                        status === 1 ? "Started" :
                          status === 2 ? "Finished" :
                            "Unknown"
                    }
                  </h3>
                </div>
                <div className="row">
                  <Button color="primary" type="submit" size="sm"
                    className={`mr-2 btn-shadow btn-multiple-state
                    ${betting ? "show-spinner" : ""}`}
                    disabled={status !== 1}
                    onClick={() => this.handleBetting(1)}
                  >
                    <span className="spinner d-inline-block">
                      <span className="bounce1" />
                      <span className="bounce2" />
                      <span className="bounce3" />
                    </span>
                    <span className="label">
                      Player 1
                    </span>
                  </Button>
                  <Button color="primary" type="submit" size="sm"
                    className={`mr-2 btn-shadow btn-multiple-state
                    ${betting ? "show-spinner" : ""}`}
                    disabled={status !== 1}
                    onClick={() => this.handleBetting(2)}
                  >
                    <span className="spinner d-inline-block">
                      <span className="bounce1" />
                      <span className="bounce2" />
                      <span className="bounce3" />
                    </span>
                    <span className="label">
                      Player 2
                    </span>
                  </Button>
                </div>
                <div className="row mb-4 mt-2">
                  <Button color="primary" type="submit" size="sm"
                    className={`mr-2 btn-shadow btn-multiple-state
                    ${payouting ? "show-spinner" : ""}`}
                    disabled={status !== 2}
                    onClick={() => this.handlePayout()}
                  >
                    <span className="spinner d-inline-block">
                      <span className="bounce1" />
                      <span className="bounce2" />
                      <span className="bounce3" />
                    </span>
                    <span className="label">
                      Payout
                    </span>
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Colxx>

          <Colxx xxs="12" md="6">
            <Card className="h-100">
              <CardBody >
                <CardTitle>
                  <h2><strong>Owner</strong></h2>
                </CardTitle>
                <Row>
                  <Col sm="12">
                    <a href={`https://ropsten.etherscan.io/tx/${ownerHash}`} target="_blank" without="true" rel="noopener noreferrer" color="primary">{ownerHash}</a>
                  </Col>
                  <Col sm="12">
                    <Input
                      value={amount}
                      onChange={e => this.setState({ amount: e.target.value })}
                      className="mb-2 form-control" type="number"
                    />
                  </Col>
                  <Col sm="12">
                    <Button color="primary" type="submit" size="sm"
                      className={`mr-2 btn-shadow btn-multiple-state
                    ${starting ? "show-spinner" : ""}`}
                      onClick={this.handleStart}
                    >
                      <span className="spinner d-inline-block">
                        <span className="bounce1" />
                        <span className="bounce2" />
                        <span className="bounce3" />
                      </span>
                      <span className="label">
                        Start Betting
                    </span>
                    </Button>
                    <Button color="primary" size="sm"
                      onClick={async () => {
                        try {
                          const result = await getBalance(bettingContract.address);
                          alert(`Onwer Match Token Balance: ${result} tokens`);
                        } catch (err) {
                          console.log(err);
                        }
                      }}
                    >
                      Get Balance
                    </Button>
                    <Button color="primary" type="submit" size="sm"
                      className={`ml-2 mr-2 btn-shadow btn-multiple-state
                    ${winnering ? "show-spinner" : ""}`}
                      onClick={() => this.handleWinner(1)}
                    >
                      <span className="spinner d-inline-block">
                        <span className="bounce1" />
                        <span className="bounce2" />
                        <span className="bounce3" />
                      </span>
                      <span className="label">
                        Set Winner 1
                    </span>
                    </Button>
                    <Button color="primary" type="submit" size="sm"
                      className={`mr-2 btn-shadow btn-multiple-state
                    ${winnering ? "show-spinner" : ""}`}
                      onClick={() => this.handleWinner(2)}
                    >
                      <span className="spinner d-inline-block">
                        <span className="bounce1" />
                        <span className="bounce2" />
                        <span className="bounce3" />
                      </span>
                      <span className="label">
                        Set Winner 2
                    </span>
                    </Button>
                  </Col>
                </Row>

              </CardBody>
            </Card>
          </Colxx>
        </Row>
      </Fragment >
    )
  }
}

const mapStateToProps = ({ authUser }) => {
  return { address: authUser.address };
};

export default connect(mapStateToProps, null)(BettingPage);
