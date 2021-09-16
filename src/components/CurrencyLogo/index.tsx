import React, { useMemo } from 'react'
import styled from 'styled-components'
import { Currency, ETHER, Token } from '@materia-dex/sdk'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import useHttpLocations from '../../hooks/useHttpLocations'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import Logo from '../Logo'
import { isAddress } from '../../utils'

export const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
`
const StyledLogo = styled(Logo)<{ size: string; rounded: 'true' | 'false' }>`
  width: ${({ size }) => size};
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
  border-radius: ${({ rounded }) => (rounded == 'true' ? '15px' : 'unset')};
`
export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
  radius
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
  radius?: boolean
}) {
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  const srcs: string[] = useMemo(() => {
    if (currency === ETHER) return []

    if (currency instanceof Token || (currency as any)?.address) {
      const address = currency instanceof Token ? currency.address : (currency as any)?.address
      const checksummedAddress = isAddress(address)
      const currencyAddress = !checksummedAddress ? address : checksummedAddress

      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, getTokenLogoURL(currencyAddress)]
      }

      return [getTokenLogoURL(currencyAddress)]
    }
    return []
  }, [currency, uriLocations])

  if (currency === ETHER) {
    return <StyledEthereumLogo src={EthereumLogo} size={size} style={style} className="ethereumLogo" />
  }

  return (
    <StyledLogo
      size={size}
      rounded={radius ? 'true' : 'false'}
      srcs={srcs}
      alt={`${currency?.symbol ?? 'token'} logo`}
      style={style}
      className="tokenLogo"
    />
  )
}
