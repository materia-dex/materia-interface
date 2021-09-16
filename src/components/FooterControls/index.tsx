import React from 'react'

import {
  FooterControls,
  FooterElement,
  FooterElementClock,
  FooterElementWrap,
} from '../../theme'
import Menu from '../Menu'
import Settings from '../Settings'



export default function Footer() {
  

  return (
    <FooterControls >
      <FooterElementClock>

      </FooterElementClock>
      <FooterElement>
        
      </FooterElement>
      <FooterElementWrap>
        <Settings/>
        <Menu/>
      </FooterElementWrap>
    </FooterControls>
  )
}
