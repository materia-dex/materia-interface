import { ChainId, CurrencyAmount, ETHER, JSBI, TokenAmount, Trade } from '@materia-dex/sdk'
import React, { useCallback, useContext, useEffect, useState, useMemo } from 'react'
import ReactGA from 'react-ga'
import styled, { ThemeContext } from 'styled-components'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'
import { BatchSwapBottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import { Field } from '../../state/batchswap/actions'
import {
  useDerivedBatchSwapInfo,
  useBatchSwapActionHandlers,
  useBatchSwapState,
  useOutputsParametersInfo,
  useBatchSwapDefaults,
  useValidateBatchSwapParameters
} from '../../state/batchswap/hooks'
import AppBody from '../AppBody'
import {
  PageGridContainer,
  PageItemsContainer,
  TabsBar,
  TabLinkItem,
  PageContentContainer,
  ActionButton,
  SmallOperationButton,
  BatchSwapButtonsContainer,
  OperationButton,
  InternalLinkItem,
  InternalLinkBadge
} from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import Inventory from '../../components/Inventory'
import { Link, Plus } from 'react-feather'
import { Minus } from 'react-feather'
import BatchSwapOutput from '../../components/BatchSwapOutput'
import typedKeys from '../../utils/typesKeys'
import { ApprovalState, useApproveCallbackFromBatchSwapTrade } from '../../hooks/useApproveCallback'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { useExpertModeManager, useIsClassicMode, useUserSlippageTolerance } from '../../state/user/hooks'
import { AutoRow, RowCenter } from '../../components/Row'
import { ButtonMateriaConfirmed, ButtonMateriaError } from '../../components/Button'
import Loader from '../../components/Loader'
import { useActiveWeb3React } from '../../hooks'
import useSound from 'use-sound'
import { useWalletModalToggle } from '../../state/application/hooks'
import {
  GIL,
  IGIL,
  MATERIA_BATCH_SWAPPER_ADDRESS,
  MAX_BATCH_SWAP_OUTPUTS,
  MAX_BATCH_SWAP_OUTPUTS_FREE,
  MIN_BATCH_SWAP_OUTPUTS,
  MIN_GIL_UNLOCK_FULL_BATCHSWAP,
  MIN_IGIL_UNLOCK_FULL_BATCHSWAP,
  ZERO_ADDRESS
} from '../../constants'
import useCheckIsEthItem from '../../hooks/useCheckIsEthItem'
import { useEthItemContract } from '../../hooks/useContract'
import { Contract } from 'ethers'
import { splitSignature } from 'ethers/lib/utils'
import { TokenInParameter, useBatchSwapCallback } from '../../hooks/useBatchSwapCallback'
import ConfirmBatchSwapModal from '../../components/batchswap/ConfirmBatchSwapModal'
import { useTokenBalance } from '../../state/wallet/hooks'
import UnlockFullBatchSwapModal from '../../components/batchswap/UnlockFullBatchSwapModal'

export const ButtonBgItem = styled.img`
  height: 3ch;
  margin: 0px 5px;
`

export const Center = styled.div`
  display: flex;
  margin: 0 auto;
  justify-content: center;
  padding-top: 5px;
  padding-bottom: 5px;
`

export const AddOutputButton = styled(SmallOperationButton)`
  margin: 0 1.5rem 0 1.5rem !important;
`

export const RemoveOutputButton = styled(SmallOperationButton)`
  margin: 0 1.5rem 0 1.5rem !important;
`

export const OutputButtonContainer = styled.div`
  margin: auto;

  &.classic {
    margin: inherit !important;
  }
`

export const BatchSwapDetails = styled(AdvancedSwapDetailsDropdown)`
  display: contents !important;
`

export const SwitchDexContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;

  ${({ theme }) => theme.mediaWidth.upToMedium` padding-top: 2.5rem; justify-content: center;`}
`

export default function BatchSwap() {
  const theme = useContext(ThemeContext)
  const { account, chainId, library } = useActiveWeb3React()

  useBatchSwapDefaults()

  const { [Field.INPUT]: typedField } = useBatchSwapState()
  const typedValue = typedField.typedValue
  const {
    currencies,
    originalCurrencyBalances,
    parsedAmount,
    originalCurrencies,
    v2Trade: trade
  } = useDerivedBatchSwapInfo(Field.OUTPUT_1, true)

  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string } | null>(null)

  const parsedAmounts = useMemo(() => {
    return {
      [Field.INPUT]: parsedAmount
    }
  }, [parsedAmount])

  const formattedAmounts = {
    [Field.INPUT]: typedValue
  }

  const inputHasTrade = !!trade

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(originalCurrencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))
  const atGreaterAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.greaterThan(maxAmountInput))

  const { onCurrencySelection, onCurrencyRemoval, onUserInput, onBatchSwapOutputsReset } = useBatchSwapActionHandlers()

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  const handleInputSelect = useCallback(
    inputCurrency => {
      setSignatureData(null)
      onCurrencySelection(Field.INPUT, Field.OUTPUT_1, inputCurrency)
    },
    [onCurrencySelection, setSignatureData]
  )

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  const [currentOutputs, setCurrentOutputs] = useState([Field.OUTPUT_1])

  const handleAddOutputToken = useCallback(() => {
    if (currentOutputs.length < MAX_BATCH_SWAP_OUTPUTS) {
      const key = `OUTPUT_${currentOutputs.length + 1}`
      const field = typedKeys(Field).find(x => x === key)

      if (field) {
        setCurrentOutputs([...currentOutputs, Field[field]])
      }
    }
  }, [currentOutputs, setCurrentOutputs])

  const handleRemoveOutputToken = useCallback(() => {
    if (currentOutputs.length > MIN_BATCH_SWAP_OUTPUTS) {
      const outputs = [...currentOutputs]
      const removed = outputs.pop()

      setCurrentOutputs(outputs)

      if (removed) {
        onCurrencyRemoval(removed)
      }
    }
  }, [currentOutputs, setCurrentOutputs, onCurrencyRemoval])

  const [showMore, setShowMore] = useState(false)

  const [addOutputTokenDisabled, setAddOutputTokenDisabled] = useState(false)
  const [removeOutputTokenDisabled, setRemoveOutputTokenDisabled] = useState(false)

  const gilBalance = useTokenBalance(account ?? undefined, GIL[chainId ?? ChainId.MAINNET])
  const minGilUnlockAmount = useMemo(() => {
    return new TokenAmount(GIL[chainId ?? ChainId.MAINNET], MIN_GIL_UNLOCK_FULL_BATCHSWAP)
  }, [chainId])
  const accountHaveGilBalance = gilBalance ? !gilBalance?.lessThan(minGilUnlockAmount) : false

  const igilBalance = useTokenBalance(account ?? undefined, IGIL[chainId ?? ChainId.MAINNET])
  const minIGilUnlockAmount = useMemo(() => {
    return new TokenAmount(GIL[chainId ?? ChainId.MAINNET], MIN_IGIL_UNLOCK_FULL_BATCHSWAP)
  }, [chainId])
  const accountHaveIGilBalance = igilBalance ? !igilBalance?.lessThan(minIGilUnlockAmount) : false

  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const handleUnlockModalDismiss = useCallback(() => {
    setShowUnlockModal(!showUnlockModal)
  }, [showUnlockModal, setShowUnlockModal])

  useEffect(() => {
    const outputs = currentOutputs.length
    const removeDisabled = outputs <= MIN_BATCH_SWAP_OUTPUTS
    const addDisabled = (accountHaveGilBalance || accountHaveIGilBalance) && outputs >= MAX_BATCH_SWAP_OUTPUTS
    const showUnlockModal =
      !accountHaveGilBalance && !accountHaveIGilBalance && outputs >= MAX_BATCH_SWAP_OUTPUTS_FREE + 1

    if (showUnlockModal) {
      setShowUnlockModal(true)
      handleRemoveOutputToken()
    } else {
      setRemoveOutputTokenDisabled(removeDisabled)
      setAddOutputTokenDisabled(addDisabled)
    }
  }, [
    gilBalance,
    currentOutputs,
    setAddOutputTokenDisabled,
    setRemoveOutputTokenDisabled,
    accountHaveGilBalance,
    minGilUnlockAmount,
    setShowUnlockModal
  ])

  const [allowedSlippage] = useUserSlippageTolerance()

  const [approval, approveCallback] = useApproveCallbackFromBatchSwapTrade(
    trade,
    wrappedCurrency(originalCurrencies[Field.INPUT], chainId) ?? undefined,
    allowedSlippage
  )

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const tokenInput = useMemo(() => wrappedCurrency(originalCurrencies[Field.INPUT], chainId), [
    originalCurrencies,
    chainId
  ])

  const isEthItemInput = useCheckIsEthItem(tokenInput?.address ?? ZERO_ADDRESS)?.ethItem ?? false
  const ethItemContract: Contract | null = useEthItemContract(isEthItemInput ? tokenInput?.address : undefined)

  async function onAttemptToApprove() {
    if (!isEthItemInput) {
      return approveCallback()
    }

    if (!ethItemContract || !tokenInput || !library || !chainId) throw new Error('missing dependencies')

    const inputAmount = parsedAmounts[Field.INPUT]

    if (!inputAmount) throw new Error('missing input amount')

    // try to gather a signature for permission
    const nonce = await ethItemContract.permitNonce(account)

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ]
    const domain = {
      name: 'Item',
      version: '1',
      chainId: chainId,
      verifyingContract: tokenInput.address
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' }
    ]
    const message = {
      owner: account,
      spender: MATERIA_BATCH_SWAPPER_ADDRESS[chainId],
      value: inputAmount.raw.toString(),
      nonce: nonce.toHexString()
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit
      },
      domain,
      primaryType: 'Permit',
      message
    })

    library
      .send('eth_signTypedData_v4', [account, data])
      .then(splitSignature)
      .then(signature => {
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s
        })
      })
      .catch(error => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (error?.code !== 4001) {
          approveCallback()
        }
      })
  }

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const [{ showConfirm, batchSwapErrorMessage, attemptingTxn, txHash }, setBatchSwapState] = useState<{
    showConfirm: boolean
    attemptingTxn: boolean
    batchSwapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    attemptingTxn: false,
    batchSwapErrorMessage: undefined,
    txHash: undefined
  })

  const inputParameters: TokenInParameter = useMemo(() => {
    const parameters: TokenInParameter = {
      currency: originalCurrencies[Field.INPUT],
      token: tokenInput,
      amount: parsedAmounts[Field.INPUT],
      permit: signatureData
    }

    return parameters
  }, [originalCurrencies, tokenInput, parsedAmounts, signatureData])

  const { outputsInfo: outputsParameters } = useOutputsParametersInfo(currentOutputs)

  const { callback: batchSwapCallback, error: batchSwapCallbackError } = useBatchSwapCallback(
    inputParameters,
    outputsParameters
  )

  const handleBatchSwap = useCallback(() => {
    if (!batchSwapCallback) {
      return
    }
    setBatchSwapState({
      attemptingTxn: true,
      showConfirm,
      batchSwapErrorMessage: undefined,
      txHash: undefined
    })
    batchSwapCallback()
      .then(hash => {
        setBatchSwapState({
          attemptingTxn: false,
          showConfirm,
          batchSwapErrorMessage: undefined,
          txHash: hash
        })

        ReactGA.event({
          category: 'BatchSwap',
          action: 'BatchSwap w/o Send',
          label: [
            inputParameters.currency == ETHER ? 'ETH' : inputParameters?.token?.symbol,
            outputsParameters
              ?.map(x => `${x.currency == ETHER ? 'ETH' : x.token?.symbol} (${x.percentage}%)`)
              ?.join(', ')
          ].join('/')
        })
      })
      .catch(error => {
        setBatchSwapState({
          attemptingTxn: false,
          showConfirm,
          batchSwapErrorMessage: error.message,
          txHash: undefined
        })
      })
  }, [inputParameters, outputsParameters, showConfirm, batchSwapCallback])

  const [isExpertMode] = useExpertModeManager()
  const [isShown, setIsShown] = useState(false)

  const alarm = require('../../assets/audio/FF7CursorMove.mp3')
  const [play, { stop }] = useSound(alarm)
  const classicMode = useIsClassicMode()

  const { message: batchSwapValidationErrorMessage } = useValidateBatchSwapParameters(
    currentOutputs,
    atGreaterAmountInput,
    inputHasTrade
  )

  const isValid = !batchSwapValidationErrorMessage

  const toggleWalletModal = useWalletModalToggle()

  const showApproveFlow =
    !batchSwapValidationErrorMessage &&
    originalCurrencies[Field.INPUT] !== ETHER &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const handleConfirmDismiss = useCallback(() => {
    setBatchSwapState({ showConfirm: false, attemptingTxn, batchSwapErrorMessage, txHash })
    if (txHash) {
      onUserInput(Field.INPUT, '')
      onBatchSwapOutputsReset()
      setSignatureData(null)
      setCurrentOutputs([Field.OUTPUT_1])
    }
  }, [attemptingTxn, batchSwapErrorMessage, txHash, onUserInput, onBatchSwapOutputsReset])

  return (
    <>
      <AppBody>
        <Wrapper id="batch-swap-page">
          <ConfirmBatchSwapModal
            input={inputParameters}
            outputs={outputsParameters}
            isOpen={showConfirm}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            onConfirm={handleBatchSwap}
            batchSwapErrorMessage={batchSwapErrorMessage}
            onDismiss={handleConfirmDismiss}
          />
          <UnlockFullBatchSwapModal isOpen={showUnlockModal} onDismiss={handleUnlockModalDismiss} />
          <PageGridContainer className="batch-swap">
            <div className={`left-column batch-swap ${theme.name}`}>
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
                <Inventory onCurrencySelect={handleInputSelect} />
              </div>
            </div>
            <PageItemsContainer className={theme.name}>
              <TabsBar className={theme.name}>
                <TabLinkItem
                  id={`batch-swap`}
                  to={'/batch-swap'}
                  className={`tabLinkItem ${theme.name}`}
                  isActive={(match, { pathname }) =>
                    Boolean(match) ||
                    pathname.startsWith('/batch-swap') ||
                    pathname.startsWith('/uni-batch-swap') ||
                    pathname.startsWith('/sushi-batch-swap')
                  }
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
                <PageContentContainer className={`two ${theme.name}`}>
                  <div>
                    <AutoColumn gap={'lg'}>
                      <CurrencyInputPanel
                        label={'From'}
                        value={formattedAmounts[Field.INPUT]}
                        showMaxButton={!atMaxAmountInput}
                        currency={originalCurrencies[Field.INPUT]}
                        onUserInput={handleTypeInput}
                        onMax={handleMaxInput}
                        onCurrencySelect={handleInputSelect}
                        otherCurrency={originalCurrencies[Field.OUTPUT]}
                        smallTokenImage={false}
                        percentage={false}
                        id="batch-swap-currency-input"
                      />
                    </AutoColumn>
                  </div>
                  <div>
                    <AutoColumn gap={'lg'}>
                      {currentOutputs.map((output, index) => (
                        <BatchSwapOutput key={index} outputField={output} />
                      ))}
                      <OutputButtonContainer>
                        <AddOutputButton
                          id="add-output-token-batch-swap"
                          onClick={() => handleAddOutputToken()}
                          className={`add-output-token-batch-swap ${theme.name}`}
                          label="Add a token"
                          disabled={addOutputTokenDisabled}
                        >
                          <Plus />
                        </AddOutputButton>
                        <RemoveOutputButton
                          id="remove-output-token-batch-swap"
                          onClick={() => handleRemoveOutputToken()}
                          className={`remove-output-token-batch-swap ${theme.name}`}
                          label="Remove a token"
                          disabled={removeOutputTokenDisabled}
                        >
                          <Minus />
                        </RemoveOutputButton>
                      </OutputButtonContainer>
                    </AutoColumn>
                  </div>
                </PageContentContainer>
                <BatchSwapBottomGrouping>
                  <BatchSwapButtonsContainer className={isExpertMode && batchSwapErrorMessage ? 'has-error' : ''}>
                    {!account ? (
                      <OperationButton
                        onClick={toggleWalletModal}
                        className={`connect-wallet-button ${theme.name}`}
                        label="Connect Wallet"
                      >
                        <Link />
                      </OperationButton>
                    ) : showApproveFlow && signatureData === null ? (
                      <RowCenter>
                        <ButtonMateriaConfirmed
                          onClick={onAttemptToApprove}
                          disabled={
                            approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || signatureData !== null
                          }
                          hide={approval !== ApprovalState.NOT_APPROVED}
                          altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                          confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                        >
                          {approval === ApprovalState.PENDING ? (
                            <AutoRow gap="6px" justify="center">
                              Approving <Loader stroke="white" />
                            </AutoRow>
                          ) : (approvalSubmitted && approval === ApprovalState.APPROVED) ||
                            approval === ApprovalState.APPROVED ||
                            signatureData !== null ? (
                            'Approved'
                          ) : (
                            'Approve ' + originalCurrencies[Field.INPUT]?.symbol
                          )}
                        </ButtonMateriaConfirmed>
                        <ButtonMateriaError
                          onClick={() => {
                            if (isExpertMode) {
                              handleBatchSwap()
                            } else {
                              setBatchSwapState({
                                attemptingTxn: false,
                                batchSwapErrorMessage: undefined,
                                showConfirm: true,
                                txHash: undefined
                              })
                            }
                          }}
                          id="batch-swap-button"
                          disabled={!isValid || approval !== ApprovalState.APPROVED}
                          hide={!isValid || approval !== ApprovalState.APPROVED}
                          error={isValid}
                          showSwap={!(!isValid || approval !== ApprovalState.APPROVED)}
                          useCustomProperties={false}
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
                          {`Batch Swap`}
                        </ButtonMateriaError>
                      </RowCenter>
                    ) : (
                      <>
                        {isExpertMode && batchSwapErrorMessage ? (
                          <SwapCallbackError error={batchSwapErrorMessage} />
                        ) : null}
                        <ButtonMateriaError
                          onClick={() => {
                            if (isExpertMode) {
                              handleBatchSwap()
                            } else {
                              setBatchSwapState({
                                attemptingTxn: false,
                                batchSwapErrorMessage: undefined,
                                showConfirm: true,
                                txHash: undefined
                              })
                            }
                          }}
                          id="batch-swap-button"
                          disabled={!isValid || !!batchSwapCallbackError}
                          error={isValid && !batchSwapCallbackError}
                          showSwap={!(!isValid || !!batchSwapCallbackError)}
                          useCustomProperties={false}
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
                          {batchSwapValidationErrorMessage ? batchSwapValidationErrorMessage : `Batch Swap`}
                        </ButtonMateriaError>
                      </>
                    )}
                  </BatchSwapButtonsContainer>
                </BatchSwapBottomGrouping>
              </div>
            </PageItemsContainer>
            <div></div>
            <SwitchDexContainer>
              <InternalLinkBadge
                id={`batch-swap-dex-materia`}
                to={'/batch-swap'}
                className={theme.name}
                isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/batch-swap')}
              >
                Materia
              </InternalLinkBadge>
              <InternalLinkBadge
                id={`batch-swap-dex-uniswap`}
                to={'/uni-batch-swap'}
                className={theme.name}
                isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/uni-batch-swap')}
              >
                Uniswap V2
              </InternalLinkBadge>
              <InternalLinkBadge
                id={`batch-swap-dex-sushi`}
                to={'/sushi-batch-swap'}
                className={theme.name}
                isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/sushi-batch-swap')}
              >
                Sushiswap
              </InternalLinkBadge>
            </SwitchDexContainer>
          </PageGridContainer>
        </Wrapper>
      </AppBody>
    </>
  )
}
