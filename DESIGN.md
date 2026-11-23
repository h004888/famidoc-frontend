---
name: Clinical Prestige
description: Hệ thống thiết kế y tế gia đình FamiDoc Pro — tin cậy lâm sàng, rõ ràng và gần gũi.
colors:
  primary: '#00258b'
  primary-container: '#0037c1'
  on-primary: '#ffffff'
  primary-fixed: '#dde1ff'
  secondary-container: '#fe8f1a'
  on-secondary: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  success-text: '#03864b'
  surface: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  on-surface: '#131b2f'
  on-surface-variant: '#444654'
  outline: '#707282'
  outline-variant: '#c4c5d7'
  background: '#ffffff'
  on-background: '#0a1e30'
  dashboard-canvas: '#f5f6f8'
typography:
  display:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  md: 0.625rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
components:
  button-primary:
    backgroundColor: '{colors.primary-container}'
    textColor: '{colors.on-primary}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: 8px 16px
    height: 36px
  button-outline:
    backgroundColor: '{colors.surface-container-lowest}'
    textColor: '{colors.on-background}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: 8px 16px
    height: 36px
  input-default:
    backgroundColor: '{colors.surface-container-lowest}'
    textColor: '{colors.on-background}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: 4px 12px
    height: 36px
  card-default:
    backgroundColor: '{colors.surface-container-lowest}'
    textColor: '{colors.on-background}'
    rounded: '{rounded.xl}'
    padding: 24px 0
---

# Design

<!-- impeccable:design-map -->
Name: Clinical Prestige
Colors: primary-container #0037c1, primary #00258b, secondary-container #fe8f1a, success-text #03864b, error #ba1a1a, background #ffffff, dashboard-canvas #f5f6f8 (+13 tokens in frontmatter)
Fonts: Be Vietnam Pro (display, headline, title, body, label; 13-step detail in .impeccable/design-full.md)
Radius: sm 0.5rem, md 0.625rem, lg 0.75rem, xl 1rem, full 9999px
Components: button-primary, button-outline, input-default, card-default (HTML/CSS in .impeccable/design.json)
Full: .impeccable/design-full.md (read a section when you need its detail)
