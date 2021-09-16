import React, { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import styled, {
  ThemeProvider as StyledComponentsThemeProvider,
  createGlobalStyle,
  css,
  DefaultTheme
} from 'styled-components'
import { animated } from 'react-spring'
import { useIsClassicMode, useIsDarkMode } from '../state/user/hooks'
import { Text, TextProps, Button } from 'rebass'
import { Box } from 'rebass/styled-components'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import { AutoColumn } from '../components/Column'
import { RowBetween } from '../components/Row'
import Loader from '../components/Loader'
import { Colors, DynamicGridColumnsDefinition } from './styled'
import { images } from './images'
import DavidFensTff from './fonts/DavidFens/DavidFens.ttf'
import DavidFensWoff from './fonts/DavidFens/DavidFens.woff'
import DavidFensWoff2 from './fonts/DavidFens/DavidFens.woff2'

import CircularStdWoff2 from './fonts/CircularStd/0dd92fa15d777f537028.woff2'
import CircularStdWoff from './fonts/CircularStd/4af43345ede3fd952823.woff'

import CircularStdBlackWoff2 from './fonts/CircularStd/9eac4707a63fe42da7d6.woff2'
import CircularStdBlackWoff from './fonts/CircularStd/fb3a34fc1c30b5120300.woff'

import { ExternalLink } from './components'
export * from './components'

const MEDIA_WIDTHS = {
  upToExtraSmall: 500,
  upToSmall: 720,
  upToMedium: 1050,
  upToLarge: 1280
}

const mediaWidthTemplates: { [width in keyof typeof MEDIA_WIDTHS]: typeof css } = Object.keys(MEDIA_WIDTHS).reduce(
  (accumulator, size) => {
    ; (accumulator as any)[size] = (a: any, b: any, c: any) => css`
      @media (max-width: ${(MEDIA_WIDTHS as any)[size]}px) {
        ${css(a, b, c)}
      }
    `
    return accumulator
  },
  {}
) as any

const hexToRGB = (hexColor: string, alpha: number = 1) => {
  var parts = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor)
  var result = parts
    ? {
      r: parseInt(parts[1], 16),
      g: parseInt(parts[2], 16),
      b: parseInt(parts[3], 16)
    }
    : null

  return !result
    ? colors(false, false).black
    : 'rgba(' + result.r + ', ' + result.g + ', ' + result.b + ', ' + alpha.toString() + ')'
}

const gridColumsWidth = (columns: number = 1, columnsDefinitions?: DynamicGridColumnsDefinition[]) => {
  var value = columns > 1 ? Math.round(100 / columns) : 100
  var result = []

  if (columnsDefinitions) {
    var definedConstraintValue = 0
    columns = columns > columnsDefinitions.length ? columns - columnsDefinitions.length : 0
    columnsDefinitions.map(item => {
      definedConstraintValue += item.value
    })
    value = columns > 1 ? Math.round((100 - definedConstraintValue) / columns) : 100 - definedConstraintValue

    for (var i = 1; i <= columns; i++) {
      result.push(value.toString() + '%')
    }

    for (var i = 0; i < columnsDefinitions.length; i++) {
      result[columnsDefinitions[i].location - 1] = columnsDefinitions[i].value.toString() + '%'
    }
  } else {
    for (var i = 1; i <= columns; i++) {
      result.push(value.toString() + '%')
    }
  }

  return result.join(' ')
}

export function colors(darkMode: boolean, classicMode: boolean): Colors {
  return {
    // base
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    placeholderColor: classicMode ? '#FFFFFF' : darkMode ? '#FFFFFF' : '#6C7284',

    azure1: '#95e1ff',
    azure2: '#23bee5',
    azure3: '#2d72e9',
    azure4: '#126699',
    azure5: '#a8d7fe',
    azure6: '#a5fcf6',
    azure7: '#45ccfc',
    azure8: '#043d80',
    azure9: '#b7e9f6',
    blue1: '#1e98dc',
    blue2: '#022b63',
    blue3: '#082751',
    blue4: '#081f3f',
    blue5: '#00029a',
    blue6: '#00013a',
    grey1: '#5e6873',
    grey2: '#C3C5CB',
    grey3: '#333333',
    grey4: '#1a1a1a',
    yellowGreen: '#878e13',
    yellowLight: '#ffffbe',
    red1: '#FF6871',
    red2: '#F82D3A',
    red3: '#fcdfe1',
    green1: '#27AE60',
    greenEthItem: '#3cfdb3',
    yellow1: '#f7c400',
    yellow2: '#F3841E',
    grey: '#999999',
    violet1: '#4138bc',
    violet2: '#a5a5c5',
    violet3: '#ccccff',
    violet4: '#80a9f7',
    violet5: '#e8e8fc',
    violet6: '#700040',
    violet7: '#660884',

    // text
    text1: classicMode ? '#FFFFFF' : darkMode ? '#FFFFFF' : '#000000',
    text2: classicMode ? '#C3C5CB' : darkMode ? '#C3C5CB' : '#565A69',
    text3: classicMode ? '#6C7284' : darkMode ? '#6C7284' : '#040405',
    text4: classicMode ? '#565A69' : darkMode ? '#565A69' : '#C3C5CB',
    text5: classicMode ? '#2C2F36' : darkMode ? '#2C2F36' : '#EDEEF2',
    text6: classicMode ? '#c4c8d7' : darkMode ? '#c4c8d7' : '#c4c8d7',

    // backgrounds / greys
    bg1: classicMode ? '#212429' : darkMode ? '#212429' : '#FFFFFF',
    bg2: classicMode ? '#001835' : darkMode ? '#000000' : '#FFFFFF',
    bg3: classicMode ? '#40444F' : darkMode ? '#40444F' : '#EDEEF2',
    bg4: classicMode ? '#565A69' : darkMode ? '#565A69' : '#CED0D9',
    bg5: classicMode ? '#6C7284' : darkMode ? '#6C7284' : '#888D9B',
    bg6: classicMode ? '#1a1a1a' : darkMode ? '#1a1a1a' : '#1a1a1a',
    bg7: classicMode ? '#002852' : darkMode ? '#002852' : '#002852',
    bg8: classicMode ? 'rgb(0, 0, 0, 0.5)' : darkMode ? 'rgb(0, 0, 0, 0.8)' : 'rgb(255, 255, 255, 0.5)',

    //specialty colors
    modalBG: classicMode ? 'rgba(0,0,0,.425)' : darkMode ? 'rgba(0,0,0,.425)' : 'rgba(0,0,0,0.3)',
    advancedBG: classicMode ? 'rgba(0,0,0,0.1)' : darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(239,241,244)',

    //border
    border1: classicMode ? '#1e9de3' : darkMode ? '#1e9de3' : '#9cd0f5',

    //primary colors
    primary1: classicMode ? '#2172E5' : darkMode ? '#2172E5' : '#ff007a',
    primary2: classicMode ? '#3680E7' : darkMode ? '#3680E7' : '#FF8CC3',
    primary3: classicMode ? '#4D8FEA' : darkMode ? '#4D8FEA' : '#FF99C9',
    primary4: classicMode ? '#376bad70' : darkMode ? '#376bad70' : '#F6DDE8',
    primary5: classicMode ? '#153d6f70' : darkMode ? '#153d6f70' : '#FDEAF1',

    // color text
    primaryText1: classicMode ? '#6da8ff' : darkMode ? '#6da8ff' : '#ff007a',

    // secondary colors
    secondary1: classicMode ? '#2172E5' : darkMode ? '#2172E5' : '#ff007a',
    secondary2: classicMode ? '#17000b26' : darkMode ? '#17000b26' : '#F6DDE8',
    secondary3: classicMode ? '#17000b26' : darkMode ? '#17000b26' : '#FDEAF1',

    // custom
    buttonMateriaPrimaryBackgroundFirstColor: classicMode
      ? 'rgba(1, 0, 6, 0.8)'
      : darkMode
        ? 'rgba(1, 0, 6, 0.8)'
        : 'rgba(1, 0, 6, 0.8)',
    buttonMateriaPrimaryBackgroundSecondColor: classicMode
      ? 'rgba(0, 23, 67, 0.5)'
      : darkMode
        ? 'rgba(0, 23, 67, 0.5)'
        : 'rgba(0, 23, 67, 0.5)',
    buttonMateriaPrimaryBackgroundHoverFirstColor: classicMode
      ? 'rgba(28, 155, 224, 0.8)'
      : darkMode
        ? 'rgba(28, 155, 224, 0.8)'
        : 'rgba(28, 155, 224, 0.8)',
    buttonMateriaPrimaryBackgroundHoverSecondColor: classicMode
      ? 'rgba(28, 155, 224, 0.8)'
      : darkMode
        ? 'rgba(28, 155, 224, 0.8)'
        : 'rgba(28, 155, 224, 0.8)',
    buttonMateriaPrimaryBorderColor: classicMode ? '#054fa4' : darkMode ? '#054fa4' : '#054fa4',
    buttonMateriaPrimaryHoverBorderColor: classicMode ? '#26aff3' : darkMode ? '#26aff3' : '#26aff3',
    buttonMateriaPrimaryTextColor: classicMode ? '#ffffff' : darkMode ? '#ffffff' : '#ffffff',
    buttonMateriaErrorBackgroundFirstColor: classicMode
      ? 'rgba(251, 62, 73, 0.8)'
      : darkMode
        ? 'rgba(251, 62, 73, 0.8)'
        : 'rgba(251, 62, 73, 0.8)',
    buttonMateriaErrorBackgroundSecondColor: classicMode
      ? 'rgba(226, 9, 22, 0.8)'
      : darkMode
        ? 'rgba(226, 9, 22, 0.8)'
        : 'rgba(226, 9, 22, 0.8)',
    buttonMateriaErrorBackgroundHoverFirstColor: classicMode
      ? 'rgba(247, 97, 106, 0.8)'
      : darkMode
        ? 'rgba(247, 97, 106, 0.8)'
        : 'rgba(247, 97, 106, 0.8)',
    buttonMateriaErrorBackgroundHoverSecondColor: classicMode
      ? 'rgba(247, 44, 56, 0.8)'
      : darkMode
        ? 'rgba(247, 44, 56, 0.8)'
        : 'rgba(247, 44, 56, 0.8)',
    buttonMateriaErrorBorderColor: classicMode ? '#e43843' : darkMode ? '#e43843' : '#e43843',
    buttonMateriaErrorHoverBorderColor: classicMode ? '#f9c4c7' : darkMode ? '#f9c4c7' : '#f9c4c7',

    // other

    //blue1: '#2172E5',
    //blue2: '#1671BB',
    cyan1: '#2f9ab8',
    cyan2: '#1992d3'

    // dont wanna forget these blue yet
    // blue4: darkMode ? '#153d6f70' : '#C4D9F8',
    // blue5: darkMode ? '#153d6f70' : '#EBF4FF',

    //adatpters
  }
}

export function theme(darkMode: boolean, classicMode: boolean): DefaultTheme {
  return {
    ...colors(darkMode, classicMode),

    name: classicMode ? 'classic' : darkMode ? 'dark' : 'light',

    grids: { sm: 8, md: 12, lg: 24 },

    //shadows
    shadow1: darkMode ? '#000' : '#2F80ED',

    // media queries
    mediaWidth: mediaWidthTemplates,

    // css snippets
    flexColumnNoWrap: css`
      display: flex;
      flex-flow: column nowrap;
    `,
    flexRowNoWrap: css`
      display: flex;
      flex-flow: row nowrap;
    `,

    styledBoxBorder: classicMode
      ? css`
          border: 0px;
        `
      : darkMode
        ? css`
          border: 1px solid #1e9de3;
        `
        : css`
          border: 1px solid #9cd0f5;
        `,

    backgroundContainer: classicMode
      ? css`
          border: solid 1px #424542;
          border-radius: 1rem;
          box-shadow: 1px 1px #e7dfe7, -1px -1px #e7dfe7, 1px -1px #e7dfe7, -1px 1px #e7dfe7, 0 -2px #9c9a9c,
            -2px 0 #7b757b, 0 2px #424542;
          background: #04009d;
          background: -moz-linear-gradient(top, #04009d 0%, #06004d 100%);
          background: -webkit-gradient(
            linear,
            left top,
            left bottom,
            color-stop(0%, #04009d),
            color-stop(100%, #06004d)
          );
          background: -webkit-linear-gradient(top, #04009d 0%, #06004d 100%);
          background: -o-linear-gradient(top, #04009d 0%, #06004d 100%);
          background: -ms-linear-gradient(top, #04009d 0%, #06004d 100%);
          background: linear-gradient(to bottom, #04009d 0%, #06004d 100%);
          filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#04009d', endColorstr='#06004d',GradientType=0 );
        `
      : darkMode
        ? css`
          background: linear-gradient(180deg, rgba(35, 102, 180, 0.8), rgba(14, 22, 42, 0.4));
        `
        : css`
          background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 100%);
        `,

    backgroundContainer2: classicMode
      ? css`
          background: linear-gradient(180deg, rgba(0, 27, 49, 0.5) 0%, rgba(0, 27, 49, 0.5) 100%);
        `
      : darkMode
        ? css`
          background: linear-gradient(90deg, rgba(0, 27, 49, 0.3) 0%, rgba(0, 27, 49, 0.5) 100%);
        `
        : css`
          background: linear-gradient(180deg, rgba(211, 221, 250) 0%, rgba(211, 221, 250) 100%);
        `,
    backgroundContainer3: classicMode
      ? css`
          background: linear-gradient(180deg, rgba(0, 77, 161, 1) 0%, rgba(5, 30, 64, 1) 100%);
        `
      : darkMode
        ? css`
          background: linear-gradient(180deg, rgba(0, 77, 161, 1) 0%, rgba(5, 30, 64, 1) 100%);
        `
        : css`
          background: linear-gradient(180deg, rgba(239, 241, 244) 0%, rgba(239, 241, 244) 100%);
        `,
    tokenBackground: classicMode
      ? 'url(' + images.token.classic + ') no-repeat'
      : darkMode
        ? 'url(' + images.token.dark + ') no-repeat'
        : 'url(' + images.token.light + ') no-repeat',

    swapButtonBg: darkMode
      ? css`
          background-image: url(${images.swap.dark});
        `
      : css`
          background-image: url(${images.swap.light});
        `,

    swapButtonSrc: darkMode ? images.swap.dark : images.swap.light,

    advancedDetailsFooter: classicMode
      ? css`
          border: solid 1px #424542;
          box-shadow: 1px 1px #e7dfe7, -1px -1px #e7dfe7, 1px -1px #e7dfe7, -1px 1px #e7dfe7, 0 -2px #9c9a9c,
            -2px 0 #7b757b, 0 2px #424542;
          padding: 1rem;
          background: #700e9c;
          background: -moz-linear-gradient(top, #700e9c 0%, #6c1237 100%);
          background: -webkit-gradient(
            linear,
            left top,
            left bottom,
            color-stop(0%, #700e9c),
            color-stop(100%, #6c1237)
          );
          background: -webkit-linear-gradient(top, #700e9c 0%, #6c1237 100%);
          background: -o-linear-gradient(top, #700e9c 0%, #6c1237 100%);
          background: -ms-linear-gradient(top, #700e9c 0%, #6c1237 100%);
          background: linear-gradient(to bottom, #700e9c 0%, #6c1237 100%);
          filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#700e9c', endColorstr='#6c1237',GradientType=0 );
          border-radius: 1rem;
        `
      : css`
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        `,

    utils: {
      hexToRGB: hexToRGB,
      gridColumsWidth: gridColumsWidth
    }
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useIsDarkMode()
  const classicMode = useIsClassicMode()

  const themeObject = useMemo(() => theme(darkMode, classicMode), [darkMode, classicMode])

  return <StyledComponentsThemeProvider theme={themeObject}>{children}</StyledComponentsThemeProvider>
}

const TextWrapper = styled(Text) <{ color: keyof Colors }>`
  color: ${({ color, theme }) => (theme as any)[color]};
`
export const TYPE = {
  main(props: TextProps) {
    return <TextWrapper fontWeight={900} color={'text2'} {...props} />
  },
  link(props: TextProps) {
    return <TextWrapper fontWeight={900} color={'primary1'} {...props} />
  },
  black(props: TextProps) {
    return <TextWrapper fontWeight={900} color={'text1'} {...props} />
  },
  white(props: TextProps) {
    return <TextWrapper fontWeight={900} color={'text1'} {...props} />
  },
  body(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color={'text1'} {...props} />
  },
  largeHeader(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={24} {...props} />
  },
  mediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={900} fontSize={20} {...props} />
  },
  subHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
  small(props: TextProps) {
    return <TextWrapper fontWeight={900} fontSize={11} {...props} />
  },
  blue(props: TextProps) {
    return <TextWrapper fontWeight={900} color={'primary1'} {...props} />
  },
  yellow(props: TextProps) {
    return <TextWrapper fontWeight={900} color={'yellow1'} {...props} />
  },
  darkGray(props: TextProps) {
    return <TextWrapper fontWeight={900} color={'text3'} {...props} />
  },
  gray(props: TextProps) {
    return <TextWrapper fontWeight={900} color={'bg3'} {...props} />
  },
  italic(props: TextProps) {
    return <TextWrapper fontWeight={900} fontSize={12} fontStyle={'italic'} color={'text2'} {...props} />
  },
  error({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={900} color={error ? 'red1' : 'text2'} {...props} />
  }
}

export const FixedGlobalStyle = createGlobalStyle`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
@font-face { font-family: 'DavidFens'; src: url(${DavidFensWoff2}) format('woff2'), url(${DavidFensWoff}) format('woff'), url(${DavidFensTff}) format('truetype'); }
@font-face {
	font-weight: 100;
	font-family: "Circular Std";
	src: 
		local('Circular Std Medium'), 
		url(${CircularStdWoff}) format("woff"), 
		url(${CircularStdWoff2}) format("woff2");
}

@font-face {
	font-weight: 700;
	font-family: "Circular Std";
	src: 
		local('Circular Std Black'), 
		url(${CircularStdBlackWoff}) format("woff"), 
		url(${CircularStdBlackWoff2}) format("woff2");
}

@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
html, body { margin: 0; padding: 0; }
a { color: ${colors(false, false).text2}; }
* { box-sizing: border-box; } 
button { user-select: none; }

html {
  font-size: 1rem;
  font-variant: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;  
}


.wrapASBlock { margin: 5px 0px 5px 0px }
.wrapASBlock div.clearfix { clear: both; }
.wrapASBlock > div { float: left; }
.wrapASBlock > div + div { float: right; }
.wrapASBlock > div:first-child { padding-top: 10px }
`
export const ThemedGlobalStyle = createGlobalStyle`
html {
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg2};
}

.text-secondary {
  --tw-text-opacity: 1;
  color: rgba(127,127,127,var(--tw-text-opacity));
}

html, input, textarea, button { 
  font-family: "Circular Std", Helvetica, Arial, sans-serif, "DM Sans",-apple-system,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif,BlinkMacSystemFont,"Helvetica Neue","Helvetica",sans-serif;
  --primary: #0d0415;
  --text-primary: #bfbfbf;
  --font-sans: "Circular Std", Helvetica, Arial, sans-serif, "DM Sans",-apple-system,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif,BlinkMacSystemFont,"Helvetica Neue","Helvetica",sans-serif;
  --scrollbar-width: 14px; 
};
@supports (font-variation-settings: normal) { 
  html, input, textarea, button { 
    font-family: "Circular Std", Helvetica, Arial, sans-serif, "DM Sans",-apple-system,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif,BlinkMacSystemFont,"Helvetica Neue","Helvetica",sans-serif; 
    --primary: #0d0415;
    --text-primary: #bfbfbf;
    --font-sans: "Circular Std", Helvetica, Arial, sans-serif, "DM Sans",-apple-system,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif,BlinkMacSystemFont,"Helvetica Neue","Helvetica",sans-serif;
    --scrollbar-width: 14px;
  } 
};

.percentage-grid{
  padding: 0 0.75rem;
}

/* galaxy animation */
    .galaxy-header {
        overflow: hidden;
        position: absolute;
        width: 100%;
        height: 100vh;
        -webkit-perspective: 340px;
        perspective: 340px;
        opacity: .4;
    }
 
    .galaxy {
        overflow: hidden;
        position: absolute;
        top: 0;
        z-index: 0;
        width: 100%;
        height: 100%;
        -webkit-perspective: 340px;
        perspective: 340px;
        opacity: .4;
    }
 
    .stars {
        position: absolute;
        top: 50%;
        border-radius: 50%;
        left: 50%;
        width: 2px;
        height: 2px;
        -webkit-box-shadow: -740px 444px #f2f2f2, 157px -59px #cccccc, 36px -3px #cccccc, -857px -439px #cccccc, -1408px 402px #d9d9d9, -235px -149px #d9d9d9, -1074px -305px #cfcfcf, 820px -287px #c4c4c4, -536px 243px #d6d6d6, 954px 377px #fafafa, 136px -179px #ededed, -294px -159px #ededed, 374px 403px #dbdbdb, -803px 4px #dbdbdb, -671px -262px #f7f7f7, -589px 136px #c7c7c7, -1248px -352px #e6e6e6, 459px -209px #f7f7f7, -1012px 318px #cfcfcf, -290px 117px #fafafa, -926px 46px #dbdbdb, 1350px 278px #d6d6d6, 969px -321px #e6e6e6, 380px -371px #e6e6e6, 912px 130px #ededed, -433px -403px #d9d9d9, -469px -46px #c2c2c2, -854px 37px #c9c9c9, 722px 112px #ededed, 1094px -49px #e6e6e6, 1436px -75px #c9c9c9, 897px 476px #cccccc, -262px 413px #cccccc, 806px 210px #c4c4c4, 1215px -71px #cccccc, -425px 156px #d4d4d4, -1338px 444px #e3e3e3, 1214px 174px #c4c4c4, -1133px 226px #d1d1d1, 1221px 352px #e8e8e8, 1385px 69px #e0e0e0, -85px 281px #c7c7c7, -451px 46px #fcfcfc, -1064px -134px #dedede, 1331px -15px #d6d6d6, -1001px 275px #d4d4d4, 522px -6px #cfcfcf, 573px -153px #ebebeb, 1320px -339px #e0e0e0, -591px 180px #fafafa, 779px -178px #c2c2c2, -606px 183px #c7c7c7, -1423px -406px #d4d4d4, 324px -17px #c4c4c4, -1403px -362px #dedede, 1294px 204px #dbdbdb, 648px 77px #c7c7c7, -39px -104px #ebebeb, 157px -88px #f7f7f7, -983px -330px #fcfcfc, -999px 78px #e8e8e8, -1268px -400px #f2f2f2, -438px -77px #d6d6d6, 573px 279px whitesmoke, -117px 252px #f0f0f0, -359px 292px #d6d6d6, 1306px 428px #e6e6e6, 1364px -141px #f2f2f2, -433px -394px #dbdbdb, 1424px -402px #e6e6e6, -403px 418px #ededed, -196px 147px #cccccc, 454px 323px #c9c9c9, -1416px 50px #dbdbdb, 1189px 210px whitesmoke, -615px -323px #e6e6e6, -203px 277px #f2f2f2, 1245px 45px #e6e6e6, 531px -225px #dedede, 737px 151px #dedede, -696px 323px #d6d6d6, 1358px 151px #d6d6d6, 29px 396px whitesmoke, -60px -355px whitesmoke, -445px -355px #f2f2f2, 12px -98px #fafafa, -757px -165px #cfcfcf, 927px 445px #f7f7f7, 278px 98px #ebebeb, -1324px -316px #d4d4d4, -582px -13px #d9d9d9, -1386px 283px #c9c9c9, 83px 109px whitesmoke, 511px -149px #e0e0e0, -581px -109px #d1d1d1, 298px -124px #c2c2c2, 858px -263px #e0e0e0, -1412px 210px #dedede, 327px 472px #dedede, 30px -220px #dbdbdb, 206px 266px #cfcfcf, -835px -428px #c9c9c9, 695px -440px #d1d1d1, -1293px 120px #d1d1d1, -537px 432px #e0e0e0, 374px 171px #e3e3e3, 1221px -358px #d4d4d4, 1028px 460px #ebebeb, 413px 201px #fcfcfc, 284px -428px #cfcfcf, 672px -338px white, 479px -358px #e3e3e3, -1178px -434px #fcfcfc, -1029px 423px #c2c2c2, 255px 116px #fcfcfc, -1065px 323px #f7f7f7, 510px -84px #dbdbdb, -1469px 53px #ededed, -1290px -375px #fafafa, -269px -173px #f0f0f0, -874px 200px #d6d6d6, -1053px 182px #e3e3e3, -137px 280px #dbdbdb, 1408px -429px #dedede, 687px -48px #c7c7c7, -1204px -25px #ededed, -676px -264px #d1d1d1, -1483px -267px #c7c7c7, 501px -252px #e6e6e6, -991px 335px #c4c4c4, -1089px -63px #d1d1d1, 416px -144px #ededed, -895px 320px #cccccc, -1092px -462px #d6d6d6, 935px -477px #d1d1d1, -1192px -438px #c7c7c7, 421px -101px whitesmoke, -1284px -20px #fafafa, 231px -454px #ebebeb, -83px 7px #ededed, 844px -153px #f2f2f2, 95px -372px whitesmoke, 1350px 96px white, 689px 255px #e8e8e8, 448px -59px white, -701px -85px #c7c7c7, -1383px 44px #c7c7c7, 364px -421px #f0f0f0, 442px -284px #e8e8e8, -942px -56px #e8e8e8, -198px 169px #f2f2f2, -912px -120px #e3e3e3, -1479px -67px #d9d9d9, -485px 128px #d4d4d4, -858px 78px #d4d4d4, -7px 175px #f7f7f7, -634px -178px #e0e0e0, 52px -256px #c4c4c4, 855px -72px #f0f0f0, 166px 303px #f7f7f7, 143px -469px #d6d6d6, 178px -283px #ededed, -985px -422px #c7c7c7, 794px -375px #e0e0e0, 751px 276px white, 1443px -199px #cccccc, 454px -417px #f0f0f0, -685px -427px #d1d1d1, 562px -35px #e6e6e6, 24px 124px #cfcfcf, -1394px 445px #c9c9c9, 996px -108px #c2c2c2, -400px 288px #c2c2c2, -1247px -383px #fcfcfc, -275px -143px #e3e3e3, -226px -222px #ebebeb, 665px 212px #c4c4c4, 502px 245px #c7c7c7, -1187px -443px white, -1246px 97px #d4d4d4, -593px -318px #d4d4d4, 1px 81px #ebebeb, 930px 264px #f7f7f7, 664px 141px #f2f2f2, -1301px 135px #cccccc, -573px 340px #d4d4d4, -946px 444px #e6e6e6, -103px -194px #fcfcfc, 796px 171px #d6d6d6, 431px -421px #f7f7f7, 1106px -11px #c2c2c2, -382px -69px #d4d4d4, -55px -461px #e8e8e8, 1248px -360px #d1d1d1, -145px -93px #f7f7f7, 35px 365px #c7c7c7, -219px 209px #e0e0e0, 1407px -429px #d9d9d9, 439px -251px #f7f7f7, 967px 326px #cfcfcf, -883px 257px #c2c2c2, -180px 205px #dbdbdb, -65px 102px #dbdbdb, 150px 229px #c4c4c4, 33px -348px #fafafa, -1339px -413px white, -1352px 262px #c9c9c9, -557px -86px whitesmoke, -232px 279px #f7f7f7, -465px 468px #f2f2f2, -105px 219px #f0f0f0, -1147px -51px #f2f2f2, -1489px -158px #d1d1d1, -878px -384px #dbdbdb, 1104px 234px #d9d9d9, 518px -17px #e0e0e0, -1082px -210px #d6d6d6, -177px 249px #c7c7c7, 456px -108px #dbdbdb, -798px -112px #d9d9d9, 337px 159px #c4c4c4, -1005px 402px #dedede, -1401px 194px #fafafa, 871px 305px whitesmoke, 756px -26px #f0f0f0, 1086px 379px #c4c4c4, 868px 336px #d1d1d1, -533px 59px #e3e3e3, -148px 186px #d6d6d6, -345px 257px #f7f7f7, 441px -116px #c4c4c4, -1162px 340px #d9d9d9, -1069px 431px #f7f7f7, -528px 354px #d9d9d9, 836px 35px whitesmoke, -974px 10px #fcfcfc, -304px -259px #dedede, 254px 47px whitesmoke, 328px 31px #c7c7c7, -1450px 316px #f0f0f0, 386px 459px #cccccc, -1326px 79px #d1d1d1, 673px 114px #cccccc, -9px -99px #c2c2c2, 466px 99px #fcfcfc, 712px 178px #d4d4d4, -981px -386px #d9d9d9, 904px -361px #d6d6d6, 983px 213px #d1d1d1, -287px 220px #ebebeb, 589px -71px #c2c2c2, 1264px 372px #fcfcfc, 659px -441px #ededed, 1377px 112px #f2f2f2, 1344px 477px #cccccc, -1476px -316px #d6d6d6, 354px 69px #ebebeb, -465px -266px #fafafa, -485px 456px #c4c4c4, -54px 146px #cccccc, -210px -330px #d6d6d6, 505px 456px #d4d4d4, 1394px 253px #d4d4d4, -1062px 336px #c2c2c2, 966px 196px #fcfcfc, -1463px -114px #ededed, -1119px 112px #d4d4d4, -952px -23px #cfcfcf, 1025px 279px #e8e8e8, 1464px 162px #fafafa, 327px -122px whitesmoke, -925px -177px whitesmoke, 385px -63px #e0e0e0, 1358px 451px #f2f2f2, 1344px -123px #e6e6e6, -1477px 398px #c2c2c2, 425px -306px #f0f0f0, 90px 445px #fafafa, -1172px -198px white, 345px -24px #c9c9c9, -1285px -283px #ededed, -818px 53px #dedede, 1057px -213px #cccccc, 678px 124px #f0f0f0, 688px 396px #ebebeb, -719px -172px #c4c4c4, -1215px -174px #f0f0f0, -260px 293px white, -1488px -386px #f7f7f7, -1480px 459px white, 1380px 32px #f2f2f2, 253px 328px #d6d6d6, 286px 449px #cfcfcf, -594px 66px white, 97px -69px #cfcfcf, -991px 313px #c2c2c2, -880px -83px white, -86px -192px #c2c2c2, 377px -241px #c4c4c4, -1047px 95px #fcfcfc, -366px 40px #e8e8e8, -414px 439px #f7f7f7, 1056px -404px #c2c2c2, 444px -244px #e8e8e8, -1407px 270px #c7c7c7, -355px -16px #d1d1d1, 1229px -114px white, 694px -416px #d6d6d6, -1309px -174px #ededed, 945px -457px #dbdbdb, -1189px -463px #e6e6e6, -1449px -136px #dedede, 866px 26px #d9d9d9, -80px 219px #f7f7f7, -781px -31px #e6e6e6, 756px 299px #d9d9d9, 1025px 320px #e6e6e6, 291px -281px #ededed, -853px 247px #e0e0e0, 198px 282px #d1d1d1, -505px 445px #ebebeb, 314px 250px #e8e8e8, -566px -338px #f7f7f7, -195px -296px #dedede, 737px -81px #ebebeb, 1430px 277px #f0f0f0, -1117px -59px #d1d1d1, 1422px 233px #e6e6e6, 1236px 301px #ebebeb, 177px 264px #f7f7f7, -957px 142px #cccccc, 1324px 341px #c4c4c4, -999px 463px #e0e0e0, 680px -319px #c2c2c2, 1194px -287px #f7f7f7, -1227px 348px #fafafa, 1351px -388px #f7f7f7, 242px 135px #c2c2c2, -778px 292px #ededed, 40px 22px #c4c4c4, 1395px 192px #fafafa, -300px -309px #c4c4c4, 1167px 152px #dedede, 1438px -277px #d4d4d4, 1103px -44px white, -1179px -301px #c9c9c9, 181px 364px #f0f0f0, 477px 332px #dedede, -1016px 161px #ededed, 1283px 468px #f2f2f2, -880px 17px #d6d6d6;
        box-shadow: -740px 444px #f2f2f2, 157px -59px #cccccc, 36px -3px #cccccc, -857px -439px #cccccc, -1408px 402px #d9d9d9, -235px -149px #d9d9d9, -1074px -305px #cfcfcf, 820px -287px #c4c4c4, -536px 243px #d6d6d6, 954px 377px #fafafa, 136px -179px #ededed, -294px -159px #ededed, 374px 403px #dbdbdb, -803px 4px #dbdbdb, -671px -262px #f7f7f7, -589px 136px #c7c7c7, -1248px -352px #e6e6e6, 459px -209px #f7f7f7, -1012px 318px #cfcfcf, -290px 117px #fafafa, -926px 46px #dbdbdb, 1350px 278px #d6d6d6, 969px -321px #e6e6e6, 380px -371px #e6e6e6, 912px 130px #ededed, -433px -403px #d9d9d9, -469px -46px #c2c2c2, -854px 37px #c9c9c9, 722px 112px #ededed, 1094px -49px #e6e6e6, 1436px -75px #c9c9c9, 897px 476px #cccccc, -262px 413px #cccccc, 806px 210px #c4c4c4, 1215px -71px #cccccc, -425px 156px #d4d4d4, -1338px 444px #e3e3e3, 1214px 174px #c4c4c4, -1133px 226px #d1d1d1, 1221px 352px #e8e8e8, 1385px 69px #e0e0e0, -85px 281px #c7c7c7, -451px 46px #fcfcfc, -1064px -134px #dedede, 1331px -15px #d6d6d6, -1001px 275px #d4d4d4, 522px -6px #cfcfcf, 573px -153px #ebebeb, 1320px -339px #e0e0e0, -591px 180px #fafafa, 779px -178px #c2c2c2, -606px 183px #c7c7c7, -1423px -406px #d4d4d4, 324px -17px #c4c4c4, -1403px -362px #dedede, 1294px 204px #dbdbdb, 648px 77px #c7c7c7, -39px -104px #ebebeb, 157px -88px #f7f7f7, -983px -330px #fcfcfc, -999px 78px #e8e8e8, -1268px -400px #f2f2f2, -438px -77px #d6d6d6, 573px 279px whitesmoke, -117px 252px #f0f0f0, -359px 292px #d6d6d6, 1306px 428px #e6e6e6, 1364px -141px #f2f2f2, -433px -394px #dbdbdb, 1424px -402px #e6e6e6, -403px 418px #ededed, -196px 147px #cccccc, 454px 323px #c9c9c9, -1416px 50px #dbdbdb, 1189px 210px whitesmoke, -615px -323px #e6e6e6, -203px 277px #f2f2f2, 1245px 45px #e6e6e6, 531px -225px #dedede, 737px 151px #dedede, -696px 323px #d6d6d6, 1358px 151px #d6d6d6, 29px 396px whitesmoke, -60px -355px whitesmoke, -445px -355px #f2f2f2, 12px -98px #fafafa, -757px -165px #cfcfcf, 927px 445px #f7f7f7, 278px 98px #ebebeb, -1324px -316px #d4d4d4, -582px -13px #d9d9d9, -1386px 283px #c9c9c9, 83px 109px whitesmoke, 511px -149px #e0e0e0, -581px -109px #d1d1d1, 298px -124px #c2c2c2, 858px -263px #e0e0e0, -1412px 210px #dedede, 327px 472px #dedede, 30px -220px #dbdbdb, 206px 266px #cfcfcf, -835px -428px #c9c9c9, 695px -440px #d1d1d1, -1293px 120px #d1d1d1, -537px 432px #e0e0e0, 374px 171px #e3e3e3, 1221px -358px #d4d4d4, 1028px 460px #ebebeb, 413px 201px #fcfcfc, 284px -428px #cfcfcf, 672px -338px white, 479px -358px #e3e3e3, -1178px -434px #fcfcfc, -1029px 423px #c2c2c2, 255px 116px #fcfcfc, -1065px 323px #f7f7f7, 510px -84px #dbdbdb, -1469px 53px #ededed, -1290px -375px #fafafa, -269px -173px #f0f0f0, -874px 200px #d6d6d6, -1053px 182px #e3e3e3, -137px 280px #dbdbdb, 1408px -429px #dedede, 687px -48px #c7c7c7, -1204px -25px #ededed, -676px -264px #d1d1d1, -1483px -267px #c7c7c7, 501px -252px #e6e6e6, -991px 335px #c4c4c4, -1089px -63px #d1d1d1, 416px -144px #ededed, -895px 320px #cccccc, -1092px -462px #d6d6d6, 935px -477px #d1d1d1, -1192px -438px #c7c7c7, 421px -101px whitesmoke, -1284px -20px #fafafa, 231px -454px #ebebeb, -83px 7px #ededed, 844px -153px #f2f2f2, 95px -372px whitesmoke, 1350px 96px white, 689px 255px #e8e8e8, 448px -59px white, -701px -85px #c7c7c7, -1383px 44px #c7c7c7, 364px -421px #f0f0f0, 442px -284px #e8e8e8, -942px -56px #e8e8e8, -198px 169px #f2f2f2, -912px -120px #e3e3e3, -1479px -67px #d9d9d9, -485px 128px #d4d4d4, -858px 78px #d4d4d4, -7px 175px #f7f7f7, -634px -178px #e0e0e0, 52px -256px #c4c4c4, 855px -72px #f0f0f0, 166px 303px #f7f7f7, 143px -469px #d6d6d6, 178px -283px #ededed, -985px -422px #c7c7c7, 794px -375px #e0e0e0, 751px 276px white, 1443px -199px #cccccc, 454px -417px #f0f0f0, -685px -427px #d1d1d1, 562px -35px #e6e6e6, 24px 124px #cfcfcf, -1394px 445px #c9c9c9, 996px -108px #c2c2c2, -400px 288px #c2c2c2, -1247px -383px #fcfcfc, -275px -143px #e3e3e3, -226px -222px #ebebeb, 665px 212px #c4c4c4, 502px 245px #c7c7c7, -1187px -443px white, -1246px 97px #d4d4d4, -593px -318px #d4d4d4, 1px 81px #ebebeb, 930px 264px #f7f7f7, 664px 141px #f2f2f2, -1301px 135px #cccccc, -573px 340px #d4d4d4, -946px 444px #e6e6e6, -103px -194px #fcfcfc, 796px 171px #d6d6d6, 431px -421px #f7f7f7, 1106px -11px #c2c2c2, -382px -69px #d4d4d4, -55px -461px #e8e8e8, 1248px -360px #d1d1d1, -145px -93px #f7f7f7, 35px 365px #c7c7c7, -219px 209px #e0e0e0, 1407px -429px #d9d9d9, 439px -251px #f7f7f7, 967px 326px #cfcfcf, -883px 257px #c2c2c2, -180px 205px #dbdbdb, -65px 102px #dbdbdb, 150px 229px #c4c4c4, 33px -348px #fafafa, -1339px -413px white, -1352px 262px #c9c9c9, -557px -86px whitesmoke, -232px 279px #f7f7f7, -465px 468px #f2f2f2, -105px 219px #f0f0f0, -1147px -51px #f2f2f2, -1489px -158px #d1d1d1, -878px -384px #dbdbdb, 1104px 234px #d9d9d9, 518px -17px #e0e0e0, -1082px -210px #d6d6d6, -177px 249px #c7c7c7, 456px -108px #dbdbdb, -798px -112px #d9d9d9, 337px 159px #c4c4c4, -1005px 402px #dedede, -1401px 194px #fafafa, 871px 305px whitesmoke, 756px -26px #f0f0f0, 1086px 379px #c4c4c4, 868px 336px #d1d1d1, -533px 59px #e3e3e3, -148px 186px #d6d6d6, -345px 257px #f7f7f7, 441px -116px #c4c4c4, -1162px 340px #d9d9d9, -1069px 431px #f7f7f7, -528px 354px #d9d9d9, 836px 35px whitesmoke, -974px 10px #fcfcfc, -304px -259px #dedede, 254px 47px whitesmoke, 328px 31px #c7c7c7, -1450px 316px #f0f0f0, 386px 459px #cccccc, -1326px 79px #d1d1d1, 673px 114px #cccccc, -9px -99px #c2c2c2, 466px 99px #fcfcfc, 712px 178px #d4d4d4, -981px -386px #d9d9d9, 904px -361px #d6d6d6, 983px 213px #d1d1d1, -287px 220px #ebebeb, 589px -71px #c2c2c2, 1264px 372px #fcfcfc, 659px -441px #ededed, 1377px 112px #f2f2f2, 1344px 477px #cccccc, -1476px -316px #d6d6d6, 354px 69px #ebebeb, -465px -266px #fafafa, -485px 456px #c4c4c4, -54px 146px #cccccc, -210px -330px #d6d6d6, 505px 456px #d4d4d4, 1394px 253px #d4d4d4, -1062px 336px #c2c2c2, 966px 196px #fcfcfc, -1463px -114px #ededed, -1119px 112px #d4d4d4, -952px -23px #cfcfcf, 1025px 279px #e8e8e8, 1464px 162px #fafafa, 327px -122px whitesmoke, -925px -177px whitesmoke, 385px -63px #e0e0e0, 1358px 451px #f2f2f2, 1344px -123px #e6e6e6, -1477px 398px #c2c2c2, 425px -306px #f0f0f0, 90px 445px #fafafa, -1172px -198px white, 345px -24px #c9c9c9, -1285px -283px #ededed, -818px 53px #dedede, 1057px -213px #cccccc, 678px 124px #f0f0f0, 688px 396px #ebebeb, -719px -172px #c4c4c4, -1215px -174px #f0f0f0, -260px 293px white, -1488px -386px #f7f7f7, -1480px 459px white, 1380px 32px #f2f2f2, 253px 328px #d6d6d6, 286px 449px #cfcfcf, -594px 66px white, 97px -69px #cfcfcf, -991px 313px #c2c2c2, -880px -83px white, -86px -192px #c2c2c2, 377px -241px #c4c4c4, -1047px 95px #fcfcfc, -366px 40px #e8e8e8, -414px 439px #f7f7f7, 1056px -404px #c2c2c2, 444px -244px #e8e8e8, -1407px 270px #c7c7c7, -355px -16px #d1d1d1, 1229px -114px white, 694px -416px #d6d6d6, -1309px -174px #ededed, 945px -457px #dbdbdb, -1189px -463px #e6e6e6, -1449px -136px #dedede, 866px 26px #d9d9d9, -80px 219px #f7f7f7, -781px -31px #e6e6e6, 756px 299px #d9d9d9, 1025px 320px #e6e6e6, 291px -281px #ededed, -853px 247px #e0e0e0, 198px 282px #d1d1d1, -505px 445px #ebebeb, 314px 250px #e8e8e8, -566px -338px #f7f7f7, -195px -296px #dedede, 737px -81px #ebebeb, 1430px 277px #f0f0f0, -1117px -59px #d1d1d1, 1422px 233px #e6e6e6, 1236px 301px #ebebeb, 177px 264px #f7f7f7, -957px 142px #cccccc, 1324px 341px #c4c4c4, -999px 463px #e0e0e0, 680px -319px #c2c2c2, 1194px -287px #f7f7f7, -1227px 348px #fafafa, 1351px -388px #f7f7f7, 242px 135px #c2c2c2, -778px 292px #ededed, 40px 22px #c4c4c4, 1395px 192px #fafafa, -300px -309px #c4c4c4, 1167px 152px #dedede, 1438px -277px #d4d4d4, 1103px -44px white, -1179px -301px #c9c9c9, 181px 364px #f0f0f0, 477px 332px #dedede, -1016px 161px #ededed, 1283px 468px #f2f2f2, -880px 17px #d6d6d6;
        -webkit-animation: zooms 10s linear infinite;
        animation: zooms 10s linear infinite;
        -webkit-transform-style: preserve-3d;
        transform-style: preserve-3d;
    }
 
    .stars:before,
    .stars:after {
        content: "";
        position: absolute;
        width: inherit;
        height: inherit;
        -webkit-box-shadow: inherit;
        box-shadow: inherit;
    }
 
    .stars:before {
        -webkit-transform: translateZ(-300px);
        transform: translateZ(-300px);
        -webkit-animation: hideme1 10s linear infinite;
        animation: hideme1 15s linear infinite;
    }
 
    .stars:after {
        -webkit-transform: translateZ(-600px);
        transform: translateZ(-600px);
        -webkit-animation: hideme2 10s linear infinite;
        animation: hideme2 15s linear infinite;
    }
 
    @-webkit-keyframes zooms {
        from {
            -webkit-transform: translateZ(0px);
            transform: translateZ(0px);
        }
        to {
            -webkit-transform: translateZ(300px);
            transform: translateZ(300px);
        }
    }
 
    @keyframes zooms {
        from {
            -webkit-transform: translateZ(0px);
            transform: translateZ(0px);
        }
        to {
            -webkit-transform: translateZ(300px);
            transform: translateZ(300px);
        }
    }
 
    @-webkit-keyframes hideme1 {
        from {
            opacity: .5;
        }
        to {
            opacity: 1;
        }
    }
 
    @keyframes hideme1 {
        from {
            opacity: .5;
        }
        to {
            opacity: 1;
        }
    }
 
    @-webkit-keyframes hideme2 {
        from {
            opacity: 0;
        }
        to {
            opacity: .5;
        }
    }
 
    @keyframes hideme2 {
        from {
            opacity: 0;
        }
        to {
            opacity: .5;
        }
    }
 
    section, header {
        position: relative;
        overflow: hidden;
    background: #000;
        height: 100%;
    }

body {
  min-height: 100vh;
  background-position: 0 -30vh;
  background-blend-mode: luminosity;
  background-size: cover;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-position: ${({ theme }) => (theme.name == 'classic' ? '0% 0%' : 'top center')};
  /*background-image: ${({ theme }) =>
    theme.name == 'classic'
      ? 'none'
      : theme.name == 'dark'
        ? 'url(' + images.backgrounds.dark + ')'
        : 'url(' + images.backgrounds.light + ')'};*/
}

::placeholder { color: ${({ theme }) => theme.placeholderColor}; }
::-webkit-search-decoration { -webkit-appearance: none; }
::-webkit-outer-spin-button, ::-webkit-inner-spin-button { -webkit-appearance: none; }

.margin-auto { margin: auto; }
.margin-pull-right { margin: auto 0px auto auto; }
.clear-fix { clear:both !important; float:none !important; }
.text-left { text-align: left !important;}
.text-right { text-align: right !important;}
.text-center { text-align: center !important;}

.text-center-title { 
  font-weight: 900 !important;
  color: ${({ theme }) => theme.text1} !important;
}

/*  --------------------------------------------------------
ALPHA OPACITY
-------------------------------------------------------- */
.alpha2     { opacity: .2 !important; }
.alpha3     { opacity: .3 !important; }
.alpha4     { opacity: .4 !important; }
.alpha5     { opacity: .5 !important; }
.alpha6     { opacity: .6 !important; }
.alpha7     { opacity: .7 !important; }
.alpha8     { opacity: .8 !important; }
.alpha9     { opacity: .9 !important; }
.alpha10    { opacity: 1 !important; }
/*  --------------------------------------------------------
PADDING STYLE
-------------------------------------------------------- */
.p0      { padding: 0 !important; }
.p5      { padding: 5px !important; }
.p10     { padding: 10px !important; }
.p15     { padding: 15px !important; }
.p20     { padding: 20px !important; }
.p25     { padding: 25px !important; }
.p30     { padding: 30px !important; }
.p35     { padding: 35px !important; }
.p40     { padding: 40px !important; }
.p45     { padding: 45px !important; }
.p50     { padding: 50px !important; }
.p55     { padding: 55px !important; }
.p60     { padding: 60px !important; }
.p65     { padding: 65px !important; }
.p70     { padding: 70px !important; }
.p75     { padding: 75px !important; }
.p80     { padding: 80px !important; }
.p85     { padding: 85px !important; }
.p90     { padding: 90px !important; }
.p95     { padding: 95px !important; }
.p100    { padding: 100px !important; }

.pt0    { padding-top: 0px !important; }
.pt5    { padding-top: 5px !important; }
.pt7    { padding-top: 7px !important; }
.pt10   { padding-top: 10px !important; }
.pt15   { padding-top: 15px !important; }
.pt20   { padding-top: 20px !important; }
.pt25   { padding-top: 25px !important; }    
.pt30   { padding-top: 30px !important; }    
.pt35   { padding-top: 35px !important; }    
.pt40   { padding-top: 40px !important; }    
.pt45   { padding-top: 45px !important; }    
.pt50   { padding-top: 50px !important; }    
.pt55   { padding-top: 55px !important; }    
.pt60   { padding-top: 60px !important; }    
.pt65   { padding-top: 65px !important; }    
.pt70   { padding-top: 70px !important; }    
.pt75   { padding-top: 75px !important; }    
.pt80   { padding-top: 80px !important; }    
.pt85   { padding-top: 85px !important; }    
.pt90   { padding-top: 90px !important; }    
.pt95   { padding-top: 95px !important; }    
.pt100  { padding-top: 100px !important; }

.pr0    { padding-right: 0px !important; }
.pr5    { padding-right: 5px !important; }
.pr10   { padding-right: 10px !important; }
.pr15   { padding-right: 15px !important; }
.pr20   { padding-right: 20px !important; }
.pr25   { padding-right: 25px !important; }    
.pr30   { padding-right: 30px !important; }    
.pr35   { padding-right: 35px !important; }    
.pr40   { padding-right: 40px !important; }    
.pr45   { padding-right: 45px !important; }    
.pr50   { padding-right: 50px !important; }    
.pr55   { padding-right: 55px !important; }    
.pr60   { padding-right: 60px !important; }    
.pr65   { padding-right: 65px !important; }    
.pr70   { padding-right: 70px !important; }    
.pr75   { padding-right: 75px !important; }    
.pr80   { padding-right: 80px !important; }    
.pr85   { padding-right: 85px !important; }    
.pr90   { padding-right: 90px !important; }    
.pr95   { padding-right: 95px !important; }    
.pr100  { padding-right: 100px !important; }

.pb0    { padding-bottom: 0px !important; }
.pb5    { padding-bottom: 5px !important; }
.pb10   { padding-bottom: 10px !important; }
.pb15   { padding-bottom: 15px !important; }
.pb20   { padding-bottom: 20px !important; }
.pb25   { padding-bottom: 25px !important; }    
.pb30   { padding-bottom: 30px !important; }    
.pb35   { padding-bottom: 35px !important; }    
.pb40   { padding-bottom: 40px !important; }    
.pb45   { padding-bottom: 45px !important; }    
.pb50   { padding-bottom: 50px !important; }    
.pb55   { padding-bottom: 55px !important; }    
.pb60   { padding-bottom: 60px !important; }    
.pb65   { padding-bottom: 65px !important; }    
.pb70   { padding-bottom: 70px !important; }    
.pb75   { padding-bottom: 75px !important; }    
.pb80   { padding-bottom: 80px !important; }    
.pb85   { padding-bottom: 85px !important; }    
.pb90   { padding-bottom: 90px !important; }    
.pb95   { padding-bottom: 95px !important; }    
.pb100  { padding-bottom: 100px !important; }

.pl0    { padding-left: 0px !important; }
.pl5    { padding-left: 5px !important; }
.pl10   { padding-left: 10px !important; }
.pl15   { padding-left: 15px !important; }
.pl20   { padding-left: 20px !important; }
.pl25   { padding-left: 25px !important; }    
.pl30   { padding-left: 30px !important; }    
.pl35   { padding-left: 35px !important; }    
.pl40   { padding-left: 40px !important; }    
.pl45   { padding-left: 45px !important; }    
.pl50   { padding-left: 50px !important; }    
.pl55   { padding-left: 55px !important; }    
.pl60   { padding-left: 60px !important; }    
.pl65   { padding-left: 65px !important; }    
.pl70   { padding-left: 70px !important; }    
.pl75   { padding-left: 75px !important; }    
.pl80   { padding-left: 80px !important; }    
.pl85   { padding-left: 85px !important; }    
.pl90   { padding-left: 90px !important; }    
.pl95   { padding-left: 95px !important; }    
.pl100  { padding-left: 100px !important; }

@media (max-width: 1050px) { 
  .pl-mobile-25 { padding-left: 25px; margin-top: 3px; }
}

/*  --------------------------------------------------------
MARGIN STYLE
-------------------------------------------------------- */
.m0      { margin: 0 !important; }
.m5      { margin: 5px !important; }
.m10     { margin: 10px !important; }
.m15     { margin: 15px !important; }
.m20     { margin: 20px !important; }
.m25     { margin: 25px !important; }
.m30     { margin: 30px !important; }
.m35     { margin: 35px !important; }
.m40     { margin: 40px !important; }
.m45     { margin: 45px !important; }
.m50     { margin: 50px !important; }
.m55     { margin: 55px !important; }
.m60     { margin: 60px !important; }
.m65     { margin: 65px !important; }
.m70     { margin: 70px !important; }
.m75     { margin: 75px !important; }
.m80     { margin: 80px !important; }
.m85     { margin: 85px !important; }
.m90     { margin: 90px !important; }
.m95     { margin: 95px !important; }
.m100    { margin: 100px !important; }

.mt0    { margin-top: 0px !important; }
.mt3    { margin-top: 3px !important; }
.mt5    { margin-top: 5px !important; }
.mt10   { margin-top: 10px !important; }
.mt15   { margin-top: 15px !important; }
.mt20   { margin-top: 20px !important; }
.mt25   { margin-top: 25px !important; }    
.mt30   { margin-top: 30px !important; }    
.mt35   { margin-top: 35px !important; }    
.mt40   { margin-top: 40px !important; }    
.mt45   { margin-top: 45px !important; }    
.mt50   { margin-top: 50px !important; }    
.mt55   { margin-top: 55px !important; }    
.mt60   { margin-top: 60px !important; }    
.mt65   { margin-top: 65px !important; }    
.mt70   { margin-top: 70px !important; }    
.mt75   { margin-top: 75px !important; }    
.mt80   { margin-top: 80px !important; }    
.mt85   { margin-top: 85px !important; }    
.mt90   { margin-top: 90px !important; }    
.mt95   { margin-top: 95px !important; }    
.mt100  { margin-top: 100px !important; }
.mt110  { margin-top: 110px !important; }
.mt120  { margin-top: 120px !important; }

.mr0    { margin-right: 0px !important; }
.mr5    { margin-right: 5px !important; }
.mr10   { margin-right: 10px !important; }
.mr15   { margin-right: 15px !important; }
.mr20   { margin-right: 20px !important; }
.mr25   { margin-right: 25px !important; }    
.mr30   { margin-right: 30px !important; }    
.mr35   { margin-right: 35px !important; }    
.mr40   { margin-right: 40px !important; }    
.mr45   { margin-right: 45px !important; }    
.mr50   { margin-right: 50px !important; }    
.mr55   { margin-right: 55px !important; }    
.mr60   { margin-right: 60px !important; }    
.mr65   { margin-right: 65px !important; }    
.mr70   { margin-right: 70px !important; }    
.mr75   { margin-right: 75px !important; }    
.mr80   { margin-right: 80px !important; }    
.mr85   { margin-right: 85px !important; }    
.mr90   { margin-right: 90px !important; }    
.mr95   { margin-right: 95px !important; }    
.mr100  { margin-right: 100px !important; }

.mb0    { margin-bottom: 0px !important; }
.mb5    { margin-bottom: 5px !important; }
.mb10   { margin-bottom: 10px !important; }
.mb15   { margin-bottom: 15px !important; }
.mb20   { margin-bottom: 20px !important; }
.mb25   { margin-bottom: 25px !important; }    
.mb30   { margin-bottom: 30px !important; }    
.mb35   { margin-bottom: 35px !important; }    
.mb40   { margin-bottom: 40px !important; }    
.mb45   { margin-bottom: 45px !important; }    
.mb50   { margin-bottom: 50px !important; }    
.mb55   { margin-bottom: 55px !important; }    
.mb60   { margin-bottom: 60px !important; }    
.mb65   { margin-bottom: 65px !important; }    
.mb70   { margin-bottom: 70px !important; }    
.mb75   { margin-bottom: 75px !important; }    
.mb80   { margin-bottom: 80px !important; }    
.mb85   { margin-bottom: 85px !important; }    
.mb90   { margin-bottom: 90px !important; }    
.mb95   { margin-bottom: 95px !important; }    
.mb100  { margin-bottom: 100px !important; }

.ml0    { margin-left: 0px !important; }
.ml5    { margin-left: 5px !important; }
.ml10   { margin-left: 10px !important; }
.ml15   { margin-left: 15px !important; }
.ml20   { margin-left: 20px !important; }
.ml25   { margin-left: 25px !important; }    
.ml30   { margin-left: 30px !important; }    
.ml35   { margin-left: 35px !important; }    
.ml40   { margin-left: 40px !important; }    
.ml45   { margin-left: 45px !important; }    
.ml50   { margin-left: 50px !important; }    
.ml55   { margin-left: 55px !important; }    
.ml60   { margin-left: 60px !important; }    
.ml65   { margin-left: 65px !important; }    
.ml70   { margin-left: 70px !important; }    
.ml75   { margin-left: 75px !important; }    
.ml80   { margin-left: 80px !important; }    
.ml85   { margin-left: 85px !important; }    
.ml90   { margin-left: 90px !important; }    
.ml95   { margin-left: 95px !important; }    
.ml100  { margin-left: 100px !important; }

/*  --------------------------------------------------------
MARGIN STYLE MINUS
-------------------------------------------------------- */
.mt-5    { margin-top: -5px !important; }
.mt-10   { margin-top: -10px !important; }
.mt-15   { margin-top: -15px !important; }
.mt-20   { margin-top: -20px !important; }
.mt-25   { margin-top: -25px !important; }    
.mt-30   { margin-top: -30px !important; }    
.mt-35   { margin-top: -35px !important; }    
.mt-40   { margin-top: -40px !important; }    
.mt-45   { margin-top: -45px !important; }    
.mt-50   { margin-top: -50px !important; }    
.mt-55   { margin-top: -55px !important; }    
.mt-60   { margin-top: -60px !important; }    
.mt-65   { margin-top: -65px !important; }    
.mt-70   { margin-top: -70px !important; }    
.mt-75   { margin-top: -75px !important; }    
.mt-80   { margin-top: -80px !important; }    
.mt-85   { margin-top: -85px !important; }    
.mt-90   { margin-top: -90px !important; }    
.mt-95   { margin-top: -95px !important; }    
.mt-100  { margin-top: -100px !important; }
.mt-110  { margin-top: -110px !important; }
.mt-120  { margin-top: -120px !important; }
.mt-130  { margin-top: -130px !important; }
.mt-140  { margin-top: -140px !important; }
.mt-150  { margin-top: -150px !important; }

.ml-5    { margin-left: -5px !important; }
.ml-10   { margin-left: -10px !important; }
.ml-15   { margin-left: -15px !important; }
.ml-20   { margin-left: -20px !important; }
.ml-25   { margin-left: -25px !important; }    
.ml-30   { margin-left: -30px !important; }    
.ml-35   { margin-left: -35px !important; }    
.ml-40   { margin-left: -40px !important; }    
.ml-45   { margin-left: -45px !important; }    
.ml-50   { margin-left: -50px !important; }    
.ml-55   { margin-left: -55px !important; }    
.ml-60   { margin-left: -60px !important; }    
.ml-65   { margin-left: -65px !important; }    
.ml-70   { margin-left: -70px !important; }    
.ml-75   { margin-left: -75px !important; }    
.ml-80   { margin-left: -80px !important; }    
.ml-85   { margin-left: -85px !important; }    
.ml-90   { margin-left: -90px !important; }    
.ml-95   { margin-left: -95px !important; }    
.ml-100  { margin-left: -100px !important; }
.ml-110  { margin-left: -110px !important; }
.ml-120  { margin-left: -120px !important; }
.ml-130  { margin-left: -130px !important; }
.ml-140  { margin-left: -140px !important; }
.ml-150  { margin-left: -150px !important; }

.mb-5    { margin-bottom: -5px !important; }
.mb-10   { margin-bottom: -10px !important; }
.mb-15   { margin-bottom: -15px !important; }
.mb-20   { margin-bottom: -20px !important; }
.mb-25   { margin-bottom: -25px !important; }    
.mb-30   { margin-bottom: -30px !important; }    
.mb-35   { margin-bottom: -35px !important; }    
.mb-40   { margin-bottom: -40px !important; }    
.mb-45   { margin-bottom: -45px !important; }    
.mb-50   { margin-bottom: -50px !important; }    
.mb-55   { margin-bottom: -55px !important; }    
.mb-60   { margin-bottom: -60px !important; }    
.mb-65   { margin-bottom: -65px !important; }    
.mb-70   { margin-bottom: -70px !important; }    
.mb-75   { margin-bottom: -75px !important; }    
.mb-80   { margin-bottom: -80px !important; }    
.mb-85   { margin-bottom: -85px !important; }    
.mb-90   { margin-bottom: -90px !important; }    
.mb-95   { margin-bottom: -95px !important; }    
.mb-100  { margin-bottom: -100px !important; }
.mb-110  { margin-bottom: -110px !important; }
.mb-120  { margin-bottom: -120px !important; }
.mb-130  { margin-bottom: -130px !important; }
.mb-140  { margin-bottom: -140px !important; }
.mb-150  { margin-bottom: -150px !important; }

.tokenSymbolImage {
  width: 110px;
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
  border-radius: unset;
  box-shadow: ${({ theme }) =>
    theme.name == 'classic'
      ? '0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),0px 24px 32px rgba(0, 0, 0, 0.01)'
      : theme.name == 'dark'
        ? '0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),0px 24px 32px rgba(0, 0, 0, 0.01)'
        : 'none'};
  }

  .evidence-text { font-weight: 500; font-size: 14px; }
  .full-width { width: 100% !important; }
  .width80 { width: 80% !important; }
  .pull-right { float: right; }
  .pull-left { float: left; }
  .center-block { margin: 0px auto !important; }
  .text-centered { text-align: center !important; }
  .font25 { 
    font-size: 25px !important; 
    @media (max-width: 1050px) { 
      font-size: 20px !important;
    }
  }
  .error { color: ${({ theme }) => theme.red2}; }
  .display-contents { display: contents; }

  svg.simple-icon { width: 16px;}
  svg.simple-icon.dark { stroke: ${({ theme }) => theme.azure1}; color: ${({ theme }) => theme.azure1}; }
  svg.simple-icon.light {}
  svg.simple-icon.classic {}

  .token-address { font-size: 12px; font-weight: 500; margin-bottom: 10px; }
  .token-decimals { font-size: 12px; font-weight: 500; margin-bottom: 10px; }
  .hide-dark { ${({ theme }) => (theme.name == 'dark' ? 'display: none !important;' : '')} }
  .hide-light { ${({ theme }) => (theme.name == 'light' ? 'display: none !important;' : '')} }
  .hide-classic { ${({ theme }) => (theme.name == 'classic' ? 'display: none !important;' : '')} }

  #remove-liquidity-tokena-symbol + img, #remove-liquidity-tokenb-symbol + img { margin-top: 3px; }
  
  .claim-footer { min-width: 85px !important; }
  .custom-token-added-by-user { 
    font-weight: 500;
    &.classic, &.classic button { margin-top: 5px; }
  } 

  .token-list-item-text {
    font-weight: 400;
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .token-list-item-text.classic { text-shadow: 1px 1px 1px ${({ theme }) => theme.black}; }
  .token-list-item-text.selected { font-weight: 500; }

  @media (max-width: 1050px) { 
    .custom-recipient-data-container {
      padding: 0px  20px;
    }
    .add-token-list-container { padding: 0px 20px; }
    &.custom-token-added-by-user.classic button { margin-left: -8px; }
    .undragable {
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none; 
      -o-user-drag: none;
      -webkit-app-region: no-drag;
      user-drag: none;
    }
  }

  .appBackground {
    z-index: -99;
    position:absolute;
    top:0;
    left:0;
    width:100%;
    height: 100%;
  }

  .appBackground video {
    position: fixed;
    right: 0;
    bottom: 0;
    min-width: 100%;
    min-height: 100%;
  }

  .appBackground .videoOverlay {
    position: fixed;
    top:0;
    left:0;
    min-width: 100%;
    min-height: 100%;
  }

  .appBackground .videoOverlay.dark { background-color: black; }
  .appBackground .videoOverlay.light { background-color: white }
  .appBackground.classic { display: none; }
  
  .advaced-swap-details.value, .advaced-swap-details.label { font-size: 14px; }
`
export const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`
export const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`
export const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: 16px;
    padding-top: 0rem;
  `};

  z-index: 1;
`
export const Marginer = styled.div`
  margin-top: 5rem;
`
export const MainContainer = styled.div`
  margin: 0 auto;
  position: relative;
  width: 100%;
  display: inline-block;
  z-index: 2;


  @media (max-width: 1050px) {

  }

  &:before,
  &:after {

  }
`
export const MainContainerExtraDecorator = styled.div`
  position: absolute;
  display: none;
  width: 100%;
  height: 100%;
  z-index: -1;

  &.top {
    top: 0px;
    left: 0px;
  }
  &.bottom {
    bottom: 0px;
    left: 0px;
    transform: scaleX(-1);
  }

  &:before,
  &:after {
    position: absolute;
    content: ' ';
    display: block;
    width: 52px;
    height: 55px;
    background-color: transparent;
    background-size: 80% 80%;
    opacity: 0.6;
  }

  &:before {
    top: -29px;
    left: -29px;
    background-position: left top;
    background-repeat: no-repeat;
  }
  &:after {
    bottom: -29px;
    right: -29px;
    transform: rotate(180deg);
    background-position: left top;
    background-repeat: no-repeat;
  }

  &.dark:before {
    background-image: url(${images.decorators.largeBoxes.dark});
  }
  &.dark:after {
    background-image: url(${images.decorators.largeBoxes.dark});
  }

  &.light:before {
    background-image: url(${images.decorators.largeBoxes.light});
  }
  &.light:after {
    background-image: url(${images.decorators.largeBoxes.light});
  }

  &.classic:before {
  }
  &.classic:after {
  }

  @media (max-width: 1050px) {
    display: none !important;
  }
`
export const MainContainerContentWrapper = styled.div`
  
`
export const FeatureTitle = styled.h2`
  
`
export const FeatureChildrenContainer = styled.div`
  max-width: 1200px;
  padding: 20px 7px;
  margin: 0px auto;

  @media (max-width: 1050px) { min-height: auto; }
`
export const SectionTitle = styled.h6`
  font-weight: 900;
  font-size: 36px;
  position: relative;
  display: inline-block;
  margin: 7px;
  text-transform: capitalize;
  padding: 0px;
  width: 80%;

  &.dark {
    color: ${({ theme }) => theme.white};
  }
  &.light {
    color: ${({ theme }) => theme.black};
  }
  &.classic {
    color: ${({ theme }) => theme.azure1};
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }

  &.classic.add-liquidity-section-title {
    width: 100%;
    text-align: center;
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
`

export const SectionContent = styled.div`
  font-weight: 400;
  line-height: 1.5rem;
  padding: .5rem;
  &.dark {
  }
  &.light {
    text-shadow: 0px;
  }
  &.classic {
  }
  & .yellow {
    color: ${({ theme }) => theme.yellow1};
  }
`

export const InventoryContainer = styled.div`
  overflow-y: auto;
  overflow: hidden;

  @media (max-width: 1050px) {
    max-height: auto;
  }
`
export const InventoryItemContainer = styled.div`
  border-radius: 16px;
  padding: 1rem;  
  height: 100px;
  margin-bottom: 8px;
  background: transparent;
  font-size: 14px;
  font-weight: 900;

  color: ${({ theme }) => theme.text1};

  &.dark {
    border: 2px solid rgba(255, 255, 255, 0.1);
  }
  &.dark:hover {
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  &.light {
    border: 2px solid rgba(4, 4, 5, 0.1);
  }
  &.light:hover {
    border: 2px solid rgba(4, 4, 5, 0.2);
  }

  &.classic {
    background: linear-gradient(180deg, rgba(0, 27, 49, 0.5) 0%, rgba(0, 27, 49, 0.5) 100%);
  }

  & .balanceRow {
    display: inline-flex;
    margin: 5px 0px 0px 0px;
    font-size: 12px;
  }

  & .balanceRow > div:first-child {
    margin-right: 5px;
  }

  &.dark .balanceRow > div:first-child {
    color: ${({ theme }) => theme.azure2};
  }

  &.light .balanceRow > div:first-child {
    color: ${({ theme }) => theme.violet1};
  }

  &.classic .balanceRow > div:first-child {
    color: ${({ theme }) => theme.blue1};
  }

  & .addressRow {
    display: inline-flex;
    margin: 5px 0px 0px 0px;
    font-size: 12px;
  }

  & .addressRow > div:first-child {
    margin-right: 5px;
  }

  &.dark .addressRow > div:first-child {
    color: ${({ theme }) => theme.azure2};
  }

  &.light .addressRow > div:first-child {
    color: ${({ theme }) => theme.violet1};
  }

  &.classic .addressRow > div:first-child {
    color: ${({ theme }) => theme.blue1};
  }

  & .decimalsRow {
    display: inline-flex;
    margin: 5px 0px 0px 0px;
    font-size: 12px;
  }

  & .decimalsRow > div:first-child {
    margin-right: 5px;
  }

  &.dark .decimalsRow > div:first-child {
    color: ${({ theme }) => theme.azure2};
  }

  &.light .decimalsRow > div:first-child {
    color: ${({ theme }) => theme.violet1};
  }

  &.classic .decimalsRow > div:first-child {
    color: ${({ theme }) => theme.blue1};
  }

  & .tokenType {
    margin: 5px 0px 5px 10px;
    display: inline-block;
  }
`
export const SimpleTextParagraph = styled.p`
  font-size: 13px;
  margin: 20px 0px;
  text-align: left;

  &.dark {
    font-weight: 500;
  }
  &.light {
  }
  &.classic {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
    line-height: 2em;
  }
  &.classic strong {
    font-weight: normal;
  }

  &.dark > a {
    color: ${({ theme }) => theme.azure1};
  }
  &.light > a {
    color: ${({ theme }) => theme.violet1};
  }
  &.light > a {
  }

  & span.row {
    display: inline-block;
    width: 100%;
    margin-bottom: 10px;
  }
  & span.row span.column {
    display: inline-block;
    float: left;
  }
  & span.row span.column:last-child {
    float: right;
  }
  & span.row span.column img {
    display: inline-block !important;
    vertical-align: middle;
  }

  & img.ethereumLogo,
  & img.tokenLogo {
    margin-top: 0px;
  }
  &.dark.extreme,
  &.light.extreme {
    font-size: 25px;
  }

  @media (max-width: 1050px) {
    &.dark.extreme,
    &.light.extreme {
      font-size: 20px;
    }
  }
`
export const SimpleInformationsTextParagraph = styled(SimpleTextParagraph)`
  &.dark {
    color: ${({ theme }) => theme.text2};
    font-size: 14px;
    font-weight: 900;
  }
  &.light {
  }
  &.classic {
  }
`

export const EvidencedTextParagraph = styled(SimpleTextParagraph)`
  font-size: 16px;
  font-weight: 400;

  &.dark {
    color: ${({ theme }) => theme.azure1};
  }
  &.light {
    color: ${({ theme }) => theme.violet1};
  }
  &.classic {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
    line-height: 2em;
  }
  &.dark.extreme,
  &.light.extreme {
    font-size: 25px;
  }

  @media (max-width: 1050px) {
    &.dark.extreme,
    &.light.extreme {
      font-size: 20px;
    }
  }
`
const BaseButton = styled(Button) <{ width?: string; borderRadius?: string; selected?: boolean; hide?: boolean }>`
  padding: 0px !important;
  width: ${({ width }) => (width ? width : 'auto')};
  border-radius: ${({ borderRadius }) => (borderRadius ? borderRadius : '0px')};
  display: inline-block;
  text-align: center;
  border-color: transparent;
  outline: none;
  text-decoration: none;
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;
  position: relative;
  background: none;

  &:disabled {
    cursor: auto;
  }
  > * {
    user-select: none;
  }
  &.hidden {
    display: none !important;
  }
  ${({ hide }) => (hide ? 'display: none !important;' : '')}
`
export const IconButton = styled(BaseButton) <{ width?: string; borderRadius?: string; selected?: boolean }>`
  cursor: pointer;
  width: fit-content;
  margin-left: 10px;
  border-color: rgba(4, 4, 5, 0.1);
    color: rgba(4, 4, 5, 0.8);
    background: transparent;

  & > svg,
  & > span.icon-symbol {
    width: 20px;
    height: 20px;
  }
  & > span.icon-symbol {
    display: inline-block;
    margin-right: 10px;
  }

  &.dark > svg,
  &.dark > span.icon-symbol {
    stroke: ${({ theme }) => theme.azure7};
    color: ${({ theme }) => theme.azure7};
  }
  &.light > svg,
  &.light > span.icon-symbol {
    stroke: ${({ theme }) => theme.violet2};
    color: ${({ theme }) => theme.violet2};
  }
  &.light > svg.footer-icon {
    stroke: ${({ theme }) => theme.violet1};
    color: ${({ theme }) => theme.violet1};
  }
  &.classic > svg,
  &.classic > span.icon-symbol {
  }

  &.dark:hover > svg,
  &.dark:focus > svg {
    stroke: ${({ theme }) => theme.text1};
    color: ${({ theme }) => theme.text1};
  }
  &.dark:hover > span.icon-symbol,
  &.dark:focus > span.icon-symbol {

  }

  &.light:hover > svg,
  &.light:focus > svg {
    stroke: ${({ theme }) => theme.text1};
    color: ${({ theme }) => theme.text1};
  }
  &.light:hover > span.icon-symbol,
  &.light:focus > span.icon-symbol {

  }

  &.light:classic > svg,
  &.light:classic > svg {
  }

  &.popup-close-icon,
  &.modal-close-icon {
    position: absolute;
    right: 10px;
    top: 10px;
  }

  &.menuIcon > svg {
    width: 24px;
    height: 24px;
    margin-right: 10px;
  }

  & + .custom-label {
    cursor: pointer;
    margin-top: -0.3rem;
    font-weight: 600;
  }
  & + .custom-label.dark {
  }
  & + .custom-label.light {
  }
  & + .custom-label.classic {
  }

  @media (max-width: 1050px) {
    & + .custom-label {
      display: none;
    }
    &.classic.menuIcon > svg {
      stroke: ${({ theme }) => theme.white};
    }
  }
`
export const InventoryGridContainer = styled.div`
  display: grid;
  grid-template-columns: 20% 50% auto;
`
export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 20% 50% auto;
`
export const PageGridContainer = styled.div`
  display: grid;
  grid-template-columns: 30% auto;
  @media (max-width: 1050px) {
    grid-template-columns: auto !important;
  }

  &.swap {
  }
  &.batch-swap {
  }
  &.pool {
  }
  &.liquidity-mining {
  }

  &.swap > .left-column {
    min-height: 580px;
  }
  &.batch-swap > .left-column {
    min-height: 580px;
  }
  &.pool > .left-column {
    min-height: 580px;
    padding: 0 1rem 1rem 1rem;
  }
  &.pool > .left-column.classic {
    padding: 0 1rem 1rem 0;
  }
  &.liquidity-mining > .left-column {
    padding: 0 1rem 1rem 1rem;
  }
  &.liquidity-mining > .left-column.classic {
    padding: 0 1rem 1rem 0;
  }

  & > .left-column > .collapsable-title {
    font-weight: 400;
    font-size: 14px;
    margin-bottom: 15px;
    display: none;
    padding-left: 10px;
  }

  & > .left-column.dark > .collapsable-title {
    color: ${({ theme }) => theme.azure1};
  }
  & > .left-column.light > .collapsable-title {
    color: ${({ theme }) => theme.grey3};
  }
  & > .left-column.classic > .collapsable-title {
    color: ${({ theme }) => theme.azure1};
  }

  @media (max-width: 1050px) {
    &.pool > .left-column {
      min-height: auto !important;
      padding: 0;
    }
    &.liquidity-mining > .left-column {
      padding: 0;
    }
    &.swap > .left-column {
      min-height: auto !important;
    }
    &.batch-swap > .left-column {
      min-height: auto !important;
    }
    & > .left-column > .collapsable-title {
      display: block;
    }
    & > .left-column > .collapsable-title + .collapsable-item.collapsed {
      display: none;
    }
    & > .left-column > .collapsable-title + .collapsable-item.opened {
      display: block;
      padding-left: 10px;
      margin-bottom: 20px;
    }
  }
`
export const PageItemsContainer = styled.div`
  &.dark {
  }
  &.light {
  }
  &.classic {
  }

  &.swap {
    min-height: 580px;
  }
  &.batch-swap {
    min-height: 580px;
  }
`
export const FooterInfo = styled.div`
  font-size: small;
  z-index: 99;
  text-align: center;
  width: 100%;
  /*display: grid;
  grid-template-columns: 30% auto; */

  &.dark {
  }
  &.light {
  }
  &.classic {
  }

  &.dark > div.boxFooterCaption {
    margin: 5px auto 5px auto;
  }
  &.light > div.boxFooterCaption {
    margin: 5px auto 5px auto;
  }
  &.classic > div.boxFooterCaption {
    margin: 15px auto 15px auto;
  }

  .advanced-swap-details-container.classic {
    margin-top: 30px;
  }
  .advanced-swap-details-container.dark .advaced-swap-details.label,
  .advanced-swap-details-container.light .advaced-swap-details.label {
    color: ${({ theme }) => theme.cyan1};
    font-size: 13px;
  }
  .advanced-swap-details-container.classic .advaced-swap-details.label,
  .advanced-swap-details-container.classic .advaced-swap-details.value {
  }

  @media (max-width: 1050px) {
    &.dark > div.boxFooterCaption,
    &.light > div.boxFooterCaption,
    &.classic > div.boxFooterCaption {
      font-size: smaller;
    }
    &.classic > div.boxFooterCaption {
      line-height: 1.5em;
    }
  }
`
export const TabsBar = styled.div`
  &.dark {
  }
  &.light {
  }
  &.classic {
  }

  &.dark:before,
  &.light:before {
    content: '';
    width: 100%;
    display: block;
    left: 0;
    position: relative;
    height: 1px;
    bottom: -29px;
  }

  &.classic:after,
  &.classic:before {
    content: '';
    width: 100%;
    height: 1px;
    display: block;
    left: 0px;
    bottom: -29px;
    position: relative;
  }

  &.classic:after {
    background: #c8c8d2;
  }
  &.classic:before {
    background: #9899ae;
  }

  &.dark:before {
  }
  &.light:before {
  }

  &.dark:after,
  &.light:after {
  }

  & .navigation-link > svg {
    width: 18px;
  }
  &.dark .navigation-link > svg {
    stroke: ${({ theme }) => theme.azure1};
    color: ${({ theme }) => theme.azure1};
  }
  &.dark .navigation-link:hover,
  &.dark .navigation-link:focus > svg {
    filter: drop-shadow(0px 0px 3px ${({ theme }) => theme.yellowLight});
  }
  &.light .navigation-link > svg {
    stroke: ${({ theme }) => theme.violet1};
    color: ${({ theme }) => theme.violet1};
  }
  &.light .navigation-link:hover,
  &.light .navigation-link:focus > svg {
    filter: drop-shadow(0px 0px 3px ${({ theme }) => theme.yellowLight});
  }
  &.classic .navigation-link > svg {
    stroke: ${({ theme }) => theme.azure1};
    color: ${({ theme }) => theme.azure1};
  }
  &.classic .navigation-link:hover,
  &.classic .navigation-link:focus > svg {
    filter: drop-shadow(0px 0px 3px ${({ theme }) => theme.yellowLight});
  }

  & > .tabLinkItem > svg {
    display: none;
  }

  @media (max-width: 1050px) {
    & > .tabLinkItem > svg {
      display: block;
    }
    /*& > .tabLinkItem > span { display: none; }*/
    &.dark:before,
    &.light:before,
    &.classic:after,
    &.classic:before {
      bottom: -37px;
    }
  }
`
export const DynamicGrid = styled.div<{ columns: number; columnsDefinitions?: DynamicGridColumnsDefinition[] }>`
  display: grid;
  grid-template-columns: ${({ theme, columns, columnsDefinitions }) =>
    theme.utils.gridColumsWidth(columns, columnsDefinitions)};

  & .title {
    font-size: 18px;
    font-weight: 900;
  }

  &.dark .title,
  &.dark .text {
    color: ${({ theme }) => theme.white};
  }
  &.light .title,
  &.light .text {
    color: ${({ theme }) => theme.grey1};
  }
  &.classic .title,
  &.classic .text {
    font-size: 13px;
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
    line-height: 1.5em;
  }

  @media (max-width: 1050px) {
    & .title,
    & .text {
      font-size: small;
    }
    &.classic .title,
    &.classic .text {
    }
  }
`
const tablinkitemactiveclassname = 'active'
export const TabLinkItem = styled(NavLink).attrs({ tablinkitemactiveclassname })`
  display: flex;
  flex-flow: row nowrap;
  align-items: left;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  font-size: 36px;
  margin-right: 10px
  font-weight: 900;
  float: right;

  &.dark {
    color: ${({ theme }) => theme.grey};
  }
  &.light {
    color: ${({ theme }) => theme.grey};
  }
  &.classic {
    color: ${({ theme }) => theme.white};
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }

  &.${tablinkitemactiveclassname} {
  }

  &.dark.${tablinkitemactiveclassname} {
    color: ${({ theme }) => theme.white};
  }
  &.light.${tablinkitemactiveclassname} {
    color: ${({ theme }) => theme.black};
  }
  &.classic.${tablinkitemactiveclassname} {
    color: ${({ theme }) => theme.azure1};
  }

  &.dark:hover,
  &.dark:focus {
    color: ${({ theme }) => theme.azure1};
  }
  &.light:hover,
  &.light:focus {
    color: ${({ theme }) => theme.violet4};
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.azure1};
  }

  &.dark.disabled,
  &.light.disabled,
  &.classic.disabled {
    opacity: 0.7;
    color: ${({ theme }) => theme.grey1};
  }

  &.dark.disabled:hover,
  &.dark.disabled:focus,
  &.light.disabled:hover,
  &.light.disabled:focus,
  &.classic.disabled:hover,
  &.classic.disabled:focus {
    opacity: 1;
  }

  @media (max-width: 1050px) {
    font-size: small !important;
  }
`

const internallinkitemactiveclassname = 'active'
export const InternalLinkItem = styled(NavLink).attrs({ internallinkitemactiveclassname })`
  display: flex;
  flex-flow: row nowrap;
  align-items: left;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  font-size: 18px;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;
  float: right;

  &.dark {
    color: ${({ theme }) => theme.white};
  }
  &.light {
    color: ${({ theme }) => theme.grey1};
  }
  &.classic {
    color: ${({ theme }) => theme.white};
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }

  &.${tablinkitemactiveclassname} {
  }

  &.dark.${tablinkitemactiveclassname} {
    color: ${({ theme }) => theme.azure1};
  }
  &.light.${tablinkitemactiveclassname} {
    color: ${({ theme }) => theme.violet1};
  }
  &.classic.${tablinkitemactiveclassname} {
    color: ${({ theme }) => theme.azure1};
  }

  &.dark:hover,
  &.dark:focus {
    color: ${({ theme }) => theme.azure1};
  }
  &.light:hover,
  &.light:focus {
    color: ${({ theme }) => theme.violet4};
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.azure1};
  }

  &.dark.disabled,
  &.light.disabled,
  &.classic.disabled {
    opacity: 0.7;
    color: ${({ theme }) => theme.grey1};
  }

  &.dark.disabled:hover,
  &.dark.disabled:focus,
  &.light.disabled:hover,
  &.light.disabled:focus,
  &.classic.disabled:hover,
  &.classic.disabled:focus {
    opacity: 1;
  }

  @media (max-width: 1050px) {
    font-size: small !important;
  }
`
export const InternalLinkBadge = styled(NavLink).attrs({ internallinkitemactiveclassname })`
  display: flex;
  border-radius: 16px;
  padding: 1rem;
  flex-flow: row nowrap;
  align-items: left;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  width: fit-content;
  margin: 0 3px;
  font-weight: 900;
  float: right;

  &.dark {
    color: ${({ theme }) => theme.white};
    background-color: #0e203c;
  }
  &.light {
    color: ${({ theme }) => theme.black};
    background-color: #e1e7f9;
  }
  &.classic {
    color: ${({ theme }) => theme.white};
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }

  &.${tablinkitemactiveclassname} {
  }

  &.dark.${tablinkitemactiveclassname} {
    color: ${({ theme }) => theme.azure1};
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.azure8, 0.6)};
  }
  &.light.${tablinkitemactiveclassname} {
    color: ${({ theme }) => theme.violet1};
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.violet3, 0.6)};
  }
  &.classic.${tablinkitemactiveclassname} {
    color: ${({ theme }) => theme.azure1};
  }

  &.dark:hover,
  &.dark:focus {
    color: ${({ theme }) => theme.azure1};
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.azure8, 0.6)};
  }
  &.light:hover,
  &.light:focus {
    color: ${({ theme }) => theme.violet4};
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.violet3, 0.6)};
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.azure1};
  }

  &.dark.disabled,
  &.light.disabled,
  &.classic.disabled {
    opacity: 0.7;
    color: ${({ theme }) => theme.grey1};
  }

  &.dark.disabled:hover,
  &.dark.disabled:focus,
  &.light.disabled:hover,
  &.light.disabled:focus,
  &.classic.disabled:hover,
  &.classic.disabled:focus {
    opacity: 1;
  }

  @media (max-width: 1050px) {
    font-size: small !important;
  }
`


export const PageContentContainer = styled.div`
  margin-top: 40px;
  padding:1rem;
  border-radius:0.65rem;
  @media (min-width: 1051px) {
    display: grid;
    grid-template-columns: 42.5% 15% 42.5%;

    &.one {
      grid-template-columns: 100%;
    }
    &.two {
      grid-template-columns: 50% 50%;
    }
  }
`
export const StyledNavLinkActiveClassName = 'active'
export const StyledNavLink = styled(NavLink).attrs({ StyledNavLinkActiveClassName })`
  display: flex;
  flex-flow: row nowrap;
  align-items: left;
  //border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.dark {
    color: ${({ theme }) => theme.azure1};
  }
  &.light {
    color: #565a69;
  }
  &.classic {
    color: #c3c5cb;
  }

  &.${StyledNavLinkActiveClassName} {
    font-weight: 600;
  }

  &.dark.${StyledNavLinkActiveClassName} {
    color: ${({ theme }) => theme.azure1};
  }
  &.light.${StyledNavLinkActiveClassName} {
    color: #2f9ab8;
  }
  &.classic.${StyledNavLinkActiveClassName} {
    color: #2f9ab8;
  }

  &.dark:hover,
  &.dark:focus {
    color: #e6f2f7;
  }
  &.light:hover,
  &.light:focus {
  }
  &.classic:hover,
  &.classic:focus {
  }

  &.dark.disabled,
  &.light.disabled,
  &.classic.disabled {
    opacity: 0.5;
    color: #c3c5cb;
  }

  &.dark.disabled:hover,
  &.dark.disabled:focus,
  &.light.disabled:hover,
  &.light.disabled:focus,
  &.classic.disabled:hover,
  &.classic.disabled:focus {
    opacity: 0.7;
  }
`
export const CurrencyFormPanel = styled.div<{ hideInput?: boolean }>`
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  z-index: 1;
  background: transparent;
  font-size: 14px;
  font-weight: 900;

  border-radius: 16px;
  padding: 1rem;
  margin: 5px;

  @media (min-width: 1050px) {
    max-width: 340px;
  }

  color: ${({ theme }) => theme.text1};

  &.dark {
    border: 2px dashed rgba(255, 255, 255, 0.1);
  }
  &.dark:hover {
    border: 2px dashed rgba(255, 255, 255, 0.2);
  }

  &.light {
    border: 2px dashed rgba(4, 4, 5, 0.1);
  }
  &.light:hover {
    border: 2px dashed rgba(4, 4, 5, 0.2);
  }

  &.remove-liquidity {
    margin: 0 auto -7% auto;
  }

  & > .itemsContainer {

  }

  & > .itemsContainer .labelRow {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    color: ${({ theme }) => theme.text1};
    font-size: 14px;
    font-weight: 900;
    line-height: 1rem;
    padding: 0rem 1rem 0 1rem;
  }

  & > .itemsContainer .labelRow.stake-liquidity-token {
    padding: 0rem;
  }
  & > .itemsContainer .labelRow.stake-liquidity-token + div {
    padding: 0.75rem 0rem 0.75rem 0rem;
  }

  & > .itemsContainer .labelRow.stake-liquidity-token + div > input + button {
    margin-right: 10px;
  }

  & > .itemsContainer .labelRow span:hover {
    cursor: pointer;
  }

  & > .itemsContainer .label {
    display: inline;
  }
  & > .itemsContainer .label.link {
    cursor: pointer;
  }

  & > .itemsContainer .label.stake-liquidity-token {
    display: none;
  }
  & > .itemsContainer .label.link.stake-liquidity-token {
    display: block;
  }

  &.dark > .itemsContainer .label {
    color: ${({ theme }) => theme.azure1};
  }
  &.light > .itemsContainer .label {
    color: ${({ theme }) => theme.violet1};
  }
  &.classic > .itemsContainer .label {
    color: ${({ theme }) => theme.azure1};
  }
`
export const CustomActionButton = styled(BaseButton) <{
  disabled?: boolean
  selected?: boolean
  useCustomProperties?: boolean
}>`
border-radius: 40px !important;
font-size: 14px;
font-weight: 900;
  text-transform: capitalize;
  text-align: center;
  height: 40px;
  padding-left: 22px;
  padding-right: 22px;

  & > label,
  & > label + svg {
    display: block;
    float: left;
  }
  & > label + svg {
    width: 15px;
  }
  & > label {
    margin-top: 3px;
    margin-right: 5px;
  }
  & > label.classic {
    margin-top: 7px;
  }

  &.dark {
    color: #ffffff !important;
    background-color: #0066ff !important;
  }

  &.light {
    color: #ffffff !important;
    background-color: #0066ff !important;
  }

  &.classic {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
    padding: 0px 10px 0px 10px !important;
    color: ${({ theme }) => theme.yellowGreen};
    position: relative;
  }
  &.classic:before {
    position: absolute;
    content: ' ';
    display: none;
    width: 57px;
    height: 35px;
    background-image: url(${images.icons.FF7Cursor});
    background-repeat: no-repeat;
    background-position: center center;
    left: -57px;
    top: -4px;
    z-index: 1;
  }

  &.dark:hover,
  &.dark:focus {
    box-shadow: 0px 0px 4px ${({ theme }) => theme.yellowGreen};
  }
  &.light:hover,
  &.light:focus {
    box-shadow: 0px 0px 4px ${({ theme }) => theme.utils.hexToRGB(theme.black, 0.4)};
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.azure2};
  }
  &.classic:hover:before,
  &.classic:focus:before {
    display: block;
  }
`

export const ActionButton = styled(BaseButton) <{ disabled?: boolean, selected?: boolean, useCustomProperties?: boolean }>`
  border-radius: 16px !important;
  font-size: 12px !important;
  font-weight: 900;
  text-transform: capitalize;
  text-align: center;
  padding: 3px 7px !important;
  & > label, & > label + svg { display: block; float: left; }
  & > label + svg { width: 15px; }
  & > label { margin-top: 3px; margin-right: 5px; }
  & > label.classic { margin-top: 7px; }
  &.dark {
    color: ${({ theme }) => theme.yellowGreen} !important;
    background-color: ${({ theme }) => theme.transparent};
  }
  &.light {
    color: ${({ theme }) => theme.violet1} !important;
    background-color: ${({ theme }) => theme.transparent};
  }
  &.classic {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
    padding: 0px 10px 0px 10px !important;
    color: ${({ theme }) => theme.yellowGreen};
    position: relative;
  }
  &.classic:before { 
    position: absolute;
    content: " ";
    display: none; 
    width: 57px;
    height: 35px;
    background-image: url(${images.icons.FF7Cursor});
    background-repeat: no-repeat;
    background-position: center center;
    left: -57px;
    top: -4px;
    z-index: 1;
  }
  &.dark:hover, &.dark:focus { box-shadow: 0px 0px 4px ${({ theme }) => theme.yellowGreen}; }
  &.light:hover, &.light:focus { box-shadow: 0px 0px 4px ${({ theme }) => theme.utils.hexToRGB(theme.black, 0.4)}; }
  &.classic:hover, &.classic:focus { color: ${({ theme }) => theme.azure2}; }
  &.classic:hover:before, &.classic:focus:before { display: block; }
`

export const Erc20Badge = styled(ActionButton) <{
  disabled?: boolean
  selected?: boolean
  useCustomProperties?: boolean
  width?: any
}>`
  width: ${({ width }) => width ?? 'auto'};
  min-width: unset !important;

  &.dark {
    color: ${({ theme }) => theme.yellow2} !important;
    border: 1px solid ${({ theme }) => theme.yellow2} !important;
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.yellow2, 0.05)};
  }

  &.light {
    color: ${({ theme }) => theme.yellow2} !important;
    border: 1px solid ${({ theme }) => theme.yellow2} !important;
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.yellow2, 0.05)};
  }

  &.classic {
    color: ${({ theme }) => theme.yellow2};
    pointer-events: none;
  }

  &.dark:hover,
  &.dark:focus {
    box-shadow: 0px 0px 4px ${({ theme }) => theme.yellow2};
  }
  &.light:hover,
  &.light:focus {
    box-shadow: 0px 0px 4px ${({ theme }) => theme.utils.hexToRGB(theme.black, 0.4)};
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.yellow2};
  }
`
export const EthItemBadge = styled(ActionButton) <{
  disabled?: boolean
  selected?: boolean
  useCustomProperties?: boolean
}>`
  &.dark {
    color: ${({ theme }) => theme.greenEthItem} !important;
    border: 1px solid ${({ theme }) => theme.greenEthItem} !important;
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.greenEthItem, 0.05)};
  }

  &.light {
    color: ${({ theme }) => theme.greenEthItem} !important;
    border: 1px solid ${({ theme }) => theme.greenEthItem} !important;
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.greenEthItem, 0.05)};
  }

  &.classic {
    color: ${({ theme }) => theme.greenEthItem};
    pointer-events: none;
  }

  &.dark:hover,
  &.dark:focus {
    box-shadow: 0px 0px 4px ${({ theme }) => theme.greenEthItem};
  }
  &.light:hover,
  &.light:focus {
    box-shadow: 0px 0px 4px ${({ theme }) => theme.utils.hexToRGB(theme.black, 0.4)};
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.greenEthItem};
  }
`
const InfoCard = styled.button<{ active?: boolean }>`
  border-radius: 16px !important;
  
  font-size: 12px !important;
  font-weight: 900;
  text-align: center;
  padding: 10px 10px !important;

  &.dark {
    color: ${({ theme }) => theme.white} !important;
    background-color: #1a1a1a;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  &.light {
    color: ${({ theme }) => theme.black} !important;
    background-color: #f5f5fe;
    border: 2px solid rgba(4, 4, 5, 0.1);
  }
  &.classic {
  }

  &.dark:hover,
  &.dark:focus {
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  &.light:hover,
  &.light:focus {
    border: 2px solid rgba(4, 4, 5, 0.2);
  }
  &.classic:hover,
  &.classic:focus {
  }
`
const OptionCard = styled(InfoCard as any)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 2rem;
  padding: 1rem;
`
export const OptionCardClickable = styled(OptionCard as any) <{ clickable?: boolean }>`
  margin-top: 0;
  &:hover {
    cursor: ${({ clickable }) => (clickable ? 'pointer' : '')};
  }
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
  &.classic {
    position: relative;
    color: ${({ theme }) => theme.yellowGreen};
    border: none;
    background: transparent;
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
  &.classic:before {
    position: absolute;
    content: ' ';
    display: none;
    width: 57px;
    height: 35px;
    background-image: url(${images.icons.FF7Cursor});
    background-repeat: no-repeat;
    background-position: center center;
    left: 0px;
    top: 25%;
    z-index: 1;
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.azure2};
    outline: none;
  }
  &.classic:hover .header-text,
  &.classic:focus .header-text {
    padding-left: 57px;
  }
  &.classic:hover:before,
  &.classic:focus:before {
    display: ${({ clickable }) => (clickable ? 'block' : 'none')};
  }
`
export const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;

  & > .header-text {
    position: relative;
  }
  & > .header-text.active {
    padding: 12px 0px 12px 25px;
  }
  & > .header-text.active:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 10px;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    background-color: ${({ theme }) => theme.green1};
    margin-top: -6px;
  }
`
export const OptionCardIconWrapper = styled.div<{ size?: number | null }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '24px')};
    width: ${({ size }) => (size ? size + 'px' : '24px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium` align-items: flex-end; `};
`
export const DropDownButton = styled(BaseButton) <{ width?: string; borderRadius?: string; selected?: boolean }>`
  align-items: center;
  height: 2.2rem;
  font-size: 20px;
  font-weight: 500;
  background-color: transparent;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;

  &.dark {
    color: ${({ theme }) => theme.azure1};
  }
  &.light {
  }
  &.classic {
    color: ${({ theme }) => theme.azure1};
  }

  &.dark > svg {
    filter: drop-shadow(1px 2px 3px ${({ theme }) => theme.blue3});
  }
  &.light > svg {
  }
  &.classic > svg {
    filter: drop-shadow(1px 2px 3px ${({ theme }) => theme.blue3});
  }
`
export const SwitchButton = styled(Button) <{ disabled?: boolean }>`
  padding: 0px !important;
  border-radius: -0.35rem !important;
  display: inline-block;
  text-align: center;
  border-color: transparent;
  outline: none;
  text-decoration: none;
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;
  position: relative;
  background: none;
  transform: rotate(45deg);
  width: 40px;
  height: 40px;
  cursor: pointer;

  &:disabled,
  &.disabled,
  &.dark.disabled,
  &.light.disabled,
  &.classic.disabled,
  &.dark.disabled:hover,
  &.dark.disabled:focus,
  &.light.disabled:hover,
  &.light.disabled:focus,
  &.classic.disabled:hover,
  &.classic.disabled:focus {
    cursor: auto;
    opacity: 0.4;
    box-shadow: none;
  }
  > * {
    user-select: none;
  }
  &.hidden {
    display: none !important;
  }

  & > svg {
    width: 15px;
    height: 15px;
    transform: rotate(-45deg);
    margin-left: 0px;
    margin-bottom: -3px;
  }
  & > label {
    display: none;
  }

  &:after,
  &:before {
    content: '';
    display: block;
    position: absolute;
    width: 46px;
    height: 1px;
    transform: rotate(-45deg);
  }

  &:after {
    bottom: 44px;
    right: -39px;
  }
  &:before {
    top: 44px;
    left: -39px;
  }

  &.dark {
    border: solid 1px ${({ theme }) => theme.azure1};
    background-color: ${({ theme }) => theme.black};
  }
  &.light {
    border: solid 1px ${({ theme }) => theme.violet1};
    background-color: ${({ theme }) => theme.violet4};
  }
  &.classic {
    transform: none;
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
    color: ${({ theme }) => theme.yellowGreen};
    width: auto;
    height: auto;
    text-align: center;
    margin: 0px auto;
    position: relative;
  }
  &.classic:after,
  &.classic:before,
  &.classic > svg {
    transform: none;
    display: none;
  }
  &.classic > label {
    display: block;
  }
  &.classic:before {
    position: absolute;
    content: ' ';
    display: none;
    width: 57px;
    height: 35px;
    background-image: url(${images.icons.FF7Cursor});
    background-repeat: no-repeat;
    background-position: center center;
    left: -63px;
    top: -3px;
    z-index: 1;
  }

  &.dark:hover,
  &.dark:focus {
  }
  &.light:hover,
  &.light:focus {
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.azure2};
  }
  &.classic:hover:before,
  &.classic:focus:before {
    display: block;
  }

  &.dark:after {
  }
  &.dark:before {
  }

  &.light:after {
  }
  &.light:before {
  }

  &.classic:after {
  }
  &.classic:before {
  }

  &.dark.expert-mode {
    margin-left: 30px;
  }
  &.light.expert-mode {
    margin-left: 30px;
  }

  @media (max-width: 1050px) {
    &.dark.expert-mode,
    &.light.expert-mode {
      margin-left: 146px;
      margin-bottom: 15px;
    }
    &.classic {
      margin-top: 20px;
      margin-bottom: 20px;
    }
  }

  @media (max-width: 600px) {
    &.dark.expert-mode,
    &.light.expert-mode {
      margin-left: 130px;
      margin-bottom: 15px;
    }
  }
`
export const OperationButton = styled(Button) <{ label?: string; disabled?: boolean }>`
  padding: 0px !important;
  border-radius: 0px !important;
  display: inline-block;
  text-align: center;
  border-color: transparent;
  outline: none;
  text-decoration: none;
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;
  position: relative;
  background: none;
  transform: rotate(45deg);
  width: 30px;
  height: 30px;
  cursor: pointer;

  &:disabled, &.disabled, &.dark.disabled, &.light.disabled, &.classic.disabled,
  &.dark.disabled:hover, &.dark.disabled:focus,
  &.light.disabled:hover, &.light.disabled:focus,
  &.classic.disabled:hover, &.classic.disabled:focus { cursor: auto; opacity: 0.4; box-shadow: none; }
  > * { user-select: none; }
  &.hidden { display: none !important; }

  & > svg { width: 15px; height: 15px; transform: rotate(-45deg); margin-left: 0px; margin-bottom: -3px; }
  
  &:after, &:before {
    content: "";
    display:block;
    position:absolute;
    width: 216px;
    height: 1px;
    transform: rotate(-45deg);    
  }

  &.classic, &.classic:after, &.classic:before, &.classic > svg { transform: none; }
  &.classic > svg { display: none; }

  &:after { 
    content: ${({ label }) => (label ? '"' + label + '"' : '"' + +'"')}; 
    bottom: 94px; 
    right: -144px;
    background: transparent;
    text-align: left;
    padding: 106px 0px 0px 41px;
  }

  &:before { bottom: 104px; right: -184px;  }

  &.dark { border: solid 1px ${({ theme }) => theme.azure1}; background-color: ${({ theme }) => theme.black}; }
  &.light { border: solid 1px ${({ theme }) => theme.violet1}; background-color: ${({ theme }) => theme.violet4}; }
  &.classic {}

  &.dark:hover, &.dark:focus { box-shadow: 0px 0px 12px ${({ theme }) => theme.azure1}; }
  &.dark:hover::after { text-shadow: 0px 0px 12px ${({ theme }) => theme.azure1}; }
  &.light:hover, &.light:focus { box-shadow: 0px 0px 12px ${({ theme }) => theme.violet1}; }
  &.light:hover::after { text-shadow: 0px 0px 12px ${({ theme }) => theme.violet1}; }
  &.classic:hover, &.classic:focus { }
  &.classic:hover::after { }

  &.dark:before { background: linear-gradient(to right, ${({ theme }) => theme.azure1} 0%, rgba(15,63,115,0) 100%); }
  &.dark:after {
    font-weight: 500;
    font-size:14px;
    color: ${({ theme }) => theme.azure1};
  }

  &.light:before { background: linear-gradient(to right, ${({ theme }) => theme.violet1} 0%, rgba(15,63,115,0) 100%); }
  &.light:after {
    font-weight: 500;
    font-size:14px;
    color: ${({ theme }) => theme.violet1};
  }  

  &.classic:after {
    top: 0px;
    left: 0px;
    padding: 0px;
    width: 200px;
    height: auto;
    color: ${({ theme }) => theme.yellowGreen}
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
  &.classic:before {
    position: absolute;
    content: " ";
    display: none; 
    width: 57px;
    height: 35px;
    background-image: url(${images.icons.FF7Cursor});
    background-repeat: no-repeat;
    background-position: center center;
    left: -65px;
    top: -3px;
    z-index: 1;
  }
  &.classic:hover:after { color: ${({ theme }) => theme.azure2}; }
  &.classic:hover:before, &.classic:focus:before { display: block; }

  &.add-a-send-button { /*position: absolute; top: 330px; left: 70px;*/ }  
  &.connect-wallet-button { margin-left: -170px; }
  &.wrap-button { margin-left: -190px; }
`

export const SmallOperationButton = styled(SwitchButton) <{ disabled?: boolean }>`
  &.add-a-send-button { /*position: absolute; top: 330px; left: 70px;*/ }  
  &.connect-wallet-button { margin-left: -170px; }
  &.wrap-button { margin-left: -190px; }
`

export const MainOperationButton = styled(ActionButton) <{
  disabled?: boolean
  selected?: boolean
  useCustomProperties?: boolean
}>`
  font-size: 1rem !important;
  padding: .7rem !important;
  border-radius: 16px;

  &:disabled {
    opacity: 0.5;
  }

  &.dark.use-custom-properties.expert-mode:not([disabled]),
  &.dark.popup-button.dismiss,
  &.light.use-custom-properties.expert-mode:not([disabled]),
  &.light.popup-button.dismiss {
    border: 1px solid ${({ theme }) => theme.red1} !important;
    color: ${({ theme }) => theme.red1} !important;
  }

  &.dark,
  &.dark:disabled {
    color: #ffffff !important;
    background-color: #0066ff;
  }

  &.light,
  &.light:disabled {
    color: #ffffff !important;
    background-color: #0066ff;
  }

  &.dark:hover,
  &.dark:focus {
    box-shadow: 0px 0px 4px ${({ theme }) => theme.azure2};
  }
  &.light:hover,
  &.light:focus {
    box-shadow: 0px 0px 4px ${({ theme }) => theme.utils.hexToRGB(theme.grey3, 0.4)};
  }
  &.dark.use-custom-properties.expert-mode:hover,
  &.dark.use-custom-properties.expert-mode:focus,
  &.light.use-custom-properties.expert-mode:hover,
  &.light.use-custom-properties.expert-mode:focus {
    box-shadow: 0px 0px 4px ${({ theme }) => theme.red2};
  }
  &:disabled.dark:hover,
  &:disabled.dark:focus,
  &:disabled.light:hover,
  &:disabled.light:focus {
    box-shadow: none;
  }

  &.light {
  }
  &.classic {
    position: relative;
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
  &.classic:before {
    position: absolute;
    content: ' ';
    display: none;
    width: 57px;
    height: 35px;
    background-image: url(${images.icons.FF7Cursor});
    background-repeat: no-repeat;
    background-position: center center;
    left: -57px;
    top: 0px;
    z-index: 1;
  }
  &.classic.width80:before {
    left: -15px;
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.azure2};
  }
  &.classic:disabled,
  &.classic.popup-button.dismiss:hover,
  &.classic.popup-button.dismiss:focus {
    color: ${({ theme }) => theme.red1};
  }
  &.classic:hover:before,
  &.classic:focus:before {
    display: block;
  }
  &#confirm-expert-mode.classic {
    padding: 20px !important;
  }
  &#confirm-expert-mode.classic:before {
    left: 10px;
    top: 15px;
  }

  &.dark.width-auto,
  &.light.width-auto {
    width: auto !important;
  }

  &.dark.customPercentage {
    font-size: 1rem !important;
    padding: 0.4rem !important;
    margin-top: 1rem;
    width: auto !important;
    margin-right: 0.5rem;
    border: 0px !important;
    color: white !important;
    background: transparent;
  }
  &.light.customPercentage {
    font-size: 1rem !important;
    padding: 0.4rem !important;
    margin-top: 1rem;
    width: auto !important;
    margin-right: 0.5rem;
    border: 0px !important;
    color: black !important;
    background: transparent;
  }
`
export const TradePriceContainer = styled.div`
  margin-top: 250px;
  @media (max-width: 960px) {
    padding-left: 30px;
  }
  @media (max-width: 1050px) {
    margin-top: 10px;
    padding-left: 0px;
  }
  /* @media (max-width: 1920px) { padding-left: 30px; } */
`
export const AddRecipientPanel = styled.div`
  /*position: absolute;
  top: 330px;
  left: 70px;*/
`
export const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 0px;
  background-color: transparent;
  z-index: 1;
  width: 100%;
`
export const ContainerRow = styled.div<{ error?: boolean }>`
  border: none;
  background: none;
  position: relative;

  &.dark {
  }
  &.light {
  }
  &.classic {
  }

  &:after {
    content: '';
    position: absolute;
    width: 0%;
    height: 1px;
    transition: width 0.3s;
    bottom: 0px;
    left: 0px;
  }

  &.dark:after {
    background-color: ${({ theme, error }) => (error ? theme.red2 : theme.azure1)};
  }
  &.light:after {
    background-color: ${({ theme, error }) => (error ? theme.red2 : theme.violet1)};
  }
  &.classic:after {
    background-color: ${({ theme, error }) => (error ? theme.red2 : theme.grey2)};
  }

  &:hover::after {
    width: 100%;
  }

  & > div.input-container {
    flex: 1;
    padding: 3px;
  }
  & > div.input-container > label,
  & > div.input-container > a {
    font-size: 13px;
    font-weight: 500;
    display: block;
    float: right;
    margin: 0px 0px 10px 10px;
  }

  & > div.input-container > label.aligned-left {
    float: none;
    margin-left: 0px;
  }

  & > div.input-container.classic > label,
  & > div.input-container.classic > a {
    float: left;
    margin-left: 0px;
  }

  &.dark > div.input-container > a {
    color: ${({ theme }) => theme.azure1};
  }
  &.light > div.input-container > a {
    color: ${({ theme }) => theme.violet1};
  }
  &.classic > div.input-container > a {
    color: ${({ theme }) => theme.azure1};
  }

  &.search-token-container {
    margin-bottom: 20px;
  }

  &.dark.search-token-container {
    border-bottom: solid 1px ${({ theme }) => theme.utils.hexToRGB(theme.white, 0.2)};
  }
  &.light.search-token-container {
    border-bottom: solid 1px ${({ theme }) => theme.utils.hexToRGB(theme.white, 0.2)};
  }
  &.classic.search-token-container {
    border-bottom: solid 1px ${({ theme }) => theme.utils.hexToRGB(theme.white, 0.2)};
  }
`
export const Input = styled.input<{ error?: boolean }>`
  font-size: 16px;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: transparent;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  width: 100%;
  padding: 0px;
  -webkit-appearance: textfield;

  &.dark {
    color: ${({ error, theme }) => (error ? theme.red1 : theme.white)};
  }
  &.light {
  }
  &.classic {
  }
`
export const SearchTokenInput = styled(Input)`
  padding-bottom: 10px;
  font-weight: 300;
`
export const SearchInput = styled(SearchTokenInput)`
  padding-bottom: 10px;
  font-weight: 300;
`
export const SwapButtonsContainer = styled.div`
  justify-content: center;
  display: flex;
  padding: 1rem 0rem;
  width: auto;

  &.has-error {
    display: block;
    text-align: center;
  }
`
export const BatchSwapButtonsContainer = styled.div`
  justify-content: center;
  display: flex;
  padding: 1rem 0rem;
  width: auto;

  &.has-error {
    display: block;
    text-align: center;
  }
`
export const SecondaryPanelBoxContainer = styled.div`
  padding: 5px;
  position: relative;
  z-index: 2;

  &.dark {
  }
  &.light {
  }
  &.classic {
  }

  &.dark > .inner-content,
  &.light > .inner-content,
  &.classic > .inner-content {
    border-radius: 0.65rem;
    width: 100%;
    padding: 5px 5px 5px 5px;
    background-size: cover;
  }

  &.dark > .inner-content {
    background-color: #1a1a1a;
  }
  &.light > .inner-content {
    background-color: #f5f5fe;
  }
  &.classic > .inner-content {
    background: linear-gradient(
      0deg,
      ${({ theme }) => theme.utils.hexToRGB(theme.violet6, 1)} 100%,
      ${({ theme }) => theme.utils.hexToRGB(theme.violet7, 1)} 100%
    );
    border-radius: 1rem;
    border: solid 2px #424542;
    box-shadow: 1px 1px #e7dfe7, -1px -1px #e7dfe7, 1px -1px #e7dfe7, -1px 1px #e7dfe7, 0 -2px #9c9a9c, -2px 0 #7b757b,
      0 2px #424542;
  }

  &.modal > .inner-content {
    height: 100%;
  }

  ${({ theme }) =>
    theme.mediaWidth.upToSmall`&.popup{ min-width: 290px; } &.popup:not(:last-of-type) { margin-right: 20px; } `}

  &.popup > .popup-inner-content, &.modal > .modal-inner-content {
    padding: 10px 20px;
  }

  @media (max-width: 1050px) {
    &.modal > .modal-inner-content {
      width: 95vw;
      margin: 0 auto;
      padding: 0;
    }
    .connect-wallet-modal {
      padding: 10px 20px;
    }
    & .popup-close-icon,
    & .modal-close-icon {
      right: 20px;
      top: 10px;
    }
  }

  &.popup > .popup-inner-content h6 {
    font-size: 13px;
    margin: 0px 0px 15px 0px;
  }
  &.popup > .popup-inner-content h6 + ul {
    font-size: 13px;
  }
  &.classic.popup > .popup-inner-content h6 + ul {
    line-height: 1.5em;
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
  &.classic.popup > .popup-inner-content h6 + ul strong {
  }

  &.modal > .modal-inner-content h6 {
    font-size: 15px;
    margin: 0px 0px 15px 0px;
  }
  &.classic.modal > .modal-inner-content h6,
  &.classic.popup > .popup-inner-content h6 {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
  &.modal > .modal-inner-content h6.with-content-divisor {
    position: relative;
    padding-bottom: 15px;
  }
  &.modal > .modal-inner-content h6.with-content-divisor:after {
    content: '';
    display: block;
    position: absolute;
    bottom: 1px;
    left: 0px;
    width: 100%;
    height: 1px;
  }

  &.dark.modal > .modal-inner-content h6.with-content-divisor:after {
    background-color: ${({ theme }) => theme.azure1};
  }
  &.light.modal > .modal-inner-content h6.with-content-divisor:after {
    background-color: ${({ theme }) => theme.violet3};
  }
  &.classic.modal > .modal-inner-content h6.with-content-divisor:after {
    background-color: ${({ theme }) => theme.grey2};
  }

  &.popup > .popup-inner-content .popup-operations-container {
    /*overflow: hidden;*/
    padding-top: 15px;
  }
  &.popup > .popup-inner-content .popup-operations-container button {
    font-size: 12px !important;
  }
  &.popup > .popup-inner-content .popup-operations-container button:last-child {
    float: right;
  }
  &.classic.popup > .popup-inner-content .popup-operations-container button {
  }

  &.dark.popup > .popup-inner-content h6,
  &.dark.modal > .modal-inner-content h6 {
    color: ${({ theme }) => theme.azure1};
  }
  &.dark.popup > .popup-inner-content h6 svg,
  &.dark.modal > .modal-inner-content h6 svg {
    stroke: ${({ theme }) => theme.azure1};
  }
  &.light.popup > .popup-inner-content h6,
  &.light.modal > .modal-inner-content h6 {
  }
  &.classic.popup > .popup-inner-content h6,
  &.classic.modal > .modal-inner-content h6 {
    color: ${({ theme }) => theme.azure1};
    letter-spacing: 0.15em;
    line-height: 1.4em;
  }
  &.classic.popup > .popup-inner-content h6 svg,
  &.classic.modal > .modal-inner-content h6 svg {
    stroke: ${({ theme }) => theme.azure1};
  }

  &.modal > .modal-inner-content .modal-content-wrapper > .connect-wallet-terms-and-conditions {
    display: flex;
    margin-bottom: 15px;
    padding: 15px 0px 15px 0px;
  }

  &.modal > .modal-inner-content .modal-content-wrapper > .connect-wallet-terms-and-conditions > label {
    font-size: 15px;
  }
  &.modal > .modal-inner-content .modal-content-wrapper > .connect-wallet-terms-and-conditions > label > input {
    margin-right: 10px;
  }
  &.modal > .modal-inner-content .modal-content-wrapper > .connect-wallet-terms-and-conditions.classic > label {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }

  &.modal > .modal-inner-content .modal-content-wrapper.connecting-wallet-modal .option-card-clickable {
    width: 100%;
  }

  &.dark.modal > .modal-inner-content .modal-content-wrapper > .connect-wallet-terms-and-conditions {
    border-top: solid 1px ${({ theme }) => theme.azure1};
    border-bottom: solid 1px ${({ theme }) => theme.azure1};
  }

  &.light.modal > .modal-inner-content {
    box-shadow: 0px 0px 16px ${({ theme }) => theme.utils.hexToRGB(theme.grey3, 0.4)};
  }
  &.light.modal > .modal-inner-content .modal-content-wrapper > .connect-wallet-terms-and-conditions {
  }

  &.classic.modal > .modal-inner-content .modal-content-wrapper > .connect-wallet-terms-and-conditions {
  }

  &.settings-menu-panel {
    min-width: 20.125rem;
    display: flex;
    flex-direction: column;
    font-size: 1rem;
    position: absolute;
    top: -21rem;
    right: 1rem;
    z-index: 100;

    ${({ theme }) => theme.mediaWidth.upToExtraSmall` min-width: 18.125rem; right: -46px; `};
    ${({ theme }) =>
    theme.mediaWidth
      .upToMedium` min-width: 18.125rem; top: -22rem; right: -2px; @media (max-width: 1050px) { top: -19.5rem; } `};
  }

  &.settings-menu-panel.classic {
  }

  &.settings-menu-panel .sectionHeader {
    font-weight: 500;
    font-size: 14px;
  }
  &.settings-menu-panel .sectionOption {
    font-weight: 500;
    font-size: 14px;
  }

  &.settings-menu-panel.classic .sectionHeader.classic {
    color: ${({ theme }) => theme.azure1};
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }

  &.dark.settings-menu-panel .sectionOption {
    color: ${({ theme }) => theme.grey2};
  }
  &.light.settings-menu-panel .sectionOption {
    color: ${({ theme }) => theme.violet1};
  }
  &.classic.settings-menu-panel .sectionOption {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }

  &.light.popup > .popup-inner-content,
  &.light.settings-menu-panel > .inner-content {
    box-shadow: 0px 0px 16px ${({ theme }) => theme.utils.hexToRGB(theme.grey3, 0.4)};
  }

  @media (max-width: 1050px) {
    &.dark {
      border: none;
    }
    padding: 0px;
  }
`
export const SecondaryPanelBoxContainerExtraDecorator = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: -1;
  top: 0px;
  left: 0px;

  &.top {
    top: 0px;
    left: 0px;
  }
  &.bottom {
    bottom: 0px;
    left: 0px;
    transform: scaleX(-1);
  }

  &:before,
  &:after {
    position: absolute;
    content: ' ';
    display: block;
    width: 12px;
    height: 12px;
    background-color: transparent;
    background-size: 100% 100%;
    opacity: 1;
  }

  &:before {
    top: -8px;
    left: -8px;
  }
  &:after {
    bottom: -8px;
    right: -8px;
    transform: rotate(180deg);
  }

  &.dark:before {
    background-image: url(${images.decorators.smallBoxes.dark});
    background-position: left top;
    background-repeat: no-repeat;
  }
  &.dark:after {
    background-image: url(${images.decorators.smallBoxes.dark});
    background-position: left top;
    background-repeat: no-repeat;
  }

  &.light:before {
  }
  &.light:after {
  }

  &.classic:before {
  }
  &.classic:after {
  }

  @media (max-width: 1050px) {
    &:before,
    &:after {
      display: none;
    }
  }
`
export const WalletConnectorsContainer = styled.div`
  display: grid;
  grid-gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium` grid-template-columns: 1fr; grid-gap: 10px; `};
`
const Fader = styled.div`
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 100%;
  height: 2px;
`
export const AnimatedFader = animated(Fader)

export const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  display: ${({ show }) => (show ? 'block' : 'none')};
  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  width: 100%;
  z-index: -1;
  transition: transform 300ms ease-in-out;
  @media (max-width: 1050px) {
    padding-left: -2rem !important;
  }
`
const AnimatedDialogOverlay = animated(DialogOverlay)
export const ThemedDialogOverlay = styled(AnimatedDialogOverlay)`
  &[data-reach-dialog-overlay] {
    z-index: 2;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.dark[data-reach-dialog-overlay] {
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.black, 1)};
  }
  &.light[data-reach-dialog-overlay] {
  }
  &.classic[data-reach-dialog-overlay] {
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.black, 1)};
  }
`
const AnimatedDialogContent = animated(DialogContent)
export const ThemedDialogContent = styled(({ minHeight, maxHeight, mobile, isOpen, ...rest }) => (
  <AnimatedDialogContent {...rest} />
)).attrs({ 'aria-label': 'dialog' })`
  overflow-y: ${({ mobile }) => (mobile ? 'scroll' : 'hidden')};

  &[data-reach-dialog-content] {
    background-color: transparent;
    margin: 0 0 2rem 0;
    padding: 0px;
    width: 50vw;
    overflow-y: ${({ mobile }) => (mobile ? 'scroll' : 'hidden')};
    overflow-x: hidden;
    align-self: ${({ mobile }) => (mobile ? 'flex-end' : 'center')};
    max-width: 420px;
    ${({ maxHeight }) =>
    maxHeight &&
    css`
        max-height: ${maxHeight}vh;
      `}
    ${({ minHeight }) =>
    minHeight &&
    css`
        min-height: ${minHeight}vh;
      `}
    display: flex;
    ${({ theme }) => theme.mediaWidth.upToMedium` width: 65vw; margin: 0; `}
    ${({ theme, mobile }) =>
    theme.mediaWidth.upToSmall` width:  85vw; ${mobile &&
      css`
          width: 100vw;
        `} `}
  }

  @media (max-width: 1050px) {
    display: block !important;
    width: 100vw !important;
    max-width: 100% !important;
  }

  &[data-reach-dialog-content] > .token-selection-content-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    flex: 1 1 0%;
    padding: 10px 20px;
  }

  &[data-reach-dialog-content] > .token-selection-content-container .modal-close-icon {
    right: 0px;
    top: 0px;
  }
  &[data-reach-dialog-content] > .token-selection-content-container .modal-close-icon.confirmation-modal-close-icon {
    right: 20px;
    top: 15px;
  }
  &[data-reach-dialog-content] > .token-selection-content-container > .confirmation-modal-content img.tokenLogo {
    margin-top: 0px;
  }
`
export const SearchTokenFormItems = styled(AutoColumn)`
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: 10px;
  position: relative;
  padding: 0px 0px 15px 0px;
  margin-bottom: 15px;

  &.dark {
    border-bottom: solid 1px ${({ theme }) => theme.azure1};
  }
  &.light {
    border-bottom: solid 1px ${({ theme }) => theme.violet3};
  }
  &.classic {
    border-bottom: solid 1px ${({ theme }) => theme.grey2};
  }

  & + .tokens-list-container {
    flex: 1 1 0%;
  }
  & + .tokens-list-container.dark {
    border-bottom: solid 1px ${({ theme }) => theme.azure1};
  }
  & + .tokens-list-container.light {
    border-bottom: solid 1px ${({ theme }) => theme.violet3};
  }
  & + .tokens-list-container.classic {
    border-bottom: solid 1px ${({ theme }) => theme.grey2};
  }

  & + .tokens-list-container img.ethereumLogo,
  & + .tokens-list-container img.logo {
    margin-top: 0px;
  }
`

export const InfoBox = styled.div`
  padding: 10px;
  border-radius: 0.65rem;
  margin: 10px auto;

  &.dark {
  }
  &.light {
  }
  &.classic {
  }

  &.dark.info {
    border: solid 1px ${({ theme }) => theme.azure1};
    color: ${({ theme }) => theme.azure1};
  }
  &.light.info {
  }
  &.classic.info {
  }

  &.dark.warning {
    border: solid 1px ${({ theme }) => theme.yellowGreen};
    color: ${({ theme }) => theme.yellowGreen};
  }
  &.light.warning {
  }
  &.classic.warning {
  }

  &.dark.error {
    border: solid 1px ${({ theme }) => theme.red1};
    color: ${({ theme }) => theme.red1};
  }
  &.light.error {
  }
  &.classic.error {
  }
`
export const ModalCaption = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin: 20px auto;
  font-size: 15px;

  &.classic {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
`
export const LoaderBoxContainer = styled.div``
export const StyledLoader = styled(Loader)`
  margin-right: 10px;
`
export const LoadingMessage = styled.div<{ error?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
  color: ${({ theme, error }) => (error ? theme.red1 : theme.azure1)};
  & > * {
    padding: 10px;
  }
`
export const LoaderErrorGroup = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
`
export const LoaderErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg4};
  margin-left: 1rem;
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;

  &:hover {
    cursor: pointer;
  }
`
export const LoadingWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: center;
`
const SettingsMenuOptionBase = styled.button`
  align-items: center;
  height: 2rem;
  border-radius: 0.65rem;
  width: auto;
  min-width: 3.5rem;
  outline: none;
  background-color: transparent;
  border: solid 1px;

  &:hover,
  &:focus {
  }

  &.dark {
    border-color: #2f9ab8;
    color: ${({ theme }) => theme.white};
  }
  &.light {
    border-color: ${({ theme }) => theme.violet1};
    color: ${({ theme }) => theme.violet1};
  }
  &.classic {
  }

  &.dark:hover,
  &.dark:focus {
    border-color: ${({ theme }) => theme.azure1};
    background-color: ${({ theme }) => theme.grey4};
  }
  &.light:hover,
  &.light:focus {
    background-color: ${({ theme }) => theme.white};
    color: ${({ theme }) => theme.violet1};
  }
  &.classic:hover,
  &.classic:focus {
    background-color: ${({ theme }) => theme.white};
    border-color: ${({ theme }) => theme.yellowGreen};
    color: ${({ theme }) => theme.blue4};
  }
`
export const SettingsMenuOption = styled(SettingsMenuOptionBase) <{ active: boolean }>`
  margin-right: 8px;

  &.dark {
    background-color: ${({ active, theme }) => active && theme.grey4};
  }
  &.light {
    background-color: ${({ active, theme }) => active && theme.white};
  }
  &.classic {
    background-color: ${({ active, theme }) =>
    active ? theme.utils.hexToRGB(theme.white, 1) : theme.utils.hexToRGB(theme.white, 0.8)};
  }
`
export const SettingsMenuCustomOption = styled(SettingsMenuOptionBase) <{ active?: boolean; warning?: boolean }>`
  height: 2rem;
  position: relative;
  padding: 0 0.75rem;
  flex: 1;
  border: ${({ theme, active, warning }) => active && `1px solid ${warning ? theme.red1 : theme.primary1}`};

  &:hover {
    border: ${({ theme, active, warning }) => active && `1px solid ${warning ? theme.red1 : theme.primary1}`};
  }

  & input {
    width: 80%;
    height: 100%;
    border: none;
    background-color: transparent;
    outline: none;
    text-align: right;
  }

  &.dark input {
    color: ${({ theme }) => theme.white};
  }
  &.light input {
    color: ${({ theme }) => theme.violet1};
  }
  &.classic input {
    color: ${({ theme }) => theme.blue4};
  }
  &.classic {
    color: ${({ theme }) => theme.blue4};
    background-color: ${({ active, theme }) =>
    active ? theme.utils.hexToRGB(theme.white, 1) : theme.utils.hexToRGB(theme.white, 0.8)};
  }

  & + .minutes {
    padding-left: 8px;
    font-size: 14px;
  }
  &.classic + .minutes {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
`
export const SettingsMenuCustomOptionInput = styled.input`
  color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};
`
export const ToggleButton = styled(SettingsMenuOptionBase) <{ isActive?: boolean; activeElement?: boolean }>`
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 0;

  &.dark {
    background: ${({ theme }) => theme.bg6};
  }
  &.light {
    background: ${({ theme }) => theme.utils.hexToRGB(theme.grey2, 0.3)};
  }
  &.light:hover span:not(.active) {
    color: ${({ theme }) => theme.violet1};
  }

  &.classic {
  }
`
export const ToggleButtonElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  border-radius: .65rem;
  padding: 0.35rem 0.6rem;
  background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.bg7 : theme.text4) : 'none')};
  font-weight: 500;
  :hover { user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')}; }

  &.dark { 
    color: ${({ theme }) => theme.white};
    background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? '#002852' : '#565A69') : 'none')};
  }
  &.light {
    color: ${({ theme }) => theme.white};
    background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.violet1 : '#C3C5CB') : 'none')};
  }
  &.classic {
    background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? '#002852' : '#565A69') : 'none')};
  }

  &.dark:hover {
    background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? '#002852' : '#565A69') : 'none')}
    color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? '' : '#C3C5CB') : theme.text3)};
  }

  &.light:hover {
    background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? '#002852' : '#002852') : 'none')}
    color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? '#565A69' : '#565A69') : theme.text3)};
  }

  &.classic:hover {
    background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? '#002852' : '#565A69') : 'none')}
    color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? '' : '#C3C5CB') : theme.text3)};
  }
`
export const PaddedColumn = styled(AutoColumn)`
  padding: 20px;
  padding-bottom: 12px;
`
export const SearchTokenListItem = styled(RowBetween)`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(auto, 1fr) auto minmax(0, 72px);
  grid-gap: 16px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
  border-radius: 0.65rem;
  margin-bottom: 15px;

  &.dark {
    color: ${({ theme }) => theme.azure2} !important;
  }
  &.dark:disabled,
  &.light:disabled {
    opacity: 0.5;
    cursor: pointer;
  }

  &.dark:hover,
  &.dark:focus {
    border: 1px solid ${({ theme }) => theme.azure2} !important;
    background-color: ${({ theme }) => theme.blue3};
    box-shadow: 0px 0px 4px ${({ theme }) => theme.azure2};
  }

  &.light {
    color: ${({ theme }) => theme.violet1} !important;
  }

  &.light:hover,
  &.light:focus {
    border: 1px solid ${({ theme }) => theme.violet1} !important;
    background-color: ${({ theme }) => theme.violet3};
    box-shadow: 0px 0px 4px ${({ theme }) => theme.utils.hexToRGB(theme.black, 0.4)};
  }

  &.classic {
    position: relative;
  }
  &.classic:before {
    position: absolute;
    content: ' ';
    display: none;
    width: 57px;
    height: 35px;
    background-image: url(${images.icons.FF7Cursor});
    background-repeat: no-repeat;
    background-position: center center;
    left: 0px;
    top: 25%;
    z-index: 1;
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.azure2};
  }
  &.classic:hover:before,
  &.classic:focus:before {
    display: block;
  }
  &.classic > img {
    transition: margin-left 1s;
  }
  &.classic:hover > img,
  &.classic:focus > img {
    margin-left: 52px;
  }
`
export const ModalContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  &.claming {
    display: grid;
    grid-template-columns: 100%;
    text-align: center;
    width: 100%;
  }

  & img.claimedIcon {
    max-width: 100px;
    margin-top: 25px;
  }
  & img.gilIcon {
    max-width: 100px;
    margin-top: 25px;
  }
  & > .modal-content-wrapper-inner-container {
    position: relative;
    padding: 10px 20px;
  }

  @media (max-width: 1050px) {
    /* margin: 5px; */
    & > .modal-content-wrapper-inner-container {
    }
  }
`
export const SimpleModalContentWrapper = styled.div`
  width: 100%;
`
export const EmptyProposals = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &.dark {
    color: ${({ theme }) => theme.azure1};
  }
  &.light {
  }
  &.classic {
  }
`
export const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`
export const StyledPositionCard = styled(Box) <{ bgColor: any }>`
  border: none;
  border-radius: 16px;
  position: relative;
  overflow: hidden;

  &.dark {
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.white, 0.1)};
  }
  &.light {
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.violet3, 0.2)};
  }
  &.classic {
    background-color: ${({ theme }) => theme.utils.hexToRGB(theme.black, 0.2)};
  }
`
export const RemoveLiquiditySliderItemContainer = styled.div`
  & .title {
    margin: 0px;
    font-weight: 400;
    font-size: 16px;
  }
  & .slider-percentage {
    font-size: 72px;
    font-weight: 500;
  }

  &.dark {
  }
  &.light {
  }
  &.classic {
  }
  &.classic .title {
    font-size: 13px;
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
    line-height: 1.5em;
  }
  &.classic .slider-percentage {
    font-size: 50px;
    font-weight: normal;
    margin-top: 15px;
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
`
export const RemoveLiquidityCustomText = styled.div`
  font-size: 24px;
  font-weight: 400;
`
export const StyledRangeInput = styled.input`
  -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
  width: 100%; /* Specific width is required for Firefox. */
  background: transparent; /* Otherwise white in Chrome */
  cursor: pointer;

  &:focus {
    outline: none;
  }
  &::-moz-focus-outer {
    border: 0;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 14px;
    width: 14px;
    border-radius: 100%;
    border: none;
    transform: translateY(-50%);

    &:hover,
    &:focus {
      box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.1), 0px 4px 8px rgba(0, 0, 0, 0.08), 0px 16px 24px rgba(0, 0, 0, 0.06),
        0px 24px 32px rgba(0, 0, 0, 0.04);
    }
  }

  &.dark::-webkit-slider-thumb {
    background-color: ${({ theme }) => theme.azure1};
    color: ${({ theme }) => theme.azure1};
  }
  &.light::-webkit-slider-thumb {
    background-color: ${({ theme }) => theme.black};
    color: ${({ theme }) => theme.black};
  }
  &.classic::-webkit-slider-thumb {
    background-color: ${({ theme }) => theme.azure1};
    color: ${({ theme }) => theme.azure1};
  }

  &::-moz-range-thumb {
    height: 14px;
    width: 14px;
    border-radius: 100%;
    border: none;

    &:hover,
    &:focus {
      box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.1), 0px 4px 8px rgba(0, 0, 0, 0.08), 0px 16px 24px rgba(0, 0, 0, 0.06),
        0px 24px 32px rgba(0, 0, 0, 0.04);
    }
  }

  &.dark::-moz-range-thumb {
    background-color: ${({ theme }) => theme.azure1};
    color: ${({ theme }) => theme.azure1};
  }
  &.light::-moz-range-thumb {
  }
  &.classic::-moz-range-thumb {
  }

  &::-ms-thumb {
    height: 14px;
    width: 14px;
    border-radius: 100%;

    &:hover,
    &:focus {
      box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.1), 0px 4px 8px rgba(0, 0, 0, 0.08), 0px 16px 24px rgba(0, 0, 0, 0.06),
        0px 24px 32px rgba(0, 0, 0, 0.04);
    }
  }

  &.dark::-ms-thumb {
    background-color: ${({ theme }) => theme.azure1};
    color: ${({ theme }) => theme.azure1};
  }
  &.light::-ms-thumb {
  }
  &.classic::-ms-thumb {
  }

  &.dark::-webkit-slider-runnable-track {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)},
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)}
    );
    height: 2px;
  }

  &.light::-webkit-slider-runnable-track {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)},
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)}
    );
    height: 2px;
  }

  &.classic::-webkit-slider-runnable-track {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)},
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)}
    );
    height: 2px;
  }

  &.dark::-moz-range-track {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)},
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)}
    );
    height: 2px;
  }

  &.light::-moz-range-track {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)},
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)}
    );
    height: 2px;
  }

  &.classic::-moz-range-track {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)},
      ${({ theme }) => theme.utils.hexToRGB(theme.azure1, 1)}
    );
    height: 2px;
  }

  &::-ms-track {
    width: 100%;
    border-color: transparent;
    color: transparent;
    height: 2px;
  }

  &.dark::-ms-track {
    background: ${({ theme }) => theme.azure1};
  }
  &.dark::-ms-fill-lower {
    background: ${({ theme }) => theme.azure1};
  }
  &.dark::-ms-fill-upper {
    background: ${({ theme }) => theme.azure1};
  }

  &.light::-ms-track {
    background: ${({ theme }) => theme.azure1};
  }
  &.light::-ms-fill-lower {
    background: ${({ theme }) => theme.azure1};
  }
  &.light::-ms-fill-upper {
    background: ${({ theme }) => theme.azure1};
  }

  &.classic::-ms-track {
    background: ${({ theme }) => theme.azure1};
  }
  &.classic::-ms-fill-lower {
    background: ${({ theme }) => theme.azure1};
  }
  &.classic::-ms-fill-upper {
    background: ${({ theme }) => theme.azure1};
  }
`
export const FooterControls = styled.div`
  font-size: small;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;
  max-width: 1200px;
  z-index: 2;
  width: 100%;

  @media (max-width: 1050px) {
    max-width: 90%;
  }
  @media (max-width: 1200px) {
    max-width: 90%;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    width: 100%;
    max-width: 1050px;
    padding: 0rem 0.5rem;
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    z-index: 99;
    height: 72px;
    // border-radius: 12px 12px 0 0;
    ${({ theme }) => theme.backgroundContainer2}
  `};

  &.classic {
  }
`
export const FooterElement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium` flex-direction: row-reverse; align-items: center; `};
`
export const FooterElementClock = styled.div`
  display: flex;
  width: 10%;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium` flex-direction: row-reverse; align-items: center; `};

  @media (max-width: 1050px) {
    display: none !important;
  }

  & svg.footer-icon {
    width: 15px;
    height: 15px;
    margin-top: -1px;
    vertical-align: middle;
    margin-right: 3px;
  }

  & svg.footer-icon.dark {
    stroke: ${({ theme }) => theme.azure1};
    color: ${({ theme }) => theme.azure1};
  }
  & svg.footer-icon.light {
    stroke: ${({ theme }) => theme.violet1};
    color: ${({ theme }) => theme.violet1};
  }
  & svg.footer-icon.classic {
  }
`
export const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall` display: none; `};
`
export const HideExtraSmall = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall` display: none; `};
`
export const FooterElementWrap = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;

  &.classic > .theme-icon {
    display: none;
  }
`
export const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  width: 100%;
`
export const StyledInput = styled.input<{ error?: boolean; fontSize?: string; align?: string }>`
  color: ${({ error, theme }) => (error ? theme.red1 : theme.text1)};
  width: 0;
  position: relative;
  font-weight: 500;
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: transparent;
  font-size: ${({ fontSize }) => fontSize ?? '24px'};
  text-align: ${({ align }) => align && align};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px;
  -webkit-appearance: textfield;
  [type='number'] {
    -moz-appearance: textfield;
  }

  // @media (max-width: 450px) {
  //   margin-left: -4rem;
  // }

  &.classic {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
  }
`
export const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
  }

  svg {
    margin-top: 2px;
  }
`
export const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`
export const SettingsFlyout = styled.span`
  background-color: ${({ theme }) => theme.bg2};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 16px;
  padding: 0.5rem;
  font-size: 1rem;
  position: absolute;
  top: 2rem;
  right: 0rem;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToMedium` top: -12rem; `};

  &.classic {
    box-shadow: none;
    min-width: 12rem;
    background: linear-gradient(
      0deg,
      ${({ theme }) => theme.utils.hexToRGB(theme.blue6, 1)} 0%,
      ${({ theme }) => theme.utils.hexToRGB(theme.blue5, 1)} 100%
    );
    border-radius: 1rem;
    border: solid 2px #424542;
    box-shadow: 1px 1px #e7dfe7, -1px -1px #e7dfe7, 1px -1px #e7dfe7, -1px 1px #e7dfe7, 0 -2px #9c9a9c, -2px 0 #7b757b,
      0 2px #424542;
  }
`
export const MenuFlyout = styled.span`
  min-width: 8.125rem;
  background-color: ${({ theme }) => theme.bg2};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 16px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: -13rem;
  right: 0rem;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToMedium` top: -17.25rem; `};

  &.classic {
    box-shadow: none;
    min-width: 12rem;
    background: linear-gradient(
      0deg,
      ${({ theme }) => theme.utils.hexToRGB(theme.blue6, 1)} 0%,
      ${({ theme }) => theme.utils.hexToRGB(theme.blue5, 1)} 100%
    );
    border-radius: 1rem;
    border: solid 2px #424542;
    box-shadow: 1px 1px #e7dfe7, -1px -1px #e7dfe7, 1px -1px #e7dfe7, -1px 1px #e7dfe7, 0 -2px #9c9a9c, -2px 0 #7b757b,
      0 2px #424542;
  }
`
export const MenuItem = styled(ExternalLink)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
    width: 14px;
    height: 14px;
  }

  &.classic {
    color: ${({ theme }) => theme.white};
  }
  &.classic:hover {
    color: ${({ theme }) => theme.yellowGreen};
  }
  &.classic:hover > svg {
    stroke: ${({ theme }) => theme.yellowGreen};
  }
`
export const InfoLink = styled(ExternalLink)`
  width: 100%;
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.text1};

  &.classic {
    margin: 10px auto;
  }
  &.classic:hover,
  &.classic:focus {
    color: ${({ theme }) => theme.yellowGreen};
  }
`
export const QuestionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;
  background-color: ${({ theme }) => theme.transparent};
  color: ${({ theme }) => theme.text2};

  :hover,
  :focus {
    opacity: 0.7;
  }
`
export const LightQuestionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;
  width: 24px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.1);
  color: ${({ theme }) => theme.white};

  :hover,
  :focus {
    opacity: 0.7;
  }
`
export const QuestionMark = styled.span`
  font-size: 1rem;
`
export const TooltipContainer = styled.div`
  width: 228px;
  padding: 0.6rem 1rem;
  line-height: 150%;
  font-weight: 400;
`
export const SwapCallbackErrorContainer = styled.div`
  align-items: center;
  width: 100%;
  color: ${({ theme }) => theme.red1};
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 20px;

  & > div > svg {
    stroke: ${({ theme }) => theme.red1};
    width: 20px;
    height: 20px;
  }
`
export const BatchSwapCallbackErrorContainer = styled.div`
  align-items: center;
  width: 100%;
  color: ${({ theme }) => theme.red1};
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 20px;

  & > div > svg {
    stroke: ${({ theme }) => theme.red1};
    width: 20px;
    height: 20px;
  }
`
export const CountdownContainer = styled.div`
  font-size: 30px;
  font-weight: 900;

  &.dark {
    color: ${({ theme }) => theme.white};
  }
  &.light {
    color: ${({ theme }) => theme.grey1};
  }
  &.classic {
    text-shadow: 1px 1px 1px ${({ theme }) => theme.black};
    line-height: 1.5em;
  }

  @media (max-width: 1050px) {
    font-size: small;
    &.classic {
    }
  }
`
export const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
`
export const Divider = styled.hr`
  float: none;
  clear: both;
  height: 1px;
  margin: 20px 0px 20px 0px;
  border: none;
  border-bottom: solid 1px;

  &.dark {
    border-color: ${({ theme }) => theme.azure1};
  }
  &.light {
    border-color: ${({ theme }) => theme.violet1};
  }
  &.classic {
    border-color: ${({ theme }) => theme.white};
  }

  &.reduced-margins {
    margin: 10px 0px 10px 0px;
  }
`
