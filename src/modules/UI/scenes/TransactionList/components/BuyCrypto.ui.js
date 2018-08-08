// @flow

import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux'
import s from '../../../../../locales/strings.js'
import { sprintf } from 'sprintf-js'
import { TouchableWithoutFeedback, View, Image } from 'react-native'
import T from '../../../components/FormattedText'
import style from '../style.js'
import type { GuiWallet } from '../../../../../types'

export type Props = {
  wallet: GuiWallet,
}

export default class BuyCrypto extends Component<Props> {
  getLogo = () => {
    const { wallet } = this.props
    switch (wallet.currencyCode) {
      case 'ETH':
        return wallet.symbolImageDarkMono
      default:
        return wallet.symbolImage
    }
  }
  getCurrencyName = () => {
    const { wallet } = this.props
    return wallet.currencyNames[wallet.currencyCode]
  }
  render () {
    return (
      <TouchableWithoutFeedback onPress={Actions.buysell}>
        <View style={style.buyCryptoContainer}>
          <View style={style.buyCryptoBox}>
            <Image style={style.buyCryptoBoxImage} source={{ uri: this.getLogo() }} resizeMode={'cover'} />
            <T style={style.buyCryptoBoxText}>{sprintf(s.strings.transaction_list_buy_crypto_message, this.getCurrencyName)}</T>
          </View>
          <View style={style.buyCryptoNoTransactionBox}>
            <T style={style.buyCryptoNoTransactionText}>{s.strings.transaction_list_no_tx_yet}</T>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}
