import React, { useRef, useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { BookOpen, Code, Info, MessageCircle, PieChart } from 'react-feather'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'
import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'

import { 
  IconButton,
  StyledMenu,
  MenuFlyout,
  MenuItem
} from '../../theme'



const CODE_LINK = 'https://github.com/materia-dex/materia-interface'

export default function Menu() {

  const theme = useContext(ThemeContext)
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <StyledMenu ref={node as any} className={theme.name}>
      <IconButton onClick={toggle} className={`menuIcon ${theme.name}`}>
        <MenuIcon className={`footer-icon ${theme.name}`} />
      </IconButton>
      <div className={ `custom-label ${theme.name}` } onClick={toggle}></div>
      {open && (
        <MenuFlyout className={theme.name}>
          <MenuItem id="link" href="https://materiadex.com/" className={theme.name}>
            <Info/>
            About
          </MenuItem>
          <MenuItem id="link" href="https://materiadex.com/docs/" className={theme.name}>
            <BookOpen/>
            Docs
          </MenuItem>
          <MenuItem id="link" href={CODE_LINK} className={theme.name}>
            <Code/>
            Code
          </MenuItem>
          <MenuItem id="link" href="https://discord.gg/jdYMZrv" className={theme.name}>
            <MessageCircle />
            Discord
          </MenuItem>
          <MenuItem id="link" href="https://info.materiadex.com/" className={theme.name}>
            <PieChart/>
            Analytics
          </MenuItem>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
