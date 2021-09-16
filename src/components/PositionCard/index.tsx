import React, { useState, useContext } from 'react'
import { JSBI, Pair, Percent } from '@materia-dex/sdk'
import { darken } from 'polished'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { 
  ExternalLink, 
  StyledPositionCard, 
  Dots, 
  ActionButton, 
  SimpleTextParagraph, 
  IconButton,
  SectionTitle, 
  SecondaryPanelBoxContainer, 
} from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ButtonMateriaPrimary } from '../Button'
import { CardNoise } from '../earn/styled'

import { useColor } from '../../hooks/useColor'

import Card from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`


interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
}

export function MinimalPositionCard({ pair, showUnwrapped = false, border }: PositionCardProps) {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false)
        ]
      : [undefined, undefined]

  return (
    <>
      {userPoolBalance && JSBI.greaterThan(userPoolBalance.raw, JSBI.BigInt(0)) ? (
        <>
          <SectionTitle className={ `mt0 mb0 ${theme.name}` }>Your position</SectionTitle>
          <SecondaryPanelBoxContainer className={ `${theme.name} mb20` }>
              <div className="inner-content">
                <AutoColumn gap="12px" className="p15">
                  <FixedHeightRow onClick={() => setShowMore(!showMore)}>
                    <RowFixed>
                      <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin={true} size={14} radius={true} />
                      <Text className={ `evidence-text ${theme.name}` }>
                        {currency0.symbol}/{currency1.symbol}
                      </Text>
                    </RowFixed>
                    <RowFixed>
                      <Text className={ `evidence-text ${theme.name}` }>
                        {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
                      </Text>
                    </RowFixed>
                  </FixedHeightRow>
                  <AutoColumn gap="4px">
                    <SimpleTextParagraph className={ `${theme.name} m0` }>
                      <span className="row m0">
                        <span className="column">Your pool share:</span>
                        <span className="column">{poolTokenPercentage ? ( <span className={ `evidence-text ml5 ${theme.name}` }>{poolTokenPercentage.toFixed(6) + '%'}</span> ) : ( '-' )}</span>
                      </span>
                      <span className="clear-fix"></span>
                      <span className="row m0">
                        <span className="column">{currency0.symbol}:</span>
                        <span className="column">{token0Deposited ? ( <span className={ `evidence-text ml5 ${theme.name}` }>{token0Deposited?.toSignificant(6)}</span> ) : ( '-' )}</span>
                      </span>
                      <span className="clear-fix"></span>
                      <span className="row m0">
                        <span className="column">{currency1.symbol}:</span>
                        <span className="column">{token1Deposited ? ( <span className={ `evidence-text ml5 ${theme.name}` }>{token1Deposited?.toSignificant(6)}</span> ) : ( '-' )}</span>
                      </span>
                      <span className="clear-fix"></span>
                    </SimpleTextParagraph>
                  </AutoColumn>
                </AutoColumn>
              </div>      
          </SecondaryPanelBoxContainer>   
        </>
      ) : (
        <SecondaryPanelBoxContainer className={ `${theme.name} mb20` }>
            <div className="inner-content">
              <SimpleTextParagraph className={ `p10 ${theme.name}` }>
                <span role="img" aria-label="wizard-icon"></span>{' '}
                By adding liquidity you'll earn 0.3% of all trades on this pair proportional to your share of the pool.
                Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
              </SimpleTextParagraph>
            </div>
        </SecondaryPanelBoxContainer>
      )}
    </>
  )
}

export default function FullPositionCard({ pair, border }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false)
        ]
      : [undefined, undefined]

  const backgroundColor = useColor(pair?.token0)
  const theme = useContext(ThemeContext)

  return (
    <StyledPositionCard bgColor={backgroundColor} className={ `p15 mb5 ${theme.name}` }>
      <CardNoise />
      <AutoColumn gap="12px">
        <FixedHeightRow>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin={true} size={14} radius={true} />
            <Text fontWeight={900} fontSize={14}>
              {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}/${currency1.symbol}`}
            </Text>
          </RowFixed>

          <RowFixed>
            <ActionButton className={theme.name} onClick={() => setShowMore(!showMore)}>
              <label className={theme.name}>Manage</label> {showMore ? ( <ChevronUp/> ) : ( <ChevronDown /> )}
            </ActionButton>            
          </RowFixed>
        </FixedHeightRow>

        {showMore && (
          <AutoColumn gap="8px">
            <SimpleTextParagraph className={ `${theme.name} mt0 mb0` }>
              <span className="row">
                <span className="column">Your pool tokens:</span>
                <span className="column">{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</span>
              </span>
              <span className="clear-fix"></span>
              <span className="row">
                <span className="column">Pooled {currency0.symbol}:</span>
                <span className="column">
                  {token0Deposited ? (<> {token0Deposited?.toSignificant(6)} <CurrencyLogo size="20px" currency={currency0} /> </>) : ( '-' )}
                </span>
              </span>
              <span className="clear-fix"></span>
              <span className="row">
                <span className="column">Pooled {currency1.symbol}:</span>
                <span className="column">{token1Deposited ? (<>{token1Deposited?.toSignificant(6)} <CurrencyLogo size="20px" currency={currency1} /></>) : ( '-' )}  </span>
              </span>
              <span className="clear-fix"></span>
              <span className="row">
                <span className="column">Your pool share:</span>
                <span className="column">{poolTokenPercentage ? poolTokenPercentage.toFixed(2) + '%' : '-'}</span>
              </span>
            </SimpleTextParagraph>     
            <SimpleTextParagraph className={ `text-left ${theme.name} m0` }>
              <ExternalLink href={`https://info.materiadex.com/account/${account}`}>
              View accrued fees and analytics
                <IconButton className={ `hide-classic ${theme.name}` }>
                  <span className="icon-symbol">↗</span>
                </IconButton>
              </ExternalLink>
            </SimpleTextParagraph>             
            <RowBetween marginTop="10px">
              <ButtonMateriaPrimary
                as={Link}
                to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}
                width="48%"
                className={theme.name}
              >
                Add
              </ButtonMateriaPrimary>
              <ButtonMateriaPrimary
                as={Link}
                width="48%"
                to={`/remove/${currencyId(currency0)}/${currencyId(currency1)}`}
                className={theme.name}
              >
                Remove
              </ButtonMateriaPrimary>
            </RowBetween>
          </AutoColumn>
        )}
      </AutoColumn>
    </StyledPositionCard>
  )
}
