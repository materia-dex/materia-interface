import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, ETHER, Percent, IETH } from '@materia-dex/sdk'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { ArrowDown, Plus, ChevronUp, ChevronDown, Link } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonMateriaError, ButtonMateriaPrimary, ButtonMateriaConfirmed } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import { RowBetween, RowFixed } from '../../components/Row'

import Slider from '../../components/Slider'
import CurrencyLogo from '../../components/CurrencyLogo'
import { ORCHESTRATOR_ADDRESS, WUSD } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { usePairContract } from '../../hooks/useContract'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'

import { useTransactionAdder } from '../../state/transactions/hooks'
import {
  StyledInternalLink,
  TYPE,
  PageGridContainer,
  SecondaryPanelBoxContainer,
  SimpleTextParagraph,
  PageItemsContainer,
  PageContentContainer,
  RemoveLiquiditySliderItemContainer,
  DynamicGrid,
  ActionButton,
  MainOperationButton,
  RemoveLiquidityCustomText,
  OperationButton,
  SectionTitle,
  SectionContent
} from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, getOrchestratorContract } from '../../utils'
import { currencyId } from '../../utils/currencyId'
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import { ApprovalState, useMPApproveCallback } from '../../hooks/useApproveCallback'
import { Dots } from '../../components/swap/styleds'
import { useBurnActionHandlers } from '../../state/burn/hooks'
import { useDerivedBurnInfo, useBurnState } from '../../state/burn/hooks'
import { Field } from '../../state/burn/actions'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { BigNumber } from '@ethersproject/bignumber'

export default function RemoveLiquidity({
  history,
  match: {
    params: { currencyIdA, currencyIdB }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()
  const [tokenA, tokenB] = useMemo(() => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)], [
    currencyA,
    currencyB,
    chainId
  ])

  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { independentField, typedValue } = useBurnState()
  const { pair, parsedAmounts, error } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showDetailed, setShowDetailed] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
        ? '<1'
        : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? ''
  }

  const atMaxAmount = parsedAmounts[Field.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useMPApproveCallback(parsedAmounts[Field.LIQUIDITY], ORCHESTRATOR_ADDRESS)

  const isArgentWallet = useIsArgentWallet()

  async function onAttemptToApprove() {
    if (!pairContract || !pair || !library || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    if (isArgentWallet) {
      return approveCallback()
    }

    // try to gather a signature for permission
    const nonce = await pairContract.nonces(account)

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ]
    const domain = {
      name: 'Materia Pool',
      version: '1',
      chainId: chainId,
      verifyingContract: pair.liquidityToken.address
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
    const message = {
      owner: account,
      spender: ORCHESTRATOR_ADDRESS,
      value: liquidityAmount.raw.toString(),
      nonce: nonce.toHexString(),
      deadline: deadline.toNumber()
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
          s: signature.s,
          deadline: deadline.toNumber()
        })
      })
      .catch(error => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (error?.code !== 4001) {
          approveCallback()
        }
      })
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      setSignatureData(null)
      return _onUserInput(field, typedValue)
    },
    [_onUserInput]
  )

  const onLiquidityInput = useCallback((typedValue: string): void => onUserInput(Field.LIQUIDITY, typedValue), [
    onUserInput
  ])
  const onCurrencyAInput = useCallback((typedValue: string): void => onUserInput(Field.CURRENCY_A, typedValue), [
    onUserInput
  ])
  const onCurrencyBInput = useCallback((typedValue: string): void => onUserInput(Field.CURRENCY_B, typedValue), [
    onUserInput
  ])

  // tx sending
  const addTransaction = useTransactionAdder()
  async function onRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const orchestrator = getOrchestratorContract(chainId, library, account)

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0]
    }

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyWUSD = WUSD[chainId ?? 1]
    const currencyBIsWUSD = wrappedCurrency(currencyB, chainId)?.address === currencyWUSD.address

    const currencyBIsETH = currencyB === ETHER
    const oneCurrencyIsETH = currencyA === ETHER || currencyBIsETH

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[], args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH']
        args = [
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          deadline.toHexString()
        ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        args = [
          currencyBIsWUSD ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsWUSD ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsWUSD ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          deadline.toHexString()
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit']
        args = [
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s
        ]
      }
      // removeLiquidityWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']
        args = [
          currencyBIsWUSD ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsWUSD ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsWUSD ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map(methodName =>
        orchestrator.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch(error => {
            console.error(`estimateGas failed`, methodName, args, error)
            return undefined
          })
      )
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex(safeGasEstimate =>
      BigNumber.isBigNumber(safeGasEstimate)
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await orchestrator[methodName](...args, {
        gasLimit: safeGasEstimate
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Remove ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencyA?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencyB?.symbol
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Remove',
            label: [currencyA?.symbol, currencyB?.symbol].join('/')
          })
        })
        .catch((error: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(error)
        })
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={900}>
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyA} size={'24px'} />
            <Text fontSize={24} fontWeight={900} style={{ marginLeft: '10px' }}>
              {currencyA?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <Plus size="16" color={theme.text2} />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={900}>
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyB} size={'24px'} />
            <Text fontSize={24} fontWeight={900} style={{ marginLeft: '10px' }}>
              {currencyB?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>

        <TYPE.italic fontSize={12} color={theme.text2} textAlign="left" padding={'12px 0 0 0'}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text color={theme.text2} fontWeight={900} fontSize={16}>
            {'GIL ' + currencyA?.symbol + '/' + currencyB?.symbol} Burned
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} radius={true} />
            <Text fontWeight={900} fontSize={16}>
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
            </Text>
          </RowFixed>
        </RowBetween>
        {pair && (
          <>
            <RowBetween>
              <Text color={theme.text2} fontWeight={900} fontSize={16}>
                Price
              </Text>
              <Text fontWeight={900} fontSize={16} color={theme.text1}>
                1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
              </Text>
            </RowBetween>
            <RowBetween>
              <div />
              <Text fontWeight={900} fontSize={16} color={theme.text1}>
                1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
              </Text>
            </RowBetween>
          </>
        )}
        <ButtonMateriaPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove} className={theme.name}>
          <Text fontWeight={900} fontSize={20}>
            Confirm
          </Text>
        </ButtonMateriaPrimary>
      </>
    )
  }

  const pendingText = `Removing ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${currencyA?.symbol
    } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencyB?.symbol}`

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput]
  )

  const oneCurrencyIsETH = currencyA === ETHER || currencyB === ETHER
  const oneCurrencyIsIETH = Boolean(
    chainId &&
    ((currencyA && currencyEquals(IETH[chainId], currencyA)) ||
      (currencyB && currencyEquals(IETH[chainId], currencyB)))
  )

  const handleSelectCurrencyA = useCallback(
    (currency: Currency) => {
      if (currencyIdB && currencyId(currency) === currencyIdB) {
        history.push(`/remove/${currencyId(currency)}/${currencyIdA}`)
      } else {
        history.push(`/remove/${currencyId(currency)}/${currencyIdB}`)
      }
    },
    [currencyIdA, currencyIdB, history]
  )
  const handleSelectCurrencyB = useCallback(
    (currency: Currency) => {
      if (currencyIdA && currencyId(currency) === currencyIdA) {
        history.push(`/remove/${currencyIdB}/${currencyId(currency)}`)
      } else {
        history.push(`/remove/${currencyIdA}/${currencyId(currency)}`)
      }
    },
    [currencyIdA, currencyIdB, history]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback
  )
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      <AppBody>
        <PageGridContainer className="pool">
          <div className={`left-column pool ${theme.name}`}>
            <div className="collapsable-title">
              <div className="pull-right">
                <ActionButton className={theme.name} onClick={() => { setShowMore(!showMore) }}>
                  {showMore ? ('Hide Pools') : ('View Pools')}
                </ActionButton>
              </div>
              <div className="clear-fix"></div>
            </div>
            <div className={`collapsable-item ${showMore ? 'opened' : 'collapsed'}`}>
              <div className="inner-content">
                <SimpleTextParagraph className={`p0 mt0 mb0 ${theme.name}`}>
                  <SectionTitle className={`mt10 ${theme.name}`}>Liquidity provider rewards</SectionTitle>
                  <SectionContent>Liquidity providers earn a <a className="yellow">dynamic fee</a> (default 0.30%) on all trades proportional to their share of the pool.
                    Fees are added to the pool, accrue in real time and can be <a className="yellow">claimed</a> by withdrawing your liquidity.</SectionContent>
                </SimpleTextParagraph>
              </div>
              <AutoColumn gap="lg" justify="center">
                {pair ? (
                  <AutoColumn style={{ width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
                    <MinimalPositionCard showUnwrapped={oneCurrencyIsIETH} pair={pair} />
                  </AutoColumn>
                ) : null}
              </AutoColumn>
            </div>
          </div>
          <PageItemsContainer className={theme.name}>
            <AddRemoveTabs creating={false} adding={false} />
            <div className="clear-fix">
              <PageContentContainer className={`one ${theme.name}`}>
                <TransactionConfirmationModal
                  isOpen={showConfirm}
                  onDismiss={handleDismissConfirmation}
                  attemptingTxn={attemptingTxn}
                  hash={txHash ? txHash : ''}
                  content={() => (
                    <ConfirmationModalContent
                      title={'You will receive'}
                      onDismiss={handleDismissConfirmation}
                      topContent={modalHeader}
                      bottomContent={modalBottom}
                    />
                  )}
                  pendingText={pendingText}
                />
                <div className="full-width">
                  <SecondaryPanelBoxContainer className={` mb20 ${theme.name}`}>
                    <div className="inner-content p15">
                      <RemoveLiquiditySliderItemContainer className={`${theme.name}`}>
                        <DynamicGrid columns={2}>
                          <div className="text-left">
                            <h4 className={` title ${theme.name}`}>Amount</h4>
                          </div>
                          <div className="text-right">
                            <ActionButton className={theme.name} onClick={() => setShowDetailed(!showDetailed)}>
                              {showDetailed ? (<><label className={theme.name}>Detailed</label> <ChevronDown /></>) : (<><label className={theme.name}>Simple</label> <ChevronUp /></>)}
                            </ActionButton>
                          </div>
                        </DynamicGrid>
                        <div className="slider-percentage text-left">{formattedAmounts[Field.LIQUIDITY_PERCENT]}%</div>
                        {!showDetailed && (
                          <>
                            <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} />
                            <DynamicGrid columns={4}>
                              <MainOperationButton className={`width80 ${theme.name}`} onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}>25%</MainOperationButton>
                              <MainOperationButton className={`width80 ${theme.name}`} onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}>50%</MainOperationButton>
                              <MainOperationButton className={`width80 ${theme.name}`} onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}>75%</MainOperationButton>
                              <MainOperationButton className={`width80 ${theme.name}`} onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}>Max</MainOperationButton>
                            </DynamicGrid>
                          </>
                        )}
                      </RemoveLiquiditySliderItemContainer>
                    </div>
                  </SecondaryPanelBoxContainer>
                  {!showDetailed && (
                    <>
                      <div className="text-center mt20 mb20">
                        <ArrowDown className={`simple-icon ${theme.name}`} />
                      </div>
                      <SecondaryPanelBoxContainer className={` mb20 ${theme.name}`}>
                        <div className="inner-content p15">
                          <DynamicGrid className="mb15" columns={2} columnsDefinitions={[{ value: 25, location: 2 }]}>
                            <div className="text-left">
                              <RemoveLiquidityCustomText>{formattedAmounts[Field.CURRENCY_A] || '-'}</RemoveLiquidityCustomText>
                            </div>
                            <div className="text-right">
                              <RemoveLiquidityCustomText id="remove-liquidity-tokena-symbol" className="pull-right">{currencyA?.symbol}</RemoveLiquidityCustomText>
                              <CurrencyLogo currency={currencyA} style={{ float: 'right', marginRight: '15px' }} />
                            </div>
                          </DynamicGrid>
                          <DynamicGrid className="mb15" columns={2} columnsDefinitions={[{ value: 25, location: 2 }]}>
                            <div className="text-left">
                              <RemoveLiquidityCustomText>{formattedAmounts[Field.CURRENCY_B] || '-'}</RemoveLiquidityCustomText>
                            </div>
                            <div className="text-right">
                              <RemoveLiquidityCustomText id="remove-liquidity-tokenb-symbol" className="pull-right">{currencyB?.symbol}</RemoveLiquidityCustomText>
                              <CurrencyLogo currency={currencyB} style={{ float: 'right', marginRight: '15px' }} />
                            </div>
                          </DynamicGrid>
                          <AutoColumn gap="10px">
                            {chainId && (oneCurrencyIsIETH || oneCurrencyIsETH) ? (
                              <RowBetween style={{ justifyContent: 'flex-end' }}>
                                {oneCurrencyIsETH ? (
                                  <StyledInternalLink className={theme.name}
                                    to={`/remove/${currencyA === ETHER ? IETH[chainId].address : currencyIdA}/${currencyB === ETHER ? IETH[chainId].address : currencyIdB
                                      }`}
                                  >
                                    Receive IETH
                                  </StyledInternalLink>
                                ) : oneCurrencyIsIETH ? (
                                  <StyledInternalLink className={theme.name}
                                    to={`/remove/${currencyA && currencyEquals(currencyA, IETH[chainId]) ? 'ETH' : currencyIdA
                                      }/${currencyB && currencyEquals(currencyB, IETH[chainId]) ? 'ETH' : currencyIdB}`}
                                  >
                                    Receive ETH
                                  </StyledInternalLink>
                                ) : null}
                              </RowBetween>
                            ) : null}
                          </AutoColumn>
                        </div>
                      </SecondaryPanelBoxContainer>
                    </>
                  )}

                  {showDetailed && (
                    <>
                      <CurrencyInputPanel
                        value={formattedAmounts[Field.LIQUIDITY]}
                        onUserInput={onLiquidityInput}
                        onMax={() => {
                          onUserInput(Field.LIQUIDITY_PERCENT, '100')
                        }}
                        showMaxButton={!atMaxAmount}
                        disableCurrencySelect
                        currency={pair?.liquidityToken}
                        pair={pair}
                        id="liquidity-amount"
                        fatherPage="remove-liquidity"
                      />
                      <div className="text-center mt20 mb20">
                        <ArrowDown className={`simple-icon ${theme.name}`} />
                      </div>
                      <CurrencyInputPanel
                        hideBalance={true}
                        value={formattedAmounts[Field.CURRENCY_A]}
                        onUserInput={onCurrencyAInput}
                        onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                        showMaxButton={!atMaxAmount}
                        currency={currencyA}
                        label={'Output'}
                        onCurrencySelect={handleSelectCurrencyA}
                        id="remove-liquidity-tokena"
                        fatherPage="remove-liquidity"
                      />
                      <div className="text-center mt20 mb20">
                        <Plus className={`simple-icon ${theme.name}`} />
                      </div>
                      <CurrencyInputPanel
                        hideBalance={true}
                        value={formattedAmounts[Field.CURRENCY_B]}
                        onUserInput={onCurrencyBInput}
                        onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                        showMaxButton={!atMaxAmount}
                        currency={currencyB}
                        label={'Output'}
                        onCurrencySelect={handleSelectCurrencyB}
                        id="remove-liquidity-tokenb"
                        fatherPage="remove-liquidity"
                      />
                    </>
                  )}
                  {pair && (
                    <>
                      <DynamicGrid className="mb15" columns={2} columnsDefinitions={[{ value: 75, location: 2 }]}>
                        <div className="text-left pl15">Price:</div>
                        <div className="text-right pr15">1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}</div>
                      </DynamicGrid>
                      <DynamicGrid className="mb15" columns={2} columnsDefinitions={[{ value: 75, location: 2 }]}>
                        <div className="text-left pl15">&nbsp;</div>
                        <div className="text-right pr15">1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}</div>
                      </DynamicGrid>
                    </>
                  )}
                  <div style={{ position: 'relative' }}>
                    {!account ? (
                      <OperationButton onClick={toggleWalletModal} className={`connect-wallet-button ${theme.name}`} label="Connect Wallet">
                        <Link />
                      </OperationButton>
                    ) : (
                      <DynamicGrid columns={2} className="mt20">
                        <div className="text-left">
                          <ButtonMateriaConfirmed className={theme.name}
                            onClick={onAttemptToApprove}
                            confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                            disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                          >
                            {approval === ApprovalState.PENDING ? (<Dots>Approving</Dots>) :
                              approval === ApprovalState.APPROVED || signatureData !== null ? ('Approved') : ('Approve')}
                          </ButtonMateriaConfirmed>
                        </div>
                        <div className="text-right">
                          <ButtonMateriaError className={theme.name}
                            onClick={() => { setShowConfirm(true) }}
                            disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                            error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                          >
                            {error || 'Remove'}
                          </ButtonMateriaError>
                        </div>
                      </DynamicGrid>
                    )}
                  </div>
                </div>
              </PageContentContainer>
            </div>
          </PageItemsContainer>
        </PageGridContainer>
      </AppBody>
    </>
  )
}