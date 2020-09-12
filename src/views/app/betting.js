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
import { sendTransaction } from '../../modules/metamask';

import { checkAllowance, getBalance } from '../../modules/crypto/token';
import { getBettingStatus, getBettingName, getPotAmount, getAvailableSeconds, getStartedTimeStamp } from '../../modules/crypto/betting';
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
      bettingName: '',
      amount: 0,
      bname: '',
      pot: 0,
      startingHash: null,
      startedTime: 0,
      avaiableSeconds: 120,
      transactions: [],
    };
    this.decimalBN = new BigNumber(10).pow(18);
  }
  async componentDidMount() {
    await this.fetchTransactions();
    await this.getStatus();
  }

  fetchTransactions = async () => {
    const { address } = this.props;
    try {
      if (address) {
        const res = await Api.GetRequest('/transaction/retrieve', { address });
        this.setState({ transactions: res.data.data.result });
      }
    } catch (error) {
      const errorMsg = extractErrors(error);
    }
  }

  getStatus = async () => {
    try {
      const bstatus = await getBettingStatus();
      const bname = await getBettingName();
      const bpot = await getPotAmount();
      const bseconds = await getAvailableSeconds();
      const btime = await getStartedTimeStamp();

      this.setState({
        status: bstatus,
        bettingName: bname,
        pot: bpot,
        startedTime: btime,
        avaiableSeconds: bseconds,
        loading: false,
        getting: false,
      });
    } catch (err) {
      this.setState({
        status: 10,
        bettingName: '',
        pot: 0,
        startedTime: 0,
        avaiableSeconds: 120,
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

            const hash = await sendTransaction(address, matchTokenContract.address, encodedABI);
            if (hash) {
              this.setState({ betting: false, userHash: hash });
              NotificationManager.success('You requested to start betting', "Success", 3000, null, null, '');
            } else {
              this.setState({ betting: false, userHash: '' });
            }
          } else {
            const encodedABI = bettingContract.contract.methods.betPlayer(player).encodeABI();

            const hash = await sendTransaction(address, bettingContract.address, encodedABI);
            if (hash) {
              await Api.PostRequest('/transaction/create', { address, txHash: hash, type: 'BetPlayer' });
              await this.fetchTransactions();
              this.setState({ betting: false, userHash: hash });
              NotificationManager.success('You requested to start betting', "Success", 3000, null, null, '');
            } else {
              this.setState({ betting: false, userHash: '' });
            }
          }
        }
      });
  }

  handleStart = async () => {
    const { starting, status, amount, bname } = this.state;
    if (starting || !this.checkEthereum()) {
      return;
    }
    if (bname.length === 0) {
      NotificationManager.warning('Please enter betting name', 'Warning', 3000, null, null, '');
      return;
    }
    if (amount === 0) {
      NotificationManager.warning('Please enter amount', 'Warning', 3000, null, null, '');
      return;
    }
    if (amount < 2) {
      NotificationManager.warning('Please enter 2 at least', 'Warning', 3000, null, null, '');
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
          const encodedABI = bettingContract.contract.methods.startBetting(`0x${count.toString(16)}`, bname).encodeABI();

          const hash = await sendTransaction(address, bettingContract.address, encodedABI);
          if (hash) {
            this.setState({ starting: false, ownerHash: hash });
            NotificationManager.success('You requested to create betting', "Success", 3000, null, null, '');
          } else {
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
          const hash = await sendTransaction(address, bettingContract.address, encodedABI);
          if (hash) {
            this.setState({ winnering: false, ownerHash: hash });
            NotificationManager.success('You requested to set winner', "Success", 3000, null, null, '');
          } else {
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
          const hash = await sendTransaction(address, bettingContract.address, encodedABI);
          if (hash) {
            await Api.PostRequest('/transaction/create', { address, txHash: hash, type: 'PaymentSent' });
            await this.fetchTransactions();
            this.setState({ payouting: false, userHash: hash });
            NotificationManager.success('You requested to payout', "Success", 3000, null, null, '');
          } else {
            this.setState({ payouting: false, userHash: '' });
          }
        }
      });
  }

  getCols = () => {
    return [
      {
        Header: 'Transaction Hash',
        accessor: 'txHash',
        Cell: ({ original }) =>
          <a href={`https://ropsten.etherscan.io/tx/${original.txHash}`} target="_blank" without="true" rel="noopener noreferrer" color="primary">
            {original.txHash}
          </a>,
      },
      {
        Header: 'Type',
        accessor: 'type',
        Cell: ({ original }) => <Badge color="primary">{`${original.type}`}</Badge>,
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ original }) => <Badge>{`${original.status}`}</Badge>,
      },
      {
        Header: 'DATE/Time',
        accessor: 'createdAt',
        Cell: ({ original }) => <div>{moment(original.createdAt).format("MM/DD/YYYY hh:mm")}</div>,
      },
    ];
  };

  render() {
    if (this.state.loading) {
      return (<div className="loading" />);
    }
    const {
      getting, betting, starting, amount, status,
      winnering, payouting, userHash, ownerHash, bettingName, pot, startedTime, avaiableSeconds, transactions
    } = this.state;

    let remaninedSeconds = 0;
    if (status === 1) {
      const endTime = moment.unix(startedTime).add(avaiableSeconds, 'seconds');
      const diff = moment.duration(moment(endTime).diff(moment()));
      remaninedSeconds = parseInt(diff.asSeconds());
      remaninedSeconds = remaninedSeconds < 0 ? 0 : remaninedSeconds;
    }

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
                </div>
                <div className="row">
                  <Col xs="12" sm="6">
                    <Label>Betting Status</Label>
                    <Input
                      value={status === 0 ? "Not Started" :
                        status === 1 ? "Started" :
                          status === 2 ? "Finished" :
                            "Unknown"}
                      className="mb-2 form-control" type="text"
                      onChange={() => { }}
                    />
                  </Col>
                  <Col xs="12" sm="6">
                    <Label>Betting Name</Label>
                    <Input
                      value={bettingName}
                      className="mb-2 form-control" type="text"
                      onChange={() => { }}
                    />
                  </Col>
                  <Col xs="12" sm="6">
                    <Label>Token Amount</Label>
                    <Input
                      value={pot}
                      className="mb-2 form-control" type="number"
                      onChange={() => { }}
                    />
                  </Col>
                  <Col xs="12" sm="6">
                    <Label>Remained Seconds</Label>
                    <Input
                      value={remaninedSeconds}
                      className="mb-2 form-control" type="text"
                      onChange={() => { }}
                    />
                  </Col>
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
                  <Col xs="12" sm="6">
                    <Label>Betting Name</Label>
                    <Input
                      value={this.state.bname}
                      onChange={e => this.setState({ bname: e.target.value })}
                      className="mb-2 form-control" type="text"
                    />
                  </Col>
                  <Col xs="12" sm="6">
                    <Label>Amount</Label>
                    <Input
                      value={amount}
                      onChange={e => this.setState({ amount: e.target.value })}
                      className="mb-2 form-control" type="number"
                    />
                  </Col>
                  <Col xs="12">
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

        <Row className="mb-4">
          <Colxx xxs="12">
            <Card>
              <CardBody>
                <ReactTable
                  data={transactions}
                  columns={this.getCols()}
                  defaultPageSize={5}
                  PaginationComponent={DataTablePagination}
                  NoDataComponent={() => <div className="rt-noData">
                    No rows found
                  </div>}
                />
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
