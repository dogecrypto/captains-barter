// @flow

import { bns } from 'biggystring'
import type { EdgeMetadata, EdgeParsedUri, EdgeTransaction, EdgeSpendInfo } from 'edge-core-js'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { OPEN_AB_ALERT, SEND_CONFIRMATION } from '../../../../constants/indexConstants'
import { getAccount, getWallet } from '../../../Core/selectors.js'
import {
  broadcastTransaction,
  getMaxSpendable,
  makeSpend,
  saveTransaction,
  signTransaction,
  getPaymentProtocolInfo,
  makeSpendInfo
} from '../../../Core/Wallets/api.js'
import type { Dispatch, GetState } from '../../../ReduxTypes'
import { openABAlert } from '../../components/ABAlert/action'
import { getSelectedWalletId } from '../../selectors.js'
import { getSpendInfo, getTransaction, getAuthRequired } from './selectors'
import type { AuthType, GuiMakeSpendInfo } from './selectors'
import { checkPin } from '../../../Core/Account/api.js'

import s from '../../../../locales/strings.js'

const PREFIX = 'UI/SendConfimation/'

export const UPDATE_IS_KEYBOARD_VISIBLE = PREFIX + 'UPDATE_IS_KEYBOARD_VISIBLE'
export const UPDATE_SPEND_PENDING = PREFIX + 'UPDATE_SPEND_PENDING'
export const RESET = PREFIX + 'RESET'
export const UPDATE_PAYMENT_PROTOCOL_TRANSACTION = PREFIX + 'UPDATE_PAYMENT_PROTOCOL_TRANSACTION'
export const UPDATE_TRANSACTION = PREFIX + 'UPDATE_TRANSACTION'

export const updateAmount = (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string) => (dispatch: Dispatch, getState: GetState) => {
  const amountFiatString: string = bns.mul(exchangeAmount, fiatPerCrypto)
  const amountFiat: number = parseFloat(amountFiatString)
  const metadata: EdgeMetadata = { amountFiat }
  dispatch(createTX({ nativeAmount, metadata }, false))
}

type EdgePaymentProtocolUri = EdgeParsedUri & { paymentProtocolURL: string }

export const paymentProtocolUriReceived = ({ paymentProtocolURL }: EdgePaymentProtocolUri) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)

  Promise.resolve(paymentProtocolURL)
    .then(paymentProtocolURL => getPaymentProtocolInfo(edgeWallet, paymentProtocolURL))
    .then(makeSpendInfo)
    .then(spendInfo => {
      const authRequired = getAuthRequired(state, spendInfo)
      dispatch(newSpendInfo(spendInfo, authRequired))

      return makeSpend(edgeWallet, spendInfo).then(
        edgeTransaction => {
          dispatch(updatePaymentProtocolTransaction(edgeTransaction))
          Actions[SEND_CONFIRMATION]('fromScan')
        },
        error => {
          dispatch(makeSpendFailed(error))
          Actions[SEND_CONFIRMATION]('fromScan')
        }
      )
    })
    .catch((error: Error) => {
      console.log(error)
      setTimeout(
        () => Alert.alert(s.strings.scan_invalid_address_error_title, s.strings.scan_invalid_address_error_description, [{ text: s.strings.string_ok }]),
        500
      )
    })
}

export const MAKE_PAYMENT_PROTOCOL_TRANSACTION_FAILED = PREFIX + 'MAKE_SPEND_FAILED'
// add empty string if there is an error but we don't need text feedback to the user
export const makeSpendFailed = (error: Error | null) => ({
  type: MAKE_PAYMENT_PROTOCOL_TRANSACTION_FAILED,
  data: { error }
})

export const NEW_SPEND_INFO = PREFIX + 'NEW_SPEND_INFO'
export const newSpendInfo = (spendInfo: EdgeSpendInfo, authRequired: AuthType) => ({
  type: NEW_SPEND_INFO,
  data: { spendInfo, authRequired }
})

export const createTX = (parsedUri: GuiMakeSpendInfo | EdgeParsedUri, forceUpdateGui?: boolean = true) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)
  const parsedUriClone = { ...parsedUri }
  const spendInfo = getSpendInfo(state, parsedUriClone)

  const authRequired = getAuthRequired(state, spendInfo)
  dispatch(newSpendInfo(spendInfo, authRequired))

  makeSpend(edgeWallet, spendInfo)
    .then(edgeTransaction => dispatch(updateTransaction(edgeTransaction, parsedUriClone, forceUpdateGui, null)))
    .catch(e => dispatch(updateTransaction(null, parsedUriClone, forceUpdateGui, e)))
}

export const updateMaxSpend = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)
  const spendInfo = getSpendInfo(state)

  getMaxSpendable(edgeWallet, spendInfo)
    .then(nativeAmount => {
      const state = getState()
      const spendInfo = getSpendInfo(state, { nativeAmount })
      const authRequired = getAuthRequired(state, spendInfo)

      dispatch(reset())

      dispatch(newSpendInfo(spendInfo, authRequired))
      dispatch(createTX({ nativeAmount }, true))
    })
    .catch(e => console.log(e))
}

export const signBroadcastAndSave = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = getAccount(state)
  const selectedWalletId = getSelectedWalletId(state)
  const wallet = getWallet(state, selectedWalletId)
  const edgeUnsignedTransaction = getTransaction(state)
  const spendInfo = state.ui.scenes.sendConfirmation.spendInfo
  if (!spendInfo) throw new Error('Invalid Spend Request')
  const authRequired = getAuthRequired(state, spendInfo)
  const pin = state.ui.scenes.sendConfirmation.pin

  dispatch(updateSpendPending(true))

  let edgeSignedTransaction = edgeUnsignedTransaction
  try {
    if (authRequired === 'pin') {
      const isAuthorized = await checkPin(account, pin)
      if (!isAuthorized) throw new IncorrectPinError()
    }

    edgeSignedTransaction = await signTransaction(wallet, edgeUnsignedTransaction)
    edgeSignedTransaction = await broadcastTransaction(wallet, edgeSignedTransaction)
    await saveTransaction(wallet, edgeSignedTransaction)
    dispatch(updateSpendPending(false))
    Actions.pop()
    const successInfo = {
      success: true,
      title: 'Transaction Sent',
      message: 'Your transaction has been successfully sent.'
    }
    dispatch(openABAlert(OPEN_AB_ALERT, successInfo))
  } catch (e) {
    dispatch(updateSpendPending(false))
    const errorInfo = {
      success: false,
      title: 'Transaction Failure',
      message: e.message
    }
    dispatch(updateTransaction(edgeSignedTransaction, null, true, new Error('broadcastError')))
    dispatch(openABAlert(OPEN_AB_ALERT, errorInfo))
  }
}

export const reset = () => ({
  type: RESET,
  data: {}
})

export const updatePaymentProtocolTransaction = (transaction: EdgeTransaction) => ({
  type: UPDATE_PAYMENT_PROTOCOL_TRANSACTION,
  data: { transaction }
})

export const updateTransaction = (transaction: ?EdgeTransaction, parsedUri: ?EdgeParsedUri, forceUpdateGui: ?boolean, error: ?Error) => {
  return {
    type: UPDATE_TRANSACTION,
    data: { transaction, parsedUri, forceUpdateGui, error }
  }
}

export const updateSpendPending = (pending: boolean) => ({
  type: UPDATE_SPEND_PENDING,
  data: { pending }
})

export const NEW_PIN = PREFIX + 'NEW_PIN'
export const newPin = (pin: string) => ({
  type: NEW_PIN,
  data: { pin }
})

export { createTX as updateMiningFees, createTX as updateParsedURI, createTX as uniqueIdentifierUpdated }

const errorNames = {
  IncorrectPinError: 'IncorrectPinError'
}
export function IncorrectPinError (message: ?string = 'Incorrect Pin') {
  const error = new Error(message)
  error.name = errorNames.IncorrectPinError
  return error
}
