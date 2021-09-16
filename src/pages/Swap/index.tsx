import { CurrencyAmount, ETHER, JSBI, Token, Trade } from '@materia-dex/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useIsClassicMode } from '../../state/user/hooks'
import { RefreshCw, Plus, Minus, Link, ChevronUp, ChevronDown } from 'react-feather'
import ReactGA from 'react-ga'

import styled, { ThemeContext } from 'styled-components'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonMateriaConfirmed, ButtonMateriaError } from '../../components/Button'
import Card from '../../components/Card'
import Column, { AutoColumn } from '../../components/Column'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AutoRow, RowBetween, RowCenter } from '../../components/Row'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'

import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import { BottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import TradePrice from '../../components/swap/TradePrice'
import TokenWarningModal from '../../components/TokenWarningModal'
import ProgressSteps from '../../components/ProgressSteps'

import { ERC20WRAPPER, INITIAL_ALLOWED_SLIPPAGE } from '../../constants'

import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTrade, useTokenApproveCallback } from '../../hooks/useApproveCallback'
import useENSAddress from '../../hooks/useENSAddress'
import { useSwapCallback } from '../../hooks/useSwapCallback'

import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { useToggleSettingsMenu, useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState
} from '../../state/swap/hooks'
import { useExpertModeManager, useUserSlippageTolerance } from '../../state/user/hooks'
import AppBody from '../AppBody'
import {
  PageGridContainer,
  PageItemsContainer,
  TabsBar,
  TabLinkItem,
  PageContentContainer,
  TradePriceContainer,
  SwitchButton,
  OperationButton,
  MainOperationButton,
  AddRecipientPanel,
  DynamicGrid,
  SwapButtonsContainer,
  IconButton,
  ActionButton
} from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { computeTradePriceBreakdown, warningSeverity } from '../../utils/prices'
import { ClickableText } from '../Pool/styleds'
import Loader from '../../components/Loader'
import Inventory from '../../components/Inventory'
import FFCursor from '../../assets/images/FF7Cursor.png'
import useSound from 'use-sound'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import ClassicSwapIcon from '../../assets/images/classic-swap-icon.png'
import BatchSwapIcon from '../../assets/images/batch-swap-icon.png'

export const ButtonBgItem = styled.img`
  height: 3ch;
  margin: 0px 5px;
`

const TradeCard = styled(Card)`
  display: flex;
  justify-content: center;
  text-align: center;
`
export const Center = styled.div`
  display: flex;
  margin: 0 auto;
  justify-content: center;
  padding-top: 5px;
  padding-bottom: 5px;
`

export default function Swap() {
  const loadedUrlParams = useDefaultsFromURLSearch()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId)
  ]
  // const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const [, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const toggleSettings = useToggleSettingsMenu()
  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const {
    v2Trade,
    // currencyBalances,
    originalCurrencyBalances,
    parsedAmount,
    currencies,
    originalCurrencies,
    inputError: swapInputError
  } = useDerivedSwapInfo(true)

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    originalCurrencies[Field.INPUT],
    originalCurrencies[Field.OUTPUT],
    typedValue
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount
      }

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  const route = trade?.route
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  const noRoute = !route

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(
    trade,
    wrappedCurrency(originalCurrencies[Field.INPUT], chainId) ?? undefined,
    allowedSlippage
  )

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  // check whether the user has approved the erc20wrapper on the input token
  const isWrapValid = !wrapInputError
  const [wrapApproval, wrapApproveCallback] = useTokenApproveCallback(
    parsedAmount,
    wrappedCurrency(originalCurrencies[Field.INPUT], chainId) ?? undefined,
    ERC20WRAPPER[chainId ?? 1]
  )

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [wrapApprovalSubmitted, setWrapApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (wrapApproval === ApprovalState.PENDING) {
      setWrapApprovalSubmitted(true)
    }
  }, [wrapApproval, wrapApprovalSubmitted])

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(originalCurrencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    recipient,
    wrappedCurrency(originalCurrencies[Field.INPUT], chainId),
    wrappedCurrency(originalCurrencies[Field.OUTPUT], chainId),
    originalCurrencies[Field.INPUT] == ETHER,
    originalCurrencies[Field.OUTPUT] == ETHER
  )

  const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade)

  const handleSwap = useCallback(() => {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return
    }
    if (!swapCallback) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then(hash => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })

        ReactGA.event({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap w/o Send'
              : (recipientAddress ?? recipient) === account
              ? 'Swap w/o Send + recipient'
              : 'Swap w/ Send',
          label: [originalCurrencies[Field.INPUT]?.symbol, originalCurrencies[Field.OUTPUT]?.symbol, v2Trade].join('/')
        })
      })
      .catch(error => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined
        })
      })
  }, [
    tradeToConfirm,
    account,
    priceImpactWithoutFee,
    recipient,
    recipientAddress,
    showConfirm,
    swapCallback,
    originalCurrencies,
    v2Trade
  ])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    inputCurrency => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(outputCurrency => onCurrencySelection(Field.OUTPUT, outputCurrency), [
    onCurrencySelection
  ])

  const [isShown, setIsShown] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const alarm = require('../../assets/audio/FF7CursorMove.mp3')
  const [play, { stop }] = useSound(alarm)
  const classicMode = useIsClassicMode()

  return (
    <>
      {/* <TokenWarningModal
        isOpen={urlLoadedTokens.length > 0 && !dismissTokenWarning}
        tokens={urlLoadedTokens}
        onConfirm={handleConfirmTokenWarning}
      /> */}
      <TokenWarningModal isOpen={false} tokens={urlLoadedTokens} onConfirm={handleConfirmTokenWarning} />
      <AppBody>
        <Wrapper id="swap-page">
          <ConfirmSwapModal
            isOpen={showConfirm}
            trade={trade}
            originalTrade={tradeToConfirm}
            originalCurrencies={originalCurrencies}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            allowedSlippage={allowedSlippage}
            onConfirm={handleSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
          />
          <PageGridContainer className="swap">
            <div className={`left-column swap ${theme.name}`}>
              <div className="collapsable-title">
                <div className="pull-right">
                  <ActionButton
                    className={theme.name}
                    onClick={() => {
                      setShowMore(!showMore)
                    }}
                  >
                    {showMore ? 'Hide Inventory' : 'View Inventory'}
                  </ActionButton>
                </div>
                <div className="clear-fix"></div>
              </div>
              <div className={`collapsable-item ${showMore ? 'opened' : 'collapsed'}`}>
                <Inventory onCurrencySelect={handleOutputSelect} />
              </div>
            </div>
            <PageItemsContainer className={theme.name}>
              <TabsBar className={theme.name}>
                <TabLinkItem
                  id={`batch-swap`}
                  to={'/batch-swap'}
                  className={`tabLinkItem ${theme.name}`}
                  isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/batch-swap')}
                >
                  <span>Batch</span> {/* <BatchSwapIcon/> */}{' '}
                </TabLinkItem>
                <TabLinkItem
                  id={`classic-swap`}
                  to={'/swap'}
                  className={`tabLinkItem ${theme.name}`}
                  isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/swap')}
                >
                  <span>Classic</span> {/* <ClassicSwapIcon/> */}{' '}
                </TabLinkItem>
              </TabsBar>
              <div className="clear-fix">
                <PageContentContainer className={theme.name}>
                  <div>
                    <AutoColumn gap={'lg'}>
                      <CurrencyInputPanel
                        label={independentField === Field.OUTPUT && !showWrap && trade ? 'From (estimated)' : 'From'}
                        value={formattedAmounts[Field.INPUT]}
                        showMaxButton={!atMaxAmountInput}
                        currency={originalCurrencies[Field.INPUT]}
                        onUserInput={handleTypeInput}
                        onMax={handleMaxInput}
                        onCurrencySelect={handleInputSelect}
                        otherCurrency={originalCurrencies[Field.OUTPUT]}
                        id="swap-currency-input"
                      />
                    </AutoColumn>
                  </div>
                  <TradePriceContainer>
                    <AutoColumn justify="space-between">
                      <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '1rem' }}>
                        <SwitchButton
                          className={` ${isExpertMode ? 'expert-mode' : ''} ${theme.name} ${
                            originalCurrencies[Field.INPUT] && originalCurrencies[Field.OUTPUT] ? '' : 'disabled'
                          }`}
                          onClick={() => {
                            setApprovalSubmitted(false) // reset 2 step UI for approvals
                            onSwitchTokens()
                          }}
                        >
                          <RefreshCw />
                          <label>Switch</label>
                        </SwitchButton>
                      </AutoRow>
                    </AutoColumn>
                    {showWrap ? null : (
                      <TradeCard padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
                        <AutoColumn gap="4px">
                          {Boolean(trade) && (
                            <RowBetween align="center">
                              <TradePrice
                                price={trade?.executionPrice}
                                originalCurrencies={originalCurrencies}
                                showInverted={showInverted}
                                setShowInverted={setShowInverted}
                              />
                            </RowBetween>
                          )}
                          {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                            <RowBetween align="center">
                              <ClickableText className={theme.name} onClick={toggleSettings}>
                                Slippage Tolerance {allowedSlippage / 100}%
                              </ClickableText>
                              {/* <ClickableText className={theme.name} onClick={toggleSettings}>
                                {allowedSlippage / 100}%
                              </ClickableText> */}
                            </RowBetween>
                          )}
                        </AutoColumn>
                      </TradeCard>
                    )}
                  </TradePriceContainer>
                  <div>
                    <AutoColumn gap={'lg'}>
                      <CurrencyInputPanel
                        value={formattedAmounts[Field.OUTPUT]}
                        onUserInput={handleTypeOutput}
                        label={independentField === Field.INPUT && !showWrap && trade ? 'To (estimated)' : 'To'}
                        showMaxButton={false}
                        currency={originalCurrencies[Field.OUTPUT]}
                        onCurrencySelect={handleOutputSelect}
                        otherCurrency={originalCurrencies[Field.INPUT]}
                        id="swap-currency-output"
                      />
                    </AutoColumn>
                  </div>
                </PageContentContainer>
                {isExpertMode && (
                  <DynamicGrid className={`mt20 mb20 ${theme.name}`} columns={1}>
                    <div className="custom-recipient-data-container">
                      {recipient === null && !showWrap && isExpertMode ? (
                        <OperationButton
                          id="add-recipient-button"
                          onClick={() => onChangeRecipient('')}
                          className={`add-a-send-button ${theme.name}`}
                          label="Add a send (optional)"
                        >
                          <Plus />
                        </OperationButton>
                      ) : null}
                      {recipient !== null && !showWrap ? (
                        <AddRecipientPanel>
                          <OperationButton
                            id="remove-recipient-button"
                            onClick={() => onChangeRecipient(null)}
                            className={`remove-send-button ${theme.name}`}
                            label="Remove send"
                          >
                            <Minus />
                          </OperationButton>
                          <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                        </AddRecipientPanel>
                      ) : null}
                    </div>
                  </DynamicGrid>
                )}
                <BottomGrouping>
                  <SwapButtonsContainer className={isExpertMode && swapErrorMessage ? 'has-error' : ''}>
                    {!account ? (
                      <OperationButton
                        onClick={toggleWalletModal}
                        className={`connect-wallet-button ${theme.name}`}
                        label="Connect Wallet"
                      >
                        <Link />
                      </OperationButton>
                    ) : showWrap ? (
                      <RowCenter>
                        <ButtonMateriaConfirmed
                          onClick={wrapApproveCallback}
                          disabled={
                            wrapApproval !== ApprovalState.NOT_APPROVED || wrapApprovalSubmitted || !isWrapValid
                          }
                          hide={wrapApproval !== ApprovalState.NOT_APPROVED && wrapApproval !== ApprovalState.PENDING}
                          altDisabledStyle={wrapApproval === ApprovalState.PENDING} // show solid button while waiting
                          confirmed={wrapApproval === ApprovalState.APPROVED}
                        >
                          {!isWrapValid ? (
                            wrapInputError ?? ''
                          ) : wrapApproval === ApprovalState.PENDING ? (
                            <AutoRow gap="6px" justify="center">
                              Approving to ERC20 Wrapper <Loader stroke="white" />
                            </AutoRow>
                          ) : wrapApprovalSubmitted && wrapApproval === ApprovalState.APPROVED ? (
                            'Approved'
                          ) : (
                            'Approve ' + originalCurrencies[Field.INPUT]?.symbol + ' to ERC20 Wrapper'
                          )}
                        </ButtonMateriaConfirmed>
                        {wrapApproval === ApprovalState.APPROVED ? (
                          <MainOperationButton
                            onClick={onWrap}
                            className={`wrap-button ${theme.name}`}
                            disabled={!isWrapValid}
                          >
                            {wrapInputError ??
                              (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
                          </MainOperationButton>
                        ) : (
                          <MainOperationButton
                            className={`wrap-button ${theme.name}`}
                            hide={
                              wrapApproval === ApprovalState.NOT_APPROVED ||
                              wrapApproval === ApprovalState.PENDING ||
                              isWrapValid
                            }
                            disabled={!isWrapValid}
                          >
                            {wrapInputError ?? ''}
                          </MainOperationButton>
                        )}
                      </RowCenter>
                    ) : noRoute && userHasSpecifiedInputOutput ? (
                      <MainOperationButton className={theme.name} disabled={true}>
                        Insufficient liquidity for this trade
                      </MainOperationButton>
                    ) : showApproveFlow ? (
                      <RowCenter>
                        <ButtonMateriaConfirmed
                          onClick={approveCallback}
                          disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                          hide={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                          altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                          confirmed={approval === ApprovalState.APPROVED}
                        >
                          {approval === ApprovalState.PENDING ? (
                            <AutoRow gap="6px" justify="center">
                              Approving <Loader stroke="white" />
                            </AutoRow>
                          ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                            'Approved'
                          ) : (
                            'Approve ' + originalCurrencies[Field.INPUT]?.symbol
                          )}
                        </ButtonMateriaConfirmed>
                        <ButtonMateriaError
                          onClick={() => {
                            if (isExpertMode) {
                              handleSwap()
                            } else {
                              setSwapState({
                                tradeToConfirm: trade,
                                attemptingTxn: false,
                                swapErrorMessage: undefined,
                                showConfirm: true,
                                txHash: undefined
                              })
                            }
                          }}
                          id="swap-button"
                          disabled={
                            !isValid ||
                            approval !== ApprovalState.APPROVED ||
                            (priceImpactSeverity > 3 && !isExpertMode)
                          }
                          hide={
                            !isValid ||
                            approval !== ApprovalState.APPROVED ||
                            (priceImpactSeverity > 3 && !isExpertMode)
                          }
                          error={isValid && priceImpactSeverity > 2}
                          showSwap={
                            !(
                              !isValid ||
                              approval !== ApprovalState.APPROVED ||
                              (priceImpactSeverity > 3 && !isExpertMode)
                            )
                          }
                          useCustomProperties={priceImpactSeverity > 3 ? true : false}
                          isExpertModeActive={isExpertMode}
                          onMouseEnter={() => {
                            setIsShown(true)
                            if (classicMode) {
                              play()
                            }
                          }}
                          onMouseLeave={() => {
                            setIsShown(false)
                            if (classicMode) {
                              stop()
                            }
                          }}
                        >
                          {priceImpactSeverity > 3 && !isExpertMode
                            ? `Price Impact High`
                            : `Swap ${priceImpactSeverity > 2 ? 'Anyway' : ''}`}
                        </ButtonMateriaError>
                      </RowCenter>
                    ) : (
                      <>
                        {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                        <ButtonMateriaError
                          onClick={() => {
                            if (isExpertMode) {
                              handleSwap()
                            } else {
                              setSwapState({
                                tradeToConfirm: trade,
                                attemptingTxn: false,
                                swapErrorMessage: undefined,
                                showConfirm: true,
                                txHash: undefined
                              })
                            }
                          }}
                          id="swap-button"
                          disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError}
                          error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
                          showSwap={!(!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError)}
                          useCustomProperties={priceImpactSeverity > 3 ? true : false}
                          isExpertModeActive={isExpertMode}
                          onMouseEnter={() => {
                            setIsShown(true)
                            if (classicMode) {
                              play()
                            }
                          }}
                          onMouseLeave={() => {
                            setIsShown(false)
                            if (classicMode) {
                              stop()
                            }
                          }}
                        >
                          {swapInputError
                            ? swapInputError
                            : priceImpactSeverity > 3 && !isExpertMode
                            ? `Price Impact Too High`
                            : `Swap ${priceImpactSeverity > 2 ? 'Anyway' : ''}`}
                        </ButtonMateriaError>
                      </>
                    )}
                  </SwapButtonsContainer>
                </BottomGrouping>
              </div>
              <div className={`advanced-swap-details-container ${theme.name}`}>
                <AdvancedSwapDetailsDropdown trade={trade} originalCurrencies={originalCurrencies} />
              </div>
            </PageItemsContainer>
          </PageGridContainer>
        </Wrapper>
      </AppBody>
    </>
  )
}
