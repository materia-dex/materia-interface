import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { ADD_LIQUIDITY_ACTION_SAFE_TRANSFER_TOKEN, Currency, currencyEquals, ETHER, JSBI, TokenAmount, IETH } from '@materia-dex/sdk'
import React, { useCallback, useContext, useState, useMemo, useEffect } from 'react'
import ReactGA from 'react-ga'
import { NavLink, RouteComponentProps } from 'react-router-dom'
import { ButtonMateriaConfirmed, ButtonMateriaError, ButtonMateriaPrimary } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { AutoRow, RowBetween, RowFlat } from '../../components/Row'
import { darken } from 'polished'
import { Link } from 'react-feather'
import { ORCHESTRATOR_ADDRESS, WUSD, ZERO_ADDRESS } from '../../constants'
import { PairState, usePair } from '../../data/Reserves'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useTokenApproveCallback } from '../../hooks/useApproveCallback'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../state/mint/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useAddInteroperableTokens, useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getEthItemCollectionContract, getOrchestratorContract } from '../../utils'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom'
import { currencyId } from '../../utils/currencyId'
import { PoolPriceBar } from './PoolPriceBar'
import styled, { ThemeContext } from 'styled-components'
import { Pair } from '@materia-dex/sdk'
import FullPositionCard from '../../components/PositionCard'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import {
  PageGridContainer,
  PageItemsContainer,
  TabsBar,
  TabLinkItem,
  PageContentContainer,
  TradePriceContainer,
  SecondaryPanelBoxContainer,
  SecondaryPanelBoxContainerExtraDecorator,
  SimpleTextParagraph,
  SectionTitle,
  StyledInternalLink,
  ExternalLink,
  TYPE,
  HideSmall,
  EmptyProposals,
  Dots,
  OperationButton,
  IconButton,
  MainOperationButton,
  DynamicGrid,
  ActionButton,
  SectionContent
} from '../../theme'
import { Text } from 'rebass'
import { useActiveWeb3React } from '../../hooks'
import { usePairs } from '../../data/Reserves'
import { toLiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { CardNoise, CardBGImage } from '../../components/earn/styled'
import AppBody from '../AppBody'
import usePoolCurrencies from '../../hooks/usePoolCurrencies'
import { Result } from '../../state/multicall/hooks'
import { Contract } from 'ethers'
import Web3 from 'web3'
import useCheckIsEthItem from '../../hooks/useCheckIsEthItem'
import { decodeInteroperableValueToERC20TokenAmount } from '../../state/swap/hooks'
import useUpdateWrappedERC20TokensCallback from '../../hooks/useUpdateWrappedERC20TokensCallback'
import { Scrollbars } from 'react-custom-scrollbars'
import AutoSizer from 'react-virtualized-auto-sizer'

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const { poolCurrencyIdA, poolCurrencyIdB } = usePoolCurrencies(currencyIdA, currencyIdB)

  currencyIdA = poolCurrencyIdA
  currencyIdB = poolCurrencyIdB

  // Pool
  // fetch the user's balances of all tracked MP tokens
  const trackedTokenPairs = useTrackedTokenPairs()

  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map(tokens => ({
      liquidityToken: toLiquidityToken(tokens), tokens
    })),
    [trackedTokenPairs]
  )

  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokens
  ])

  const [pairsBalances, fetchingPairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        pairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, pairsBalances]
  )

  const pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const isLoading =
    fetchingPairBalances || pairs?.length < liquidityTokensWithBalances.length || pairs?.some(Pair => !Pair)

  const allPairsWithLiquidity = pairs.map(([, pair]) => pair).filter((pair): pair is Pair => Boolean(pair))

  // AddLiquidity
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const oneCurrencyIsIETH = Boolean(
    chainId &&
    ((currencyA && currencyEquals(currencyA, IETH[chainId])) ||
      (currencyB && currencyEquals(currencyB, IETH[chainId])))
  )

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    // currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined, true)
  const {
    // pair: originalPair,
    // pairState: originalPairState,
    currencyBalances: originalCurrencyBalances,
    parsedAmounts: originalParsedAmounts
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined, false)
  const currencyBAddress = currencyB ? (wrappedCurrency(currencyB, chainId)?.address ?? ZERO_ADDRESS) : ZERO_ADDRESS
  const checkIsEthItem = useCheckIsEthItem(currencyBAddress)
  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(originalCurrencyBalances[field])
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(originalParsedAmounts[field] ?? '0')
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useTokenApproveCallback(
    parsedAmounts[Field.CURRENCY_A],
    wrappedCurrency(currencies[Field.CURRENCY_A], chainId) ?? undefined,
    ORCHESTRATOR_ADDRESS
  )
  const [approvalB, approveBCallback] = useTokenApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    wrappedCurrency(currencies[Field.CURRENCY_B], chainId) ?? undefined,
    ORCHESTRATOR_ADDRESS
  )

  const addTransaction = useTransactionAdder()
  const addInteroperableTokens = useAddInteroperableTokens()

  const { execute: onLiquidityPoolsUpdate } = useUpdateWrappedERC20TokensCallback(chainId, library, addInteroperableTokens)

  async function onAdd(checkIsEthItem: Result | undefined) {
    if (!chainId || !library || !account) return
    const router = getOrchestratorContract(chainId, library, account)
    const isEthItem: boolean = checkIsEthItem?.ethItem
    const ethItemCollection: string = checkIsEthItem?.collection
    const ethItemObjectId: JSBI = JSBI.BigInt(checkIsEthItem?.itemId ?? 0)
    const collectionContract: Contract | null =
      (!library || !account || !chainId || !isEthItem)
        ? null
        : getEthItemCollectionContract(chainId, ethItemCollection, library, account)

    if (!currencyA || !currencyB) {
      return
    }

    const currencyWUSD = WUSD[chainId ?? 1]
    const currencyBIsWUSD = wrappedCurrency(currencyB, chainId)?.address == currencyWUSD.address

    const parsedAmountA = currencyBIsWUSD
      ? decodeInteroperableValueToERC20TokenAmount(parsedAmounts[Field.CURRENCY_A], originalParsedAmounts[Field.CURRENCY_A])
      : parsedAmounts[Field.CURRENCY_A]
    // const modifiedParsedAmountB = currencyBIsWUSD 
    const parsedAmountB = currencyBIsWUSD
      ? parsedAmounts[Field.CURRENCY_B]
      : decodeInteroperableValueToERC20TokenAmount(parsedAmounts[Field.CURRENCY_B], originalParsedAmounts[Field.CURRENCY_B])

    if (!parsedAmountA || !parsedAmountB || !deadline) {
      return
    }

    const isETH: boolean = currencyA === ETHER || currencyB === ETHER

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0]
    }

    let estimate
    let method: (...args: any) => Promise<TransactionResponse>
    let methodName: string
    let args: Array<string | string[] | number | boolean>
    let value: BigNumber | null

    if (isEthItem && !isETH) {
      if (!collectionContract) return

      const web3 = new Web3();
      let operation: number = ADD_LIQUIDITY_ACTION_SAFE_TRANSFER_TOKEN
      let ethItemArgs: (any | any[])

      // (address from, address to, uint256 id, uint256 amount, bytes calldata data)
      estimate = collectionContract.estimateGas.safeTransferFrom
      method = collectionContract.safeTransferFrom
      methodName = "safeTransferFrom"
      ethItemArgs = web3.eth.abi.encodeParameters(
        ["uint256", "bytes"],
        [operation, web3.eth.abi.encodeParameters(
          // (uint bridgeAmountDesired, uint tokenAmountMin, uint bridgeAmountMin, address to, uint deadline)
          ["uint", "uint", "uint", "address", "uint"],
          [
            currencyBIsWUSD ? parsedAmountB.raw.toString() : parsedAmountA.raw.toString(),
            currencyBIsWUSD ? amountsMin[Field.CURRENCY_A].toString() : amountsMin[Field.CURRENCY_B].toString(),
            currencyBIsWUSD ? amountsMin[Field.CURRENCY_B].toString() : amountsMin[Field.CURRENCY_A].toString(),
            account,
            deadline.toHexString()
          ]
        )]
      )
      args = [
        account,
        ORCHESTRATOR_ADDRESS,
        ethItemObjectId?.toString() ?? "0",
        currencyBIsWUSD ? parsedAmountA.raw.toString() : parsedAmountB.raw.toString(),
        ethItemArgs]
      value = null
    }
    else {
      if (currencyA === ETHER || currencyB === ETHER) {
        const tokenBIsETH = currencyB === ETHER
        estimate = router.estimateGas.addLiquidityETH
        method = router.addLiquidityETH
        methodName = "addLiquidityETH"
        // (uint bridgeAmountDesired, uint EthAmountMin, uint bridgeAmountMin, address to, uint deadline)
        args = [
          (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
          amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
          amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
          account,
          deadline.toHexString()
        ]
        value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
      } else {

        estimate = router.estimateGas.addLiquidity
        method = router.addLiquidity
        methodName = "addLiquidity"
        // (address token, uint tokenAmountDesired, uint bridgeAmountDesired, uint tokenAmountMin, uint bridgeAmountMin, address to, uint deadline)
        args = [
          wrappedCurrency(currencyBIsWUSD ? currencyA : currencyB, chainId)?.address ?? '',
          currencyBIsWUSD ? parsedAmountA.raw.toString() : parsedAmountB.raw.toString(),
          currencyBIsWUSD ? parsedAmountB.raw.toString() : parsedAmountA.raw.toString(),
          currencyBIsWUSD ? amountsMin[Field.CURRENCY_A].toString() : amountsMin[Field.CURRENCY_B].toString(),
          currencyBIsWUSD ? amountsMin[Field.CURRENCY_B].toString() : amountsMin[Field.CURRENCY_A].toString(),
          account,
          deadline.toHexString(),
        ]
        value = null
      }
    }

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Add ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_A]?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_B]?.symbol
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
            label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/')
          })
        })
      )
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const modalHeader = () => {
    return noLiquidity ? (
      <AutoColumn gap="20px">
        <LightCard mt="20px" borderRadius="20px">
          <RowFlat>
            <Text fontSize="48px" fontWeight={900} lineHeight="42px" marginRight={10}>
              {currencies[Field.CURRENCY_A]?.symbol + '/' + currencies[Field.CURRENCY_B]?.symbol}
            </Text>
            <DoubleCurrencyLogo
              currency0={currencies[Field.CURRENCY_A]}
              currency1={currencies[Field.CURRENCY_B]}
              size={30}
              radius={true}
            />
          </RowFlat>
        </LightCard>
      </AutoColumn>
    ) : (
      <AutoColumn gap="20px">
        <RowFlat style={{ marginTop: '20px' }}>
          <Text fontSize="48px" fontWeight={900} lineHeight="42px" marginRight={10}>
            {liquidityMinted?.toSignificant(6)}
          </Text>
          <DoubleCurrencyLogo
            currency0={currencies[Field.CURRENCY_A]}
            currency1={currencies[Field.CURRENCY_B]}
            size={30}
            radius={true}
          />
        </RowFlat>
        <Row>
          <Text fontSize="24px">
            {currencies[Field.CURRENCY_A]?.symbol + '/' + currencies[Field.CURRENCY_B]?.symbol + ' Pool Tokens'}
          </Text>
        </Row>
        <TYPE.italic fontSize={12} textAlign="left" padding={'8px 0 0 0 '}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={() => { onAdd(checkIsEthItem) }}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${currencies[Field.CURRENCY_A]?.symbol
    } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/add/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/add/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  const isCreate = history.location.pathname.includes('/create')
  const [showMore, setShowMore] = useState(false)

  const activeClassName = 'ACTIVE'
  const StyledNavLink = styled(NavLink).attrs({
    activeClassName
  })`
    ${({ theme }) => theme.flexRowNoWrap}
    align-items: left;
    border-radius: 3rem;
    outline: none;
    cursor: pointer;
    text-decoration: none;
    color: ${({ theme }) => theme.text2};
    font-size: 1rem;
    width: fit-content;
    margin: 0 12px;
    font-weight: 500;

    &.${activeClassName} {
      // border-radius: 12px;
      font-weight: 600;
      color: ${({ theme }) => theme.cyan1};
    }

    :hover,
    :focus {
      color: ${({ theme }) => darken(0.1, theme.cyan1)};
    }
  `

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
              <HideSmall>
                <SectionTitle className={`mt10 ${theme.name}`}>Your liquidity</SectionTitle>
              </HideSmall>
              <Scrollbars autoHeight autoHeightMax={550} autoHeightMin={400} autoHide>
                {!account ? (
                  <SimpleTextParagraph className={`p20 text-center ${theme.name}`}>
                    Connect to a wallet to view your liquidity.
                  </SimpleTextParagraph>
                ) : isLoading ? (
                  <EmptyProposals className={theme.name}>
                    <SimpleTextParagraph className={`p20 text-center ${theme.name}`}>
                      <Dots>Loading</Dots>
                    </SimpleTextParagraph>
                  </EmptyProposals>
                ) : allPairsWithLiquidity?.length > 0 ? (
                  <>
                    <SimpleTextParagraph className={`text-left mt0 mb10 ${theme.name}`}>
                      <ExternalLink href={'https://info.materiadex.com/account/' + account}>
                        Account analytics and accrued fees
                        <IconButton className={`hide-classic ${theme.name}`}>
                          <span className="icon-symbol">↗</span>
                        </IconButton>
                      </ExternalLink>
                    </SimpleTextParagraph>
                    {allPairsWithLiquidity.map(pair => (
                      <FullPositionCard key={pair.liquidityToken.address} pair={pair} />
                    ))}
                  </>
                ) : (
                  <EmptyProposals className={theme.name}>
                    <SimpleTextParagraph className={`p20 text-center ${theme.name}`}>
                      No liquidity found.
                    </SimpleTextParagraph>
                  </EmptyProposals>
                )}
              </Scrollbars>
              <SimpleTextParagraph className={`text-left m0 ${theme.name}`}>
                Don't see a pool you joined? <StyledInternalLink className={`${theme.name}`} id="refresh-pool-link" to={'#'} onClick={onLiquidityPoolsUpdate}>Refresh</StyledInternalLink> your pools or <StyledInternalLink className={`${theme.name}`} id="import-pool-link" to={'/find'}>import it</StyledInternalLink>.
              </SimpleTextParagraph>
            </div>
          </div>

          <PageItemsContainer className={theme.name}>
            <TabsBar className={theme.name}>
              <TabLinkItem id={`Add-Liquidity`} to={'/add/WUSD'}
                className={`tabLinkItem ${theme.name}`}
                isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/add')}
              >Add Liquidity</TabLinkItem>
              <TabLinkItem id={`Create-a-pair`} to={'/create/WUSD'}
                className={`tabLinkItem ${theme.name}`}
                isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/create')}
              >Create a pair</TabLinkItem>
            </TabsBar>
            <div className="clear-fix">
              <PageContentContainer className={theme.name}>
                <TransactionConfirmationModal
                  isOpen={showConfirm}
                  onDismiss={handleDismissConfirmation}
                  attemptingTxn={attemptingTxn}
                  hash={txHash}
                  content={() => (
                    <ConfirmationModalContent
                      title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
                      onDismiss={handleDismissConfirmation}
                      topContent={modalHeader}
                      bottomContent={modalBottom}
                    />
                  )}
                  pendingText={pendingText}
                  currencyToAdd={pair?.liquidityToken}
                />
                <div>
                  <AutoColumn gap={'lg'}>
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      onCurrencySelect={handleCurrencyASelect}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                      currency={currencies[Field.CURRENCY_A]}
                      disableCurrencySelect={true}
                      id="add-liquidity-input-tokena"
                      showCommonBases
                    />
                  </AutoColumn>
                </div>
                <TradePriceContainer></TradePriceContainer>
                <div>
                  <AutoColumn gap={'lg'}>
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      onUserInput={onFieldBInput}
                      onCurrencySelect={handleCurrencyBSelect}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                      currency={currencies[Field.CURRENCY_B]}
                      id="add-liquidity-input-tokenb"
                      showCommonBases
                    />
                  </AutoColumn>
                </div>
              </PageContentContainer>
              {noLiquidity ||
                (isCreate && (
                  <ColumnCenter>
                    <SimpleTextParagraph className={`text-center pb20 ${theme.name}`}>
                      You are the first liquidity provider.<br />
                      The ratio of tokens you add will set the price of this pool.<br />
                      Once you are happy with the rate click supply to review.
                    </SimpleTextParagraph>
                  </ColumnCenter>
                ))}
              {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
                <>
                  <PoolPriceBar
                    currencies={currencies}
                    poolTokenPercentage={poolTokenPercentage}
                    noLiquidity={noLiquidity}
                    price={price}
                  />
                </>
              )}
            </div>
            {pair && !noLiquidity && pairState !== PairState.INVALID ? (<MinimalPositionCard showUnwrapped={oneCurrencyIsIETH} pair={pair} />) : null}
            {!account ? (
              <ColumnCenter>
                <ButtonMateriaConfirmed
                  onClick={toggleWalletModal}
                  className={`connect-wallet-button ${theme.name}`}
                  label="Connect Wallet"
                >
                  <AutoRow gap="6px" justify="center">
                    Connect Wallet <Link />
                  </AutoRow>

                </ButtonMateriaConfirmed>
              </ColumnCenter>
            ) : (
              <AutoColumn gap={'md'}>
                <DynamicGrid className={theme.name} columns={
                  (approvalA === ApprovalState.NOT_APPROVED || approvalA === ApprovalState.PENDING) &&
                    (approvalB === ApprovalState.NOT_APPROVED || approvalB === ApprovalState.PENDING) ? 3 :
                    (((approvalA === ApprovalState.NOT_APPROVED || approvalA === ApprovalState.PENDING) ||
                      (approvalB === ApprovalState.NOT_APPROVED || approvalB === ApprovalState.PENDING)) ? 2 : 1)
                }>
                  <>
                    {(approvalA === ApprovalState.NOT_APPROVED ||
                      approvalA === ApprovalState.PENDING ||
                      approvalB === ApprovalState.NOT_APPROVED ||
                      approvalB === ApprovalState.PENDING) &&
                      isValid && (
                        <>
                          {approvalA !== ApprovalState.APPROVED && (
                            <div className="text-centered">
                              <MainOperationButton
                                className={theme.name}
                                onClick={approveACallback}
                                disabled={approvalA === ApprovalState.PENDING}>
                                {approvalA === ApprovalState.PENDING ? (
                                  <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                                ) : ('Approve ' + currencies[Field.CURRENCY_A]?.symbol)}
                              </MainOperationButton>
                            </div>
                          )}
                          {approvalB !== ApprovalState.APPROVED && (
                            <div className="text-centered">
                              <MainOperationButton
                                className={theme.name}
                                onClick={approveBCallback}
                                disabled={approvalB === ApprovalState.PENDING}>
                                {approvalB === ApprovalState.PENDING ? (
                                  <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                                ) : ('Approve ' + currencies[Field.CURRENCY_B]?.symbol)}
                              </MainOperationButton>
                            </div>
                          )}
                        </>
                      )}
                    <div className="text-centered">
                      <ButtonMateriaError
                        onClick={() => { expertMode ? onAdd(checkIsEthItem) : setShowConfirm(true) }}
                        disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                        error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]} >
                        {error ?? 'Supply'}
                      </ButtonMateriaError>
                    </div>
                  </>
                </DynamicGrid>
              </AutoColumn>
            )}
          </PageItemsContainer>
        </PageGridContainer>
      </AppBody>
    </>
  )
}
