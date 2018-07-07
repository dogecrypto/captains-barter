// @flow

import {Linking} from 'react-native'
import {Actions} from 'react-native-router-flux'
import type { EdgeReceiveAddress, EdgeTransaction } from 'edge-core-js'
import * as WALLET_API from '../../../Core/Wallets/api'

const formatWallet = (w) => ({
  'id': w.id,
  'name': w.name,
  'type': w.type,
  'currencyCode': w.currencyCode,
  'primaryNativeBalance': w.currencyCode,
  'fiatCurrencyCode': w.fiatCurrencyCode
})

type Context = any
type Wallet = any
type Wallets = Array<Wallet>
type Address = {
  encodeUri: string,
  address: EdgeReceiveAddress
}

// TODO: either get rid of PluginBridge class or refactor out these globals
let navStack: Array<string> = []
let _context: Context = null

export function pop (): any {
  navStack.pop()
  if (navStack.length === 0) {
    Actions.pop()
  } else {
    if (_context) {
      _context.back()
    }
  }
}

export class PluginBridge {
  context: Context

  constructor (context: Context) {
    _context = this.context = context
    // reset navstack
    navStack = []
  }

  componentDidMount () {
    Actions.refresh({
      leftTitle: 'Back'
    })
  }

  bitidAddress (): Promise<string> {
    // TODO: not supported by core...yet
    return Promise.reject(new Error('not implemented'))
  }

  bitidSignature (): Promise<string> {
    // TODO: not supported by core...yet
    // const {uri, message} = data
    return Promise.reject(new Error('not implemented'))
  }

  chooseWallet (): Promise<any> {
    this.context.toggleWalletList()
    return Promise.resolve(null)
  }

  selectedWallet (): Promise<Wallet> {
    return Promise.resolve(formatWallet(this.context.walletId))
  }

  wallets (): Promise<Wallets> {
    console.log(this.context.wallets)
    const wallets = Object.keys(this.context.wallets)
      .map((key) => formatWallet(this.context.wallets[key]))
    return Promise.resolve(wallets)
  }

  getAddress (data: any): Promise<Address> {
    const walletId = data.walletId
    const coreWallet = this.context.coreWallets[walletId]
    const currencyCode = data.currencyCode
    return WALLET_API.getReceiveAddress(coreWallet, currencyCode)
      .then((address) => {
        const encodeUri = coreWallet.encodeUri(address)
        return {encodeUri, address}
      })
  }

  finalizeReceiveRequest (data: any): Promise<boolean> {
    // const {coreWallet, receiveAddress} = data
    return Promise.reject(new Error('not implemented'))
  }

  _spend (spendTargets, lockInputs, broadcast): Promise<boolean> {
    return new Promise((resolve, reject) => {
      reject(new Error('not implemented'))
      /*
      Actions.sendConfirmation({
        abcSpendInfo: {spendTargets},
        finishCallback: (error, abcTransaction) => {
          (error) ? reject(error) : resolve(abcTransaction)
        },
        lockInputs,
        broadcast
      })
      */
    })
  }

  createSpendRequest (data: any): Promise<boolean> {
    const {toAddress, nativeAmount} = data
    return this._spend([{
      publicAddress: toAddress,
      nativeAmount: nativeAmount
    }], true, true)
  }

  createSpendRequest2 (data: any): Promise<boolean> {
    const {toAddress, toAddress2, nativeAmount, nativeAmount2} = data
    return this._spend([{
      publicAddress: toAddress,
      nativeAmount: nativeAmount
    }, {
      publicAddress: toAddress2,
      nativeAmount: nativeAmount2
    }], true, true)
  }

  requestSign (data: any): Promise<boolean> {
    const {toAddress, nativeAmount} = data
    return this._spend([{
      publicAddress: toAddress,
      nativeAmount: nativeAmount
    }], true, false)
  }

  broadcastTx (data: any): Promise<EdgeTransaction> {
    const {coreWallet, rawtx} = data
    return WALLET_API.broadcastTransaction(coreWallet, rawtx)
  }

  saveTx (data: any): Promise<EdgeTransaction> {
    const {coreWallet, signedTransaction} = data
    return WALLET_API.signTransaction(coreWallet, signedTransaction)
  }

  requestFile (): Promise<string> {
    // TODO
    // const {options} = data
    return Promise.reject(new Error('not implemented'))
  }

  readData (data: any): Promise<string> {
    /* TODO: replace with enc folder */
    return this.context.folder.file(data.key).getText()
  }

  writeData (data: any): Promise<boolean> {
    const {key, value} = data
    /* TODO: replace with enc folder */
    return this.context.folder.file(key)
      .setText(value)
      .then(() => {
        return true
      })
  }

  clearData (): Promise<boolean> {
    /* TODO: replace with enc folder */
    return this.context.folder.delete()
      .then(() => {
        return true
      })
  }

  getAffiliateInfo (): Promise<any> {
    return Promise.reject(new Error('not implemented'))
  }

  get (data: any): Promise<string> {
    const {key} = data
    if (this.context.plugin.environment[key]) {
      return Promise.resolve(this.context.plugin.environment[key])
    } else {
      return Promise.reject(new Error(`${key} is not valid for plugin`))
    }
  }

  debugLevel (data: any): Promise<boolean> {
    console.log(`LOGGING ${this.context.plugin.key}  ${data.level}: ${data.text}`)
    return Promise.resolve(true)
  }

  showAlert (data: any): Promise<boolean> {
    this.context.showAlert({success: data['success'], title: data['title'], message: data['message']})
    return Promise.resolve(true)
  }

  hideAlert (): Promise<boolean> {
    return Promise.reject(new Error('not implemented'))
  }

  title (data: any): Promise<boolean> {
    const {title} = data
    this.context.renderTitle(title)
    return Promise.resolve(true)
  }

  back (): Promise<boolean> {
    pop()
    return Promise.resolve(true)
  }

  exit (): Promise<boolean> {
    Actions.pop()
    return Promise.resolve(true)
  }

  launchExternal (data: any): Promise<any> {
    return Linking.openURL(data.uri)
  }

  navStackClear (): Promise<boolean> {
    navStack = []
    return Promise.resolve(true)
  }

  navStackPush (data: any): Promise<boolean> {
    navStack.push(data.path)
    return Promise.resolve(true)
  }

  navStackPop (): Promise<string> {
    const path = navStack.pop()
    return Promise.resolve(path)
  }
}
