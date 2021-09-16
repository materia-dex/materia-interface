import React, { useContext, useRef, useState } from 'react'
import { Settings, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import {
  // useDarkModeManager,
  useExpertModeManager,
  useUserTransactionTTL,
  useUserSlippageTolerance,
  useClassicModeManager
} from '../../state/user/hooks'
import { 
  SecondaryPanelBoxContainer,
  SecondaryPanelBoxContainerExtraDecorator,
  ModalContentWrapper,
  IconButton,
  EvidencedTextParagraph,
  MainOperationButton,
  SettingsFlyout
} from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import Toggle from '../Toggle'
import TransactionSettings from '../TransactionSettings'


const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 16px;
  text-align: left;
`



export default function SettingsTab() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.SETTINGS)
  const toggle = useToggleSettingsMenu()

  const theme = useContext(ThemeContext)
  const [userSlippageTolerance, setUserslippageTolerance] = useUserSlippageTolerance()

  const [ttl, setTtl] = useUserTransactionTTL()

  const [expertMode, toggleExpertMode] = useExpertModeManager()

  const [classicMode, toggleClassicMode] = useClassicModeManager()

  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)

  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <StyledMenu ref={node as any}>
      <Modal isOpen={showConfirmation} onDismiss={() => setShowConfirmation(false)} maxHeight={100}>
        <ModalContentWrapper>
          <div>
            <h6 className="with-content-divisor">Are you sure?</h6>
            <IconButton className={ `modal-close-icon ${theme.name}` } onClick={() => setShowConfirmation(false)}>
              <X/>
            </IconButton>
            <AutoColumn gap="lg" style={{ padding: '0 2rem' }}>
              <EvidencedTextParagraph className={theme.name}>
                Expert mode turns off the confirm transaction prompt and allows high slippage trades that often result
                in bad rates and lost funds.
                <br/><br/>
                ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING.
              </EvidencedTextParagraph>
              <MainOperationButton 
                  id="confirm-expert-mode"
                  className={ `use-custom-properties expert-mode ${theme.name}` } 
                  onClick={() => {
                  if (window.prompt(`Please type the word "materia" to enable expert mode.`) === 'materia') {
                    toggleExpertMode()
                    setShowConfirmation(false)
                  }
                }}>Turn On Expert Mode</MainOperationButton>
            </AutoColumn>
          </div>
        </ModalContentWrapper>
      </Modal>
      <IconButton className={`${theme.name} mr10`} onClick={toggle} id="open-settings-dialog-button">
        <Settings className={`footer-icon ${theme.name}`} />
      </IconButton>
      <div className={ `custom-label ${theme.name}` } onClick={toggle}>Settings</div>
      {open && (
        <SecondaryPanelBoxContainer className={ `settings-menu-panel ${theme.name}` }>
          <SettingsFlyout className={theme.name}> 
            <AutoColumn gap="md" style={{ padding: '10px' }}>
              <div className={ `sectionHeader ${theme.name}` }>Transaction Settings</div>
              <TransactionSettings rawSlippage={userSlippageTolerance} setRawSlippage={setUserslippageTolerance} deadline={ttl} setDeadline={setTtl} />
              <div className={ `sectionHeader ${theme.name}` }>Interface Settings</div>
              <RowBetween>
                <RowFixed>
                  <div className={ `sectionOption ${theme.name}` }>Toggle Expert Mode</div>
                  <QuestionHelper text="Bypasses confirmation modals and allows high slippage trades. Use at your own risk." />
                </RowFixed>
                <Toggle
                  id="toggle-expert-mode-button"
                  isActive={expertMode}
                  toggle={ expertMode ? () => { toggleExpertMode(); setShowConfirmation(false); } : () => { toggle(); setShowConfirmation(true); } } />
              </RowBetween>
            </AutoColumn>
            </SettingsFlyout>
        </SecondaryPanelBoxContainer>
      )}
    </StyledMenu>
  )
}
