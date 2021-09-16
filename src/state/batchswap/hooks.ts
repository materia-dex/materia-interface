import useENS from '../../hooks/useENS'
import { Currency, CurrencyAmount, ETHER, IETH, Token, Trade } from '@materia-dex/sdk'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { useTradeExactIn, useTradeExactOut } from '../../hooks/Trades'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import {
  clearCurrency,
  Field,
  selectCurrency,
  typeInput,
  setInitialState,
  setAmountMin,
  resetBatchSwapOutputs,
  setHasTrade
} from './actions'
import { useUserSlippageTolerance } from '../user/hooks'
import { computeBatchSwapSlippageAdjustedAmounts } from '../../utils/prices'
import useGetEthItemInteroperable from '../../hooks/useGetEthItemInteroperable'
import { tryParseAmount } from '../swap/hooks'
import { TokenOutParameter } from '../../hooks/useBatchSwapCallback'
import { unwrappedToken, wrappedCurrency } from '../../utils/wrappedCurrency'
import { WUSD } from '../../constants'

export function useBatchSwapState(): AppState['batchswap'] {
  return useSelector<AppState, AppState['batchswap']>(state => state.batchswap)
}

export function useBatchSwapActionHandlers(): {
  onCurrencySelection: (field: Field, otherField: Field, currency: Currency, interoperable?: string) => void
  onCurrencyRemoval: (field: Field) => void
  onUserInput: (field: Field, typedValue: string) => void
  onCurrencyAmountMin: (field: Field, amount?: CurrencyAmount) => void
  onBatchSwapOutputsReset: () => void
  onHasTrade: (field: Field, trade: boolean) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onCurrencySelection = useCallback(
    (field: Field, otherField: Field, currency: Currency, interoperable?: string) => {
      dispatch(
        selectCurrency({
          field,
          otherField,
          currency: currency,
          currencyId: currency instanceof Token ? currency.address : currency === ETHER ? 'ETH' : '',
          interoperable: interoperable
        })
      )
    },
    [dispatch]
  )

  const onCurrencyRemoval = useCallback(
    (field: Field) => {
      dispatch(
        clearCurrency({
          field
        })
      )
    },
    [dispatch]
  )

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onCurrencyAmountMin = useCallback(
    (field: Field, amount?: CurrencyAmount) => {
      dispatch(setAmountMin({ field, amount }))
    },
    [dispatch]
  )

  const onBatchSwapOutputsReset = useCallback(() => {
    dispatch(resetBatchSwapOutputs({}))
  }, [dispatch])

  const onHasTrade = useCallback(
    (field: Field, trade: boolean) => {
      dispatch(setHasTrade({ field, trade }))
    }, [dispatch])

  return {
    onCurrencySelection,
    onCurrencyRemoval,
    onUserInput,
    onCurrencyAmountMin,
    onBatchSwapOutputsReset,
    onHasTrade
  }
}

// from the current batch swap inputs, compute the best trade and return it.
export function useDerivedBatchSwapInfo(
  outputField: Field,
  interoperable: boolean | false
): {
  currencies: { [field in Field]?: Currency }
  originalCurrencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  originalCurrencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmount: CurrencyAmount | undefined
  v2Trade: Trade | undefined
  outputAmountMin?: CurrencyAmount
} {
  const { account, chainId } = useActiveWeb3React()
  const batchSwapState = useBatchSwapState()
  const {
    independentField,
    [Field.INPUT]: { typedValue: inputTypedValue, currencyId: inputCurrencyId },
    [outputField]: { typedValue: outputTypedValue, currencyId: outputCurrencyId },
    recipient
  } = batchSwapState

  const outputPercentage: number = parseFloat(outputTypedValue ?? 0)
  const calculatedTypedValue = (parseFloat(inputTypedValue ?? 0) * outputPercentage) / 100
  const typedValue = calculatedTypedValue.toString()

  const inputCurrencyInteroperableId = useGetEthItemInteroperable(inputCurrencyId)
  const outputCurrencyInteroperableId = useGetEthItemInteroperable(outputCurrencyId)

  const inputCurrency: Currency | undefined = useCurrency(inputCurrencyId) ?? undefined
  const outputCurrency: Currency | undefined = useCurrency(outputCurrencyId) ?? undefined

  let inputCurrencyInteroperable: Currency | undefined = useCurrency(inputCurrencyInteroperableId) ?? undefined
  let outputCurrencyInteroperable: Currency | undefined = useCurrency(outputCurrencyInteroperableId) ?? undefined

  inputCurrencyInteroperable = inputCurrency === ETHER ? IETH[chainId ?? 1] : inputCurrencyInteroperable
  outputCurrencyInteroperable = outputCurrency === ETHER ? IETH[chainId ?? 1] : outputCurrencyInteroperable

  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const originalRelevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined
  ])

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    interoperable ? inputCurrencyInteroperable ?? inputCurrency : inputCurrency ?? undefined,
    interoperable ? outputCurrencyInteroperable ?? outputCurrency : outputCurrency ?? undefined
  ])

  const isExactIn: boolean = independentField === Field.INPUT

  const inputParsedAmount = tryParseAmount(inputTypedValue, inputCurrencyInteroperable ?? inputCurrency ?? undefined)
  const parsedAmount = tryParseAmount(
    typedValue,
    (isExactIn ? inputCurrencyInteroperable ?? inputCurrency : outputCurrencyInteroperable ?? outputCurrency) ??
    undefined
  )

  const bestTradeExactIn = useTradeExactIn(
    isExactIn ? parsedAmount : undefined,
    outputCurrencyInteroperable ?? outputCurrency ?? undefined
  )
  const bestTradeExactOut = useTradeExactOut(
    inputCurrencyInteroperable ?? inputCurrency ?? undefined,
    !isExactIn ? parsedAmount : undefined
  )

  const v2Trade = isExactIn ? bestTradeExactIn : bestTradeExactOut

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [outputField]: relevantTokenBalances[1]
  }
  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: interoperable ? inputCurrencyInteroperable ?? inputCurrency : inputCurrency ?? undefined,
    [outputField]: interoperable ? outputCurrencyInteroperable ?? outputCurrency : outputCurrency ?? undefined
  }

  const originalCurrencyBalances = {
    [Field.INPUT]: originalRelevantTokenBalances[0],
    [outputField]: originalRelevantTokenBalances[1]
  }
  const originalCurrencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [outputField]: outputCurrency ?? undefined
  }

  const [allowedSlippage] = useUserSlippageTolerance()

  const slippageAdjustedAmounts =
    v2Trade && allowedSlippage != undefined && computeBatchSwapSlippageAdjustedAmounts(v2Trade, allowedSlippage, outputField)

  const outputAmountMin = slippageAdjustedAmounts ? slippageAdjustedAmounts[outputField] : undefined

  return {
    currencies,
    originalCurrencies,
    currencyBalances,
    originalCurrencyBalances,
    parsedAmount: inputParsedAmount,
    v2Trade: v2Trade ?? undefined,
    outputAmountMin
  }
}

export function useOutputsParametersInfo(
  outputFields: Field[]
): {
  outputsInfo: TokenOutParameter[] | undefined
} {
  const { chainId } = useActiveWeb3React()
  const batchSwapState = useBatchSwapState()
  const outputsInfo: TokenOutParameter[] = []

  outputFields.map(outputField => {
    const {
      [outputField]: {
        typedValue: outputTypedValue,
        currency: outputCurrency,
        interoperable: interoperable,
        currencyAmountMin: outputAmountMin
      }
    } = batchSwapState

    const outputToken = wrappedCurrency(outputCurrency, chainId)
    const outputInfo: TokenOutParameter = {
      currency: outputCurrency,
      currencyAmountMin: outputAmountMin,
      token: outputToken,
      interoperable: interoperable,
      percentage: parseInt(outputTypedValue ?? 0),
      amount: undefined
    }

    outputsInfo.push(outputInfo)
  })

  return {
    outputsInfo: outputsInfo
  }
}

export function useValidateBatchSwapParameters(
  outputFields: Field[],
  inputExceedBalance: boolean,
  inputHasTrade: boolean
): {
  message?: string
} {
  const { chainId, account } = useActiveWeb3React()
  const batchSwapState = useBatchSwapState()

  const currencies: Array<Currency | undefined> = []
  const percentages: Array<number> = [];
  const hasTrades: Array<boolean> = [];

  const {
    [Field.INPUT]: {
      typedValue: inputTypedValue,
      currency: inputCurrency,
    }
  } = batchSwapState

  const inputToken = inputCurrency == ETHER ? inputCurrency : wrappedCurrency(inputCurrency, chainId)

  outputFields.map(outputField => {
    const {
      [outputField]: {
        typedValue: outputTypedValue,
        currency: outputCurrency,
        trade: outputHasTrade
      }
    } = batchSwapState

    const outputToken = outputCurrency == ETHER ? outputCurrency : wrappedCurrency(outputCurrency, chainId)
    const percentage = parseInt(outputTypedValue ?? 0)

    currencies.push(outputToken)
    percentages.push(percentage)
    hasTrades.push(outputHasTrade)
  })

  if (!account) {
    return {
      message: 'Connect wallet'
    }
  }

  if (inputExceedBalance) {
    return {
      message: 'Insufficient input balance'
    }
  }

  const inputTokenSelected = inputToken == undefined

  if (inputTokenSelected) {
    return {
      message: 'Select input token'
    }
  }

  const inputQuantityInvalid = inputTypedValue == undefined || inputTypedValue.trim().length == 0 || inputTypedValue == '0'

  if (inputQuantityInvalid) {
    return {
      message: 'Enter input amount'
    }
  }

  const selectedCurrencies = currencies.filter(x => !!x)
  const inputCurrencySelectedInOutputs = selectedCurrencies.includes(inputToken)

  if (inputCurrencySelectedInOutputs) {
    return {
      message: 'Invalid input token'
    }
  }

  const outputCurrencyDuplicated = [...new Set(selectedCurrencies)].length < selectedCurrencies.length
  const outputCurrencyNotSelectedError = selectedCurrencies.length != outputFields.length

  if (outputCurrencyDuplicated) {
    return {
      message: 'Invalid output token'
    }
  }

  if (outputCurrencyNotSelectedError) {
    return {
      message: 'Select output token'
    }
  }

  const totalPercentage = percentages.reduce((a, b) => a + b, 0)
  const zeroPercentages = percentages.filter(x => !x).length > 0
  const percentageGreaterThan100 = totalPercentage > 100
  const percentageLowerThan100 = totalPercentage < 100

  if (zeroPercentages) {
    return {
      message: 'Select an output value'
    }
  }

  if (percentageGreaterThan100) {
    return {
      message: 'Percentage greater than 100%'
    }
  }

  if (percentageLowerThan100) {
    return {
      message: 'Percentage lower than 100%'
    }
  }

  if (!inputHasTrade) {
    return {
      message: 'Insufficient liquidity for this trade'
    }
  }

  const outputNoTradeError = hasTrades.filter(x => !!x).length != outputFields.length

  if (outputNoTradeError) {
    return {
      message: 'Insufficient liquidity for this trade'
    }
  }

  return {
    message: undefined
  }
}

export function useBatchSwapDefaults(): { inputCurrencyId: string | undefined } | undefined {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const [result, setResult] = useState<{ inputCurrencyId: string | undefined } | undefined>()

  useEffect(() => {
    if (!chainId) return

    const token = 'ETH'
    const currency = unwrappedToken(IETH[chainId])

    dispatch(
      setInitialState({
        inputCurrency: currency,
        inputCurrencyId: token,
      })
    )

    setResult({ inputCurrencyId: token })
  }, [dispatch, chainId])

  return result
}
