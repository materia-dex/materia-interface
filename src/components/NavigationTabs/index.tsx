import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Link as HistoryLink } from 'react-router-dom'
import { TabsBar, DynamicGrid } from '../../theme'

import { ArrowLeft } from 'react-feather'
import { RowBetween } from '../Row'
import QuestionHelper from '../QuestionHelper'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.text1};
`

export function FindPoolTabs() {
  const theme = useContext(ThemeContext)
  return (
    <TabsBar className={theme.name}>
      <DynamicGrid className={theme.name} columns={3}>
        <div className="text-left">
          <HistoryLink to="/pool" className="navigation-link">
            <StyledArrowLeft />
          </HistoryLink>
        </div>
        <div className={ `text-center title ${theme.name}` }>Import Pool</div>
        <div className="text-right">
          <QuestionHelper text={"Use this tool to find pairs that don't automatically appear in the interface."} />
        </div>
      </DynamicGrid>
    </TabsBar>
  )
}

export function AddRemoveTabs({ adding, creating }: { adding: boolean; creating: boolean }) {
  const theme = useContext(ThemeContext)  
  return (
    <TabsBar className={theme.name}>
      <DynamicGrid className={theme.name} columns={3}>
        <div className="text-left">
          <HistoryLink to="/pool" className="navigation-link">
            <StyledArrowLeft />
          </HistoryLink>
        </div>
        <div className={ `text-center title text-center-title ${theme.name}` }>{creating ? 'Create a pair' : adding ? 'Add Liquidity' : 'Remove Liquidity'}</div>
        <div className="text-right">
          <QuestionHelper
            text={
              adding
                ? 'When you add liquidity, you are given pool tokens representing your position. These tokens automatically earn fees proportional to your share of the pool, and can be redeemed at any time.'
                : 'Removing pool tokens converts your position back into underlying tokens at the current rate, proportional to your share of the pool. Accrued fees are included in the amounts you receive.'
            }
          />
        </div>
      </DynamicGrid>
    </TabsBar>
  )
}
