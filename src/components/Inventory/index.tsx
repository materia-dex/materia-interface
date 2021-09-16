import { Currency } from '@materia-dex/sdk'
import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { useUserTokens } from '../../state/wallet/hooks'
import { SectionTitle, InventoryContainer, SimpleInformationsTextParagraph, SectionContent } from '../../theme'
import InventoryItem from './InventoryItem'
import { Scrollbars } from 'react-custom-scrollbars'

interface InventoryProps {
  onCurrencySelect: (currency: Currency) => void
}

export default function Inventory({ onCurrencySelect }: InventoryProps) {
  const theme = useContext(ThemeContext)
  const userTokens = useUserTokens()

  return (
    <InventoryContainer>
      <SectionTitle className={theme.name}>Inventory</SectionTitle>
      <Scrollbars autoHeight autoHeightMin={550} autoHide>
        {userTokens && userTokens.length > 0 ? (
          userTokens.map((userToken: any) => {
            if (userToken && userToken.token) {
              return (
                <InventoryItem
                  onCurrencySelect={onCurrencySelect}
                  token={userToken.token}
                  key={userToken.token.address}
                  tokenName={userToken.token.name}
                  tokenSymbol={userToken.token.symbol}
                  tokenType={''}
                  balance={userToken.toExact(4)}
                  wrapped={false}
                  tokenAddress={userToken.token.address}
                />
              )
            } else {
              return (
                <InventoryItem
                  onCurrencySelect={onCurrencySelect}
                  token={userToken.currency}
                  key={userToken.currency.symbol}
                  tokenName={userToken.currency.name ?? ''}
                  tokenSymbol={userToken.currency.symbol ?? ''}
                  tokenType={''}
                  balance={userToken.toExact(4)}
                  wrapped={false}
                  tokenAddress={userToken.currency.address ?? ''}
                />
              )
            }
          })
        ) : (
          <SimpleInformationsTextParagraph className={"ml15 " + theme.name} >
            No items in your inventory
          </SimpleInformationsTextParagraph>
        )}
      </Scrollbars>
    </InventoryContainer>
  )
}
