export const APP_SLOGAN =
  process.env.NEXT_PUBLIC_APP_SLOGAN ||
  'ARDMS, CAMRT, ARRT, Sonography Canada, CCI, CPD. #1 Imaging Registry Prep Platform and CPD'

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'RadPreps'

export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  'Gamified Exam Preparation and Continuous Learning'

export const APP_COPYRIGHT =
  process.env.NEXT_PUBLIC_APP_COPYRIGHT ||
  `Copyright © 2026 ${APP_NAME}. All rights reserved.`

export const PAGE_SIZE = Number(process.env.NEXT_PUBLIC_PAGE_SIZE || 10)
