import { Currency, ETHER, JSBI, Pair, Token, TokenAmount } from '@materia-dex/sdk'
import React, { useState, useContext, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { AutoRow, RowBetween } from '../Row'
import { CurrencyFormPanel, ActionButton, DropDownButton, Erc20Badge, EthItemBadge, DynamicGrid, MainOperationButton } from '../../theme'
import { Input as NumericalInput } from '../NumericalInput'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'

import { useActiveWeb3React } from '../../hooks'
import { useTranslation } from 'react-i18next'
import useCheckIsEthItem from '../../hooks/useCheckIsEthItem'
import { ZERO_ADDRESS } from '../../constants'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import Slider from '../Slider'

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`
const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const MobileCurrencyLogo = styled.div`
  margin-left: 10px;
  display: none;
  @media (max-width: 1050px) {
    display: inline-block;
  }
  &.smallTokenImage {
    @media (min-width: 1050px) {
      display: inline-block;
    }
  }
`

const TokenImage = styled.div<{ showBackground: boolean }>`
  background: ${props => (props.showBackground ? ({ theme }) => theme.tokenBackground : 'unset')}    
  background-size: contain;
  height: 300px;
  width: 300px;
  background-position: ${({ theme }) => (theme.name == 'classic' ? '' : '-5px')} center!important;
  /*display: table-cell;*/
  margin: 0 auto;
  vertical-align: middle;
  @media (max-width: 1050px) { padding: 2rem !important; }
  @media (max-width: 450px) { padding: 1rem !important; margin-top: -2.5rem; }

  &.single { padding-top: 12.5%; }
  &.single.default { padding-top: 30%; }
  &.single.default > img { margin-top: 0; }
  
  &.stake-liquidity-token img.tokenLogo { margin-top: 30%; }
  &.remove-liquidity { width: 20%; margin-top: 50px; padding: 0px; height: 130px; background-position: 10px center!important; }
  &.double.remove-liquidity img.tokenLogo, &.double.remove-liquidity img.ethereumLogo { width: 50%; margin-top: 10%;}  
  &.single.remove-liquidity > img { width: 50%; padding-top: 15%; margin-left: 40px; }
`

const TokenImageContainer = styled.div`
  float: none;
  margin: 0 auto;
  @media (max-width: 1050px) {
    display: none;
  }
`

const StyledDropDown = styled(DropDown) <{ selected: boolean }>`
  margin: 0 0.25rem 0 0.5rem;
  height: 35%;

  & path {
    stroke-width: 1.5px;
  }

  &.dark path,
  &.classic path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  }
  &.light path {
    stroke: ${({ selected, theme }) => (selected ? theme.black : theme.black)};
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.75rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size:  ${({ active }) => (active ? '20px' : '16px')};
  color: ${({ theme }) => theme.text1};
  font-weight:900;
  &.classic { 
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
`

const PercentageSlider = styled(Slider)`
  margin-left: unset !important;
  width: 25% !important;
`

interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
  customBalanceText?: string
  fatherPage?: string
  smallTokenImage?: boolean | undefined
  percentage?: boolean | undefined
  badgeWidth?: any
}

export function roundInput(token: Token, value: string): string {
  if (token.decimals >= 18 || !value || value.trim() == '') return value

  const units: string = parseUnits(value, 18).toString()
  const amount: JSBI = JSBI.BigInt(Math.trunc(Number(formatUnits(units, 18 - token.decimals))))
  const roundedAmount: JSBI = JSBI.add(amount, JSBI.BigInt(1))
  const tokenAmount = new TokenAmount(token, roundedAmount)

  return tokenAmount.toExact()
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label = 'Input',
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
  customBalanceText,
  fatherPage,
  smallTokenImage = false,
  percentage = false,
  badgeWidth = undefined
}: CurrencyInputPanelProps) {
  const { t } = useTranslation()

  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useContext(ThemeContext)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])
  const customFatherPageCssClass = fatherPage ? fatherPage : 'default'

  const ethItem =
    useCheckIsEthItem((currency instanceof Token ? currency?.address : undefined) ?? ZERO_ADDRESS)?.ethItem ?? undefined
  const showErc20Badge = currency !== ETHER && ethItem !== undefined && ethItem === false && pair === null
  const showEthItemBadge = currency !== ETHER && ethItem !== undefined && ethItem === true && pair === null

  return (
    <>
      <CurrencyFormPanel id={id} className={`${theme.name} ${customFatherPageCssClass}`}>
        <div className={'itemsContainer ' + customFatherPageCssClass}>
          {account && currency && showMaxButton && label !== 'To' && (
            <ActionButton className={theme.name} onClick={onMax}>
              MAX
            </ActionButton>
          )}
          {currency && showErc20Badge && (
            <Erc20Badge className={`${theme.name} ml5 mb5`} width={badgeWidth}>
              ERC20
            </Erc20Badge>
          )}
          {currency && showEthItemBadge && (
            <EthItemBadge className={`${theme.name} ml5 mb5`} width={badgeWidth}>
              ITEM
            </EthItemBadge>
          )}
          {!smallTokenImage && (
            <TokenImageContainer>
              <TokenImage showBackground={true} className={(!pair ? 'single' : 'double') + ' ' + customFatherPageCssClass}>
                {pair ? (
                  <DoubleCurrencyLogo
                    currency0={pair.token0}
                    currency1={pair.token1}
                    size={110}
                    margin={false}
                    radius={true}
                  />
                ) : currency ? (
                  <CurrencyLogo currency={currency} size={'110px'} />
                ) : null}
              </TokenImage>
            </TokenImageContainer>
          )}

          {!hideInput && (
            <div className={'labelRow ' + customFatherPageCssClass}>
              <RowBetween>
                <div className={'label ' + customFatherPageCssClass}>{label}</div>
                {account && (
                  <div className={'label link ' + customFatherPageCssClass} onClick={onMax}>
                    {!hideBalance && !!currency && selectedCurrencyBalance
                      ? (customBalanceText ?? 'Balance: ') + selectedCurrencyBalance?.toSignificant(6)
                      : ' -'}
                  </div>
                )}
              </RowBetween>
            </div>
          )}
          {percentage ? (
            <RowBetween>
              <DynamicGrid className={"percentage-grid"} columns={4}>
                <MainOperationButton className={`width80 ${theme.name} customPercentage`} onClick={() => onUserInput('10')}>10%</MainOperationButton>
                <MainOperationButton className={`width80 ${theme.name} customPercentage`} onClick={() => onUserInput('25')}>25%</MainOperationButton>
                <MainOperationButton className={`width80 ${theme.name} customPercentage`} onClick={() => onUserInput('50')}>50%</MainOperationButton>
                <MainOperationButton className={`width80 ${theme.name} customPercentage`} onClick={() => onUserInput('75')}>75%</MainOperationButton>
              </DynamicGrid>
            </RowBetween>
          ) : (<></>)}
          <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={disableCurrencySelect}>
            {!hideInput && (
              <>
                {percentage ? (
                  <>
                    <PercentageSlider
                      value={parseInt(value ?? 0)}
                      onChange={val => {
                        onUserInput((val ?? 0).toString())
                      }}
                      style={{ width: '75%', marginRight: 10, padding: '15px 0' }}
                    />
                    <div className="slider-percentage text-left">{value}%</div>
                  </>
                ) : (
                  <NumericalInput
                    className="token-amount-input"
                    value={value}
                    onUserInput={val => {
                      onUserInput(val)
                    }}
                  />
                )}
              </>
            )}
            <DropDownButton
              className={`open-currency-select-button ${theme.name}`}
              selected={!!currency}
              onClick={() => {
                if (!disableCurrencySelect) {
                  setModalOpen(true)
                }
              }}
            >
              <Aligner>
                <MobileCurrencyLogo className={smallTokenImage ? 'smallTokenImage' : ''}>
                  {pair ? (
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                  ) : currency ? (
                    <CurrencyLogo currency={currency} size={'24px'} />
                  ) : null}
                </MobileCurrencyLogo>
                {pair ? (
                  <StyledTokenName className={`pair-name-container ${theme.name}`}>
                    {pair?.token0.symbol}:{pair?.token1.symbol}
                  </StyledTokenName>
                ) : (
                  <StyledTokenName
                    className={`token-symbol-container ${theme.name}`}
                    active={Boolean(currency && currency.symbol)}
                  >
                    {(currency && currency.symbol && currency.symbol.length > 20
                      ? currency.symbol.slice(0, 4) +
                      '...' +
                      currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                      : currency?.symbol) || t('selectToken')}
                  </StyledTokenName>
                )}
                {!disableCurrencySelect && <StyledDropDown className={`${theme.name}`} selected={!!currency} />}
              </Aligner>
            </DropDownButton>
          </InputRow>
        </div>
        {!disableCurrencySelect && onCurrencySelect && (
          <CurrencySearchModal
            isOpen={modalOpen}
            onDismiss={handleDismissSearch}
            onCurrencySelect={onCurrencySelect}
            selectedCurrency={currency}
            otherSelectedCurrency={otherCurrency}
            showCommonBases={showCommonBases}
          />
        )}
      </CurrencyFormPanel>
    </>
  )
}
