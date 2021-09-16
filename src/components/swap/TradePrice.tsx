import React from 'react'
import { Currency, Price } from '@materia-dex/sdk'
import { useContext } from 'react'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import { Field } from '../../state/swap/actions'

interface TradePriceProps {
  price?: Price
  originalCurrencies: { [field in Field]?: Currency }
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

const PriceLabel = styled.div`
  display: flex;
  justify-content: center;
  margin: 0 auto;
`

export default function TradePrice({ price, originalCurrencies, showInverted, setShowInverted }: TradePriceProps) {
  const theme = useContext(ThemeContext)

  const formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  // const label = showInverted
  //   ? `${price?.quoteCurrency?.symbol} per ${price?.baseCurrency?.symbol}`
  //   : `${price?.baseCurrency?.symbol} per ${price?.quoteCurrency?.symbol}`
  const label = showInverted
    ? `${originalCurrencies[Field.OUTPUT]?.symbol} per ${originalCurrencies[Field.INPUT]?.symbol}`
    : `${originalCurrencies[Field.INPUT]?.symbol} per ${originalCurrencies[Field.OUTPUT]?.symbol}`

  const tradePrice = (formattedPrice ?? '-') + ' ' + label

  return (
    <Text
      fontWeight={900}
      fontSize={14}
      color={theme.text2}
      style={{ justifyContent: 'center', alignItems: 'center' }}
    >
      {show ? (
        <>
          <PriceLabel>
            <TYPE.body color={theme.blue2} fontWeight={900} fontSize={14}>Price</TYPE.body>
          </PriceLabel>
          <div>
            {tradePrice}
          </div>
        </>
      ) : (
          '-'
        )}
    </Text>
  )
}
