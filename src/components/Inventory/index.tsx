import { Currency } from '@materia-dex/sdk'
import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { useUserTokens } from '../../state/wallet/hooks'
import { SectionTitle, InventoryContainer, SimpleInformationsTextParagraph, SectionContent, StyledPositionCard } from '../../theme'
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
      <Scrollbars autoHeight autoHeightMin={540} autoHide>
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
          <StyledPositionCard bgColor={null} className={`p15 mb5 mt5 ${theme.name}`}>
            <svg className="ml15" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
            <SimpleInformationsTextParagraph className={"ml15 " + theme.name} >
                Your items will appear here.
            </SimpleInformationsTextParagraph>
          </StyledPositionCard>
        )}
      </Scrollbars>
    </InventoryContainer>
  )
}
