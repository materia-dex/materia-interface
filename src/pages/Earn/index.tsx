import React, { useContext, useState } from 'react'
import { ThemeContext } from 'styled-components'
import { StakingSeason, STAKING_REWARDS_INFO, STAKING_REWARDS_INFO_SEASON_TWO, useStakingInfo, useStakingInfoSecondSeason } from '../../state/stake/hooks'
import PoolCard from '../../components/earn/PoolCard'
import { Countdown } from './Countdown'
import Loader from '../../components/Loader'
import { useActiveWeb3React } from '../../hooks'
import AppBody from '../AppBody'
import {
  PageGridContainer,
  SimpleTextParagraph,
  PageItemsContainer,
  TabsBar,
  PageContentContainer,
  DynamicGrid,
  ExternalLink,
  PoolSection,
  ActionButton,
  SectionTitle,
  SectionContent
} from '../../theme'

export default function Earn() {
  const { chainId } = useActiveWeb3React()
  const stakingInfos = useStakingInfo()
  const stakingRewardsExist = Boolean(typeof chainId === 'number' && (STAKING_REWARDS_INFO[chainId]?.length ?? 0) > 0)

  const stakingInfoSeasonTwo = useStakingInfoSecondSeason()
  const stakingRewardsExistSeasonTwo = Boolean(typeof chainId === 'number' && (STAKING_REWARDS_INFO_SEASON_TWO[chainId]?.length ?? 0) > 0)

  const theme = useContext(ThemeContext)
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      <AppBody>
        <PageGridContainer className="liquidity-mining">
          <div className={`left-column liquidity-mining ${theme.name}`}>
            <div className="collapsable-title">
              <div className="pull-right">
                <ActionButton className={theme.name} onClick={() => { setShowMore(!showMore) }}>
                  {showMore ? ('Hide Rewards Info') : ('View Rewards Info')}
                </ActionButton>
              </div>
              <div className="clear-fix"></div>
            </div>
            <div className={`collapsable-item ${showMore ? 'opened' : 'collapsed'}`}>
              <SimpleTextParagraph className={`p0 mt0 mb0 ${theme.name}`}>
                <SectionTitle className={`mt10 ${theme.name}`}>Materia liquidity mining</SectionTitle>
                <SectionContent>Deposit your Liquidity Provider tokens to receive GIL, the Materia DFO protocol governance token.
                    <ExternalLink href="https://www.dfohub.com/" target="_blank" className="yellow"> Read more about DFO</ExternalLink>
                </SectionContent>
              </SimpleTextParagraph>
            </div>
          </div>
          <PageItemsContainer className={theme.name}>
            <TabsBar className={theme.name}>
              <DynamicGrid className={theme.name} columns={2}>
                <div className="text-left">
                  <Countdown exactEnd={stakingInfoSeasonTwo?.[0]?.periodFinish} />
                </div>
              </DynamicGrid>
            </TabsBar>
            <div className="clear-fix">
              <PageContentContainer className={`one ${theme.name}`}>
                <SectionTitle className={` ${theme.name}`}>Season two</SectionTitle>

                <PoolSection>
                  {stakingRewardsExistSeasonTwo && stakingInfoSeasonTwo?.length === 0 ? (
                    <Loader style={{ margin: 'auto' }} />
                  ) : !stakingRewardsExistSeasonTwo ? (
                    'No active rewards'
                  ) : (
                    stakingInfoSeasonTwo?.map(stakingInfo => {
                      // need to sort by added liquidity here
                      return <PoolCard key={stakingInfo.stakingRewardAddress} stakingInfo={stakingInfo} stakingSeason={StakingSeason.SEASON_TWO}/>
                    })
                  )}
                </PoolSection>

                <SectionTitle className={`mt10 ${theme.name}`}>First Season</SectionTitle>
                <PoolSection>
                  {stakingRewardsExist && stakingInfos?.length === 0 ? (
                    <Loader style={{ margin: 'auto' }} />
                  ) : !stakingRewardsExist ? (
                    'No active rewards'
                  ) : (
                    stakingInfos?.map(stakingInfo => {
                      // need to sort by added liquidity here
                      return <PoolCard key={stakingInfo.stakingRewardAddress} stakingInfo={stakingInfo} stakingSeason={StakingSeason.SEASON_ONE}/>
                    })
                  )}
                </PoolSection>
              </PageContentContainer>
            </div>
          </PageItemsContainer>
        </PageGridContainer>
      </AppBody>
    </>
  )
}
