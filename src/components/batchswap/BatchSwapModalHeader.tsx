import React, { useContext } from 'react'
import { ArrowDown, Plus } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import { RowBetween, RowFixed } from '../Row'
import { TruncatedText } from './styleds'
import { TokenInParameter, TokenOutParameter } from '../../hooks/useBatchSwapCallback'
import { ETHER } from '@materia-dex/sdk'

export default function BatchSwapModalHeader({
  input,
  outputs
}: {
  input: TokenInParameter
  outputs: TokenOutParameter[]
}) {
  const theme = useContext(ThemeContext)
  const currencyInput = input.currency == ETHER ? ETHER : input.token

  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
      <RowBetween align="flex-end">
        <RowFixed gap={'0px'}>
          <CurrencyLogo currency={currencyInput} size={'24px'} style={{ marginRight: '12px' }} />
          <TruncatedText fontSize={24} fontWeight={900} color={''}>
            {input.amount?.toSignificant(6)}
          </TruncatedText>
        </RowFixed>
        <RowFixed gap={'0px'}>
          <Text fontSize={24} fontWeight={900} style={{ marginLeft: '10px' }}>
            {currencyInput?.symbol}
          </Text>
        </RowFixed>
      </RowBetween>

      {outputs.map((output, index) => (
        <>
          <RowFixed>
            {index == 0 ? (
              <ArrowDown size="16" color={theme.text2} style={{ marginLeft: '4px', minWidth: '16px' }} />
            ) : (
              <Plus size="16" color={theme.text2} style={{ marginLeft: '4px', minWidth: '16px' }} />
            )}
          </RowFixed>
          <RowBetween align="flex-end">
            <RowFixed gap={'0px'}>
              <CurrencyLogo
                currency={output.currency == ETHER ? ETHER : output.token}
                size={'24px'}
                style={{ marginRight: '12px' }}
              />
              <TruncatedText fontSize={24} fontWeight={900} color={''}>
                {`${output.percentage}%`}
              </TruncatedText>
            </RowFixed>
            <RowFixed gap={'0px'}>
              <Text fontSize={24} fontWeight={900} style={{ marginLeft: '10px' }}>
                {output.currency == ETHER ? 'ETH' : output.token?.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
        </>
      ))}
    </AutoColumn>
  )
}
