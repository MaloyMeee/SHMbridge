import React from "react"
import { Component } from "react"
import { ethers } from "ethers"
import convertSvg from './images/convert.svg'
import arrowsPng from './images/arrows.png'

import { ConnectWallet } from './ConnectWallet'
import { WaitingForTransactionMessage } from './WaitingForTransactionMessage'
import { TransactionErrorMessage } from './TransactionErrorMessage'


const address = "0xd397210cb7af7e89a8f6c32ff0ba84ca1ff47aec"
const BNBid = "97"
const ERROR_CODE_TX_REJECTED_BY_USER = 4001

const abi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "addToken",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
];

class App extends Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAccount: null,
      txBeingSent: null,
      networkError: null,
      transactionError: null,
      balance: null,
      from: "0.0032",
      to: "100"
    }

    this.state = this.initialState
    this.handleFromChange = this.handleFromChange.bind(this)
    this.handleToChange = this.handleToChange.bind(this)
  }

  handleFromChange(event) {
    this.setState({ from: event.target.value })
  }

  handleToChange(event) {
    this.setState({ to: event.target.value })
  }

  _connectWallet = async () => {
    if (window.ethereum === undefined) {
      this.setState({
        networkError: 'Please install Metamask!'
      })
      return
    }

    const [selectedAddress] = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    if (!this._checkNetwork()) { return }

    this._initialize(selectedAddress)

    window.ethereum.on('accountsChanged', ([newAddress]) => {
      if (newAddress === undefined) {
        return this._resetState()
      }

      this._initialize(newAddress)
    })

    window.ethereum.on('chainChanged', ([networkId]) => {
      this._resetState()
    })
  }

  async _initialize(selectedAddress) {
    this._provider = new ethers.providers.Web3Provider(window.ethereum)

    this._bridge = new ethers.Contract(
      address,
      abi,
      this._provider.getSigner(0)
    )

    this.setState({
      selectedAccount: selectedAddress
    }, async () => {
      await this.updateBalance()
    })
  }

  async updateBalance() {
    const newBalance = (await this._provider.getBalance(
      this.state.selectedAccount
    )).toString()

    this.setState({
      balance: newBalance
    })
  }

  _resetState() {
    this.setState(this.initialState);
  }

  _checkNetwork() {
    if (window.ethereum.networkVersion === BNBid) { return true }

    this.setState({
      networkError: "Please switch and connect to BSC(BEP-20)"
    })

    return false
  }

  _dismissNetworkError = () => {
    this.setState({
      networkError: null
    })
  }

  _dismissTransactionError = () => {
    this.setState({
      transactionError: null
    })
  }

  buy = async () => {
    try {
      const tx = await this._bridge.buy({
        value: ethers.utils.parseEther(this.state.from)
      })

      this.setState({
        txBeingSent: tx.hash
      })

      await tx.wait()
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) { return }

      console.error(error)

      this.setState({
        transactionError: error
      })
    } finally {
      this.setState({
        txBeingSent: null
      })
      await this.updateBalance()
    }
  }

  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message
    }

    return error.message
  }

  render() {
    if (!this.state.selectedAccount) {
      return (<ConnectWallet
        connectWallet={this._connectWallet}
        networkError={this.state.networkError}
        dismiss={this._dismissNetworkError}
      />)
    }

    return (
      <>
        <main>
          <div className="container">

            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}

            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={this._dismissTransactionError}
              />
            )}

            {this.state.balance &&
              <p>Your balance: {ethers.utils.formatEther(this.state.balance)} BNB</p>}

            <button type="submit" className="form-submit" onClick={this._connectWallet}>Connect</button>

            <h1>A fast and reliable way to get test tokens</h1>

            <div className="main">
              <div className="wrapper">
                <div className="tabs">
                  <div className="tab active" data-tab="convert">
                    <div className="tab-icon">
                      <img src={convertSvg} alt="" />
                    </div>
                    <div className="tab-title">Convert</div>
                  </div>
                </div>

                <div className="content show" data-child="convert">
                  <form className="form">
                    <>
                      <div className="form-inputs">
                        <div className="form-selects">
                          <div className="form-select">
                            <label for="from">From BNB</label>
                            <input className="select" name="from" id="from" required placeholder="0.0032" value={this.state.from} onChange={this.handleFromChange}>
                            </input>
                          </div>

                          <div className="form-select__icon switch-currencies">
                            <img src={arrowsPng} alt="" />
                          </div>

                          <div className="form-select">
                            <label for="to">To SHM</label>
                            <input className="select" name="to" id="to" required placeholder="10" value={(parseFloat(this.state.from) / 0.0032) * 100}>

                            </input>
                          </div>
                        </div>
                      </div>

                      <div className="form-info">
                        <div className="loader">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <button type="submit" className="form-submit" onClick={this.buy}>Buy</button>
                      </div>

                    </>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }
}

export default App