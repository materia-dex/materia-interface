import React, { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { darken } from 'polished'

import styled, { ThemeContext } from 'styled-components'

import Logo from '../../assets/images/materia-logo-light.png'
import LogoDark from '../../assets/images/materia-logo.png'
import { useClassicModeManager, useDarkModeManager } from '../../state/user/hooks'
import { AccountElement, CustomActionButton, ExternalLink, HeaderWrapper, HideExtraSmall, HideSmall, IconButton } from '../../theme'

import Row, { RowFixed } from '../Row'
import { MATERIA_DFO_ADDRESS } from '../../constants'
import Web3Status from '../Web3Status'
import { Moon, Sun } from 'react-feather'
import { TransparentCard } from '../Card'
import { useActiveWeb3React } from '../../hooks'
import { useETHBalances } from '../../state/wallet/hooks'
import { useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/actions'
import { ChainId } from '@materia-dex/sdk'

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  font-weight: 900;
  font-size: 15px;
  color: ${({ theme }) => theme.text1};
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.0);
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    padding: 0 1rem;
    width: calc(100%);
    position: relative;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
        padding: 0.5rem 1rem;
  `}
`


const HeaderRow = styled(RowFixed)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
   width: 100%;
  `};
`

const HeaderLinks = styled(Row)`
  justify-content: center;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem 0 1rem 1rem;
    justify-content: flex-end;
`};
`

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const MateriaIcon = styled.div`
  transition: transform 0.3s ease;
  :hover {
    // transform: rotate(-5deg);
  }
`

const StyledButton = styled.button`
  border: none;
  background-color: rgba(0, 0, 0, 0);
  color: ${({ theme }) => theme.text1};
  :focus {
    outline: none;
  }
  display: flex;
  align-items: center;
  justify-content: center;
  :hover {
    cursor: pointer;
  }
`

const NetworkCard = styled(TransparentCard)`
  border-radius: 12px;
  padding: 8px 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
  /* addresses safari's lack of support for "gap" */
  & > *:not(:first-child) {
    margin-left: 8px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: center;
  `};
`

const NETWORK_LABELS: { [chainId in ChainId]?: string } = {
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.KOVAN]: 'Kovan'
}

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
  width: fit-content;
  margin: 0 12px;

  &.${activeClassName} {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  :hover,
  :focus { color: ${({ theme }) => darken(0.1, theme.text1)}; }
`

const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName
}) <{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  width: fit-content;
  margin: 0 12px;

  &.${activeClassName} {
    font-weight: 900;
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      display: none;
`}
`

export default function Header() {
  const [isDark] = useDarkModeManager()
  const [isClassic] = useClassicModeManager()
  const { account, chainId } = useActiveWeb3React()
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const theme = useContext(ThemeContext)
  const openClaimModal = useToggleModal(ApplicationModal.ADDRESS_CLAIM)

  return (
    <HeaderFrame>
      <HeaderRow>
        <Title href=".">
          <MateriaIcon>
            <img width={'100px'} src={isDark || isClassic ? LogoDark : Logo} alt="logo" />
          </MateriaIcon>
        </Title>
        <HeaderLinks>
          <StyledNavLink
            id={`swap-nav-link`}
            to={'/swap'}
            isActive={(match, { pathname }) =>
              Boolean(match) ||
              pathname.startsWith('/swap') ||
              pathname.startsWith('/batch-swap') ||
              pathname.startsWith('/uni-batch-swap') ||
              pathname.startsWith('/sushi-batch-swap')
            }>
            Swap
          </StyledNavLink>
          <StyledNavLink
            id={`pool-nav-link`}
            to={'/add'}
            isActive={(match, { pathname }) =>
              Boolean(match) ||
              pathname.startsWith('/add') ||
              pathname.startsWith('/remove') ||
              pathname.startsWith('/create') ||
              pathname.startsWith('/find')
            }
          >
            Pool
          </StyledNavLink>
          <StyledNavLink id={`stake-nav-link`} to={'/lm'}>
            LM
          </StyledNavLink>
          <StyledExternalLink id={`stake-nav-link`} href={'https://dapp.dfohub.com/?addr=' + MATERIA_DFO_ADDRESS}>
            Governance <span style={{ fontSize: '11px' }}>↗</span>
          </StyledExternalLink>
          <StyledExternalLink id={`stake-nav-link`} href={'https://ethitem.com'}>
            EthItem <span style={{ fontSize: '11px' }}>↗</span>
          </StyledExternalLink>
        </HeaderLinks>
      </HeaderRow>
      <HeaderControls>
        <NetworkCard />
        <HeaderElement>
          <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
            {account && userEthBalance ? (
              <HideExtraSmall style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem">
                {userEthBalance?.toSignificant(4)} ETH
              </HideExtraSmall>
            ) : null}
            <Web3Status />
          </AccountElement>
          <HideSmall>
            {chainId && NETWORK_LABELS[chainId] && (
              <NetworkCard title={NETWORK_LABELS[chainId]}>{NETWORK_LABELS[chainId]}</NetworkCard>
            )}
          </HideSmall>
          {account && (
            <CustomActionButton className={`claim-footer full-width ${theme.name}`} onClick={openClaimModal}>Claim GIL</CustomActionButton>
          )}
        </HeaderElement>
        <HeaderElement>
          <IconButton className={`theme-icon ${theme.name}`} onClick={toggleDarkMode}>
            {darkMode ? <Sun className={`footer-icon ${theme.name}`} /> : <Moon className={`footer-icon ${theme.name}`} />}
          </IconButton>
        </HeaderElement>
      </HeaderControls>
    </HeaderFrame>
  )
}
