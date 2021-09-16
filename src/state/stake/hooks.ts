import { ChainId, CurrencyAmount, JSBI, Token, TokenAmount, Pair, IETH } from '@materia-dex/sdk'
import { useMemo } from 'react'
import { GIL, IDAI, IGIL, IUSDC, IWBTC, WUSD, ZERO_ADDRESS } from '../../constants'
import { STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
import { useActiveWeb3React } from '../../hooks'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'

export const STAKING_GENESIS = 1619121600
export const REWARDS_DURATION_DAYS = 60

export enum StakingSeason {
  SEASON_ONE = "SEASON_ONE",
  SEASON_TWO = "SEASON_TWO",
}

// TODO add staking rewards addresses here
export const STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    tokens: [Token, Token]
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.MAINNET]: [
    {
      tokens: [WUSD[ChainId.MAINNET], IETH[ChainId.MAINNET]],
      stakingRewardAddress: '0x3CC48243bb9E4546E9dEf4a84b7A24cA32aDA299'
    },
    {
      tokens: [WUSD[ChainId.MAINNET], IGIL[ChainId.MAINNET]],
      stakingRewardAddress: '0x8bab29e8B767F647530A0a61dbe0C13EF1856566'
    },
    {
      tokens: [WUSD[ChainId.MAINNET], IDAI[ChainId.MAINNET]],
      stakingRewardAddress: '0xb82b08A58Af6AEF3D1421474C98CfBaB21DE6aC7'
    },
    {
      tokens: [WUSD[ChainId.MAINNET], IUSDC[ChainId.MAINNET]],
      stakingRewardAddress: '0xcfF2606297F9B16774d53311546E7f6Cdf7F8FC4'
    },
    {
      tokens: [WUSD[ChainId.MAINNET], IWBTC[ChainId.MAINNET]],
      stakingRewardAddress: '0xe6c78004932111C8A55d9d9FBF5c3fc5905B4FE5'
    },
  ],
  [ChainId.ROPSTEN]: [
    {
      tokens: [WUSD[ChainId.ROPSTEN], IETH[ChainId.ROPSTEN]],
      stakingRewardAddress: '0x3b88dad68fCf3De0781d79F1aBA2047b2b82B034'
    },
    {
      tokens: [WUSD[ChainId.ROPSTEN], IGIL[ChainId.ROPSTEN]],
      stakingRewardAddress: '0xd0172f46880169F30857D301Daac9cB069de69Dc'
    },
    {
      tokens: [WUSD[ChainId.ROPSTEN], IDAI[ChainId.ROPSTEN]],
      stakingRewardAddress: '0x044748A01a5CEbc13F2928377d9932E9D4CD3354'
    },
    {
      tokens: [WUSD[ChainId.ROPSTEN], IUSDC[ChainId.ROPSTEN]],
      stakingRewardAddress: '0xb24c0288208b058d0B3aC974b99132f81fa4FC88'
    },
    {
      tokens: [WUSD[ChainId.ROPSTEN], IWBTC[ChainId.ROPSTEN]],
      stakingRewardAddress: '0xC7f9C38ef14A3b46F5D5Ce44E0aB405A62Ad5B6A'
    },
  ]
}

export const STAKING_REWARDS_INFO_SEASON_TWO: {
  [chainId in ChainId]?: {
    tokens: [Token, Token]
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.MAINNET]: [
    {
      tokens: [WUSD[ChainId.MAINNET], IETH[ChainId.MAINNET]],
      stakingRewardAddress: '0x586f8FE41fB6eF9135513DD2247F5259c624c6AB'
    },
    {
      tokens: [WUSD[ChainId.MAINNET], IGIL[ChainId.MAINNET]],
      stakingRewardAddress: '0xE5f2B132D0b4d27661788F6d582Bd0436c51153A'
    },
  ],
  [ChainId.ROPSTEN]: [
    {
      tokens: [WUSD[ChainId.ROPSTEN], IETH[ChainId.ROPSTEN]],
      stakingRewardAddress: '0x9F60F4056652fd1e7894f0b6fE7278bdbDDcDb62'
    },
    {
      tokens: [WUSD[ChainId.ROPSTEN], IGIL[ChainId.ROPSTEN]],
      stakingRewardAddress: '0x26256f54e4a69062d3e303f28E3Cd9DAD5E79e89'
    },
  ]
}

export interface StakingInfo {
  // the address of the reward contract
  stakingRewardAddress: string
  // the tokens involved in this pair
  tokens: [Token, Token]
  // the amount of token currently staked, or undefined if no account
  stakedAmount: TokenAmount
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount: TokenAmount
  // the total amount of token staked in the contract
  totalStakedAmount: TokenAmount
  // the amount of token distributed per second to all LPs, constant
  totalRewardRate: TokenAmount
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  rewardRate: TokenAmount
  // when the period ends
  periodFinish: Date | undefined
  // season enabled or ended
  isEnabled: Boolean | undefined
  // calculates a hypothetical amount of token distributed to the active account per second.
  getHypotheticalRewardRate: (
    stakedAmount: TokenAmount,
    totalStakedAmount: TokenAmount,
    totalRewardRate: TokenAmount
  ) => TokenAmount
}

// gets the staking info from the network for the active chain id
export function useStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[] {
  const { chainId, account } = useActiveWeb3React()

  const info = useMemo(
    () =>
      chainId
        ? STAKING_REWARDS_INFO[chainId]?.filter(stakingRewardInfo =>
          pairToFilterBy === undefined
            ? true
            : pairToFilterBy === null
              ? false
              : pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
              pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
        ) ?? []
        : [],
    [chainId, pairToFilterBy]
  )

  const gil = chainId ? GIL[chainId] : undefined

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])

  // get all the info from the staking rewards contracts
  const balances = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'balanceOf', accountArg)
  const earnedAmounts = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'earned', accountArg)
  const totalSupplies = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalSupply')

  // tokens per second, constants
  const rewardRates = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'rewardRate',
    undefined,
    NEVER_RELOAD
  )
  const periodFinishes = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'periodFinish',
    undefined,
    NEVER_RELOAD
  )

  return useMemo(() => {
    if (!chainId || !gil) return []

    return rewardsAddresses.reduce<StakingInfo[]>((memo, rewardsAddress, index) => {
      // these two are dependent on account
      const balanceState = balances[index]
      const earnedAmountState = earnedAmounts[index]

      // these get fetched regardless of account
      const totalSupplyState = totalSupplies[index]
      const rewardRateState = rewardRates[index]
      const periodFinishState = periodFinishes[index]

      if (
        // these may be undefined if not logged in
        !balanceState?.loading &&
        !earnedAmountState?.loading &&
        // always need these
        totalSupplyState &&
        !totalSupplyState.loading &&
        rewardRateState &&
        !rewardRateState.loading &&
        periodFinishState &&
        !periodFinishState.loading
      ) {
        if (
          balanceState?.error ||
          earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error ||
          periodFinishState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        // get the MP token
        const tokens = info[index].tokens
        const dummyPair = new Pair(new TokenAmount(tokens[0], '0'), new TokenAmount(tokens[1], '0'))

        // check for account, if no account set to 0

        const stakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
        const totalStakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(totalSupplyState.result?.[0]))
        const totalRewardRate = new TokenAmount(gil, JSBI.BigInt(rewardRateState.result?.[0]))

        const getHypotheticalRewardRate = (
          stakedAmount: TokenAmount,
          totalStakedAmount: TokenAmount,
          totalRewardRate: TokenAmount
        ): TokenAmount => {
          return new TokenAmount(
            gil,
            JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
              ? JSBI.divide(JSBI.multiply(totalRewardRate.raw, stakedAmount.raw), totalStakedAmount.raw)
              : JSBI.BigInt(0)
          )
        }

        const individualRewardRate = getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRate)

        const periodFinishMs = periodFinishState.result?.[0]?.mul(1000)?.toNumber()

        memo.push({
          isEnabled: false,
          stakingRewardAddress: rewardsAddress,
          tokens: info[index].tokens,
          periodFinish: periodFinishMs > 0 ? new Date(periodFinishMs) : undefined,
          earnedAmount: new TokenAmount(gil, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
          rewardRate: individualRewardRate,
          totalRewardRate: totalRewardRate,
          stakedAmount: stakedAmount,
          totalStakedAmount: totalStakedAmount,
          getHypotheticalRewardRate
        })
      }
      return memo
    }, [])
  }, [balances, chainId, earnedAmounts, info, periodFinishes, rewardRates, rewardsAddresses, totalSupplies, gil])
}

export function useStakingInfoSecondSeason(pairToFilterBy?: Pair | null): StakingInfo[] {
  const { chainId, account } = useActiveWeb3React()

  const info = useMemo(
    () =>
      chainId
        ? STAKING_REWARDS_INFO_SEASON_TWO[chainId]?.filter(stakingRewardInfo =>
          pairToFilterBy === undefined
            ? true
            : pairToFilterBy === null
              ? false
              : pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
              pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
        ) ?? []
        : [],
    [chainId, pairToFilterBy]
  )

  const gil = chainId ? GIL[chainId] : undefined

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])

  // get all the info from the staking rewards contracts
  const balances = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'balanceOf', accountArg)
  const earnedAmounts = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'earned', accountArg)
  const totalSupplies = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalSupply')

  // tokens per second, constants
  const rewardRates = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'rewardRate',
    undefined,
    NEVER_RELOAD
  )
  const periodFinishes = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'periodFinish',
    undefined,
    NEVER_RELOAD
  )

  return useMemo(() => {
    if (!chainId || !gil) return []

    return rewardsAddresses.reduce<StakingInfo[]>((memo, rewardsAddress, index) => {
      // these two are dependent on account
      const balanceState = balances[index]
      const earnedAmountState = earnedAmounts[index]

      // these get fetched regardless of account
      const totalSupplyState = totalSupplies[index]
      const rewardRateState = rewardRates[index]
      const periodFinishState = periodFinishes[index]

      if (
        // these may be undefined if not logged in
        !balanceState?.loading &&
        !earnedAmountState?.loading &&
        // always need these
        totalSupplyState &&
        !totalSupplyState.loading &&
        rewardRateState &&
        !rewardRateState.loading &&
        periodFinishState &&
        !periodFinishState.loading
      ) {
        if (
          balanceState?.error ||
          earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error ||
          periodFinishState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        // get the MP token
        const tokens = info[index].tokens
        const dummyPair = new Pair(new TokenAmount(tokens[0], '0'), new TokenAmount(tokens[1], '0'))

        // check for account, if no account set to 0

        const stakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
        const totalStakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(totalSupplyState.result?.[0]))
        const totalRewardRate = new TokenAmount(gil, JSBI.BigInt(rewardRateState.result?.[0]))

        const getHypotheticalRewardRate = (
          stakedAmount: TokenAmount,
          totalStakedAmount: TokenAmount,
          totalRewardRate: TokenAmount
        ): TokenAmount => {
          return new TokenAmount(
            gil,
            JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
              ? JSBI.divide(JSBI.multiply(totalRewardRate.raw, stakedAmount.raw), totalStakedAmount.raw)
              : JSBI.BigInt(0)
          )
        }

        const individualRewardRate = getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRate)

        const periodFinishMs = periodFinishState.result?.[0]?.mul(1000)?.toNumber()

        memo.push({
          isEnabled: false,
          stakingRewardAddress: rewardsAddress,
          tokens: info[index].tokens,
          periodFinish: periodFinishMs > 0 ? new Date(periodFinishMs) : undefined,
          earnedAmount: new TokenAmount(gil, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
          rewardRate: individualRewardRate,
          totalRewardRate: totalRewardRate,
          stakedAmount: stakedAmount,
          totalStakedAmount: totalStakedAmount,
          getHypotheticalRewardRate
        })
      }
      return memo
    }, [])
  }, [balances, chainId, earnedAmounts, info, periodFinishes, rewardRates, rewardsAddresses, totalSupplies, gil])
}

export function useTotalUniEarned(): TokenAmount | undefined {
  const { chainId } = useActiveWeb3React()
  const gil = chainId ? GIL[chainId] : undefined
  const stakingInfos = useStakingInfo()

  return useMemo(() => {
    if (!gil) return undefined
    return (
      stakingInfos?.reduce(
        (accumulator, stakingInfo) => accumulator.add(stakingInfo.earnedAmount),
        new TokenAmount(gil, '0')
      ) ?? new TokenAmount(gil, '0')
    )
  }, [stakingInfos, gil])
}

// based on typed value
export function useDerivedStakeInfo(
  typedValue: string,
  stakingToken: Token,
  userLiquidityUnstaked: TokenAmount | undefined
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingToken)

  const parsedAmount =
    parsedInput && userLiquidityUnstaked && JSBI.lessThanOrEqual(parsedInput.raw, userLiquidityUnstaked.raw)
      ? parsedInput
      : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}

// based on typed value
export function useDerivedUnstakeInfo(
  typedValue: string,
  stakingAmount: TokenAmount
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingAmount.token)

  const parsedAmount = parsedInput && JSBI.lessThanOrEqual(parsedInput.raw, stakingAmount.raw) ? parsedInput : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}
