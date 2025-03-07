import clsx from 'clsx'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'

import { isProduction } from '@/helper/is-production'

export const features = {
  edtrPasteHack: {
    cookieName: 'useEdtrPasteHack',
    isActive: false,
    activeInDev: true,
    hideInProduction: true,
  },
  legacyDesign: {
    cookieName: 'useFrontend',
    isActive: false,
    activeInDev: false,
    hideInProduction: false,
  },
}

const showExperimentsStorageKey = 'showExperiments'

type FeatureKey = keyof typeof features

export function shouldUseFeature(featureKey: FeatureKey) {
  if (typeof window === 'undefined' || !Object.hasOwn(features, featureKey))
    return false

  const feature = features[featureKey]

  const hasYesCookie = document.cookie.includes(feature.cookieName + '=1')
  const hasNoCookie = document.cookie.includes(feature.cookieName + '=0')
  return isProduction
    ? hasYesCookie && feature.hideInProduction === false
    : hasYesCookie || (feature.activeInDev && !hasNoCookie)
}

export function ProfileExperimental() {
  const [, updateState] = useState({}) //refresh comp

  useEffect(() => {
    if (window.location.hash === '#enable-experiments') {
      localStorage.setItem(showExperimentsStorageKey, '1')
      window.location.hash = ''
      window.location.reload()
    }

    if (window.location.hash === '#disable-experiments')
      localStorage.removeItem(showExperimentsStorageKey)
  })

  if (typeof window === 'undefined') return null
  if (isProduction && !localStorage.getItem(showExperimentsStorageKey))
    return null

  // check cookies
  Object.keys(features).forEach((featureString) => {
    const featureKey = featureString as FeatureKey
    if (features[featureKey]) {
      features[featureKey].isActive = shouldUseFeature(featureKey)
    }
  })

  function handleButtonClick(featureKey: FeatureKey) {
    if (!features[featureKey]) return
    if (features[featureKey].isActive)
      Cookies.set(features[featureKey].cookieName, '0', { expires: 60 })
    else Cookies.set(features[featureKey].cookieName, '1', { expires: 60 })

    updateState({})
  }

  return (
    <section className="mt-10">
      <h2 className="serlo-h2" id="experiments">
        🧪 Experimente
      </h2>
      {features.edtrPasteHack && (
        <div>
          <h3 className="serlo-h3 mb-3">
            {renderFeatureButton('edtrPasteHack')} Edtr: Einfügen von Edtr-State
            JSON 🛠
          </h3>
          <p className="serlo-p">
            Experimentelles Feature: nur aktivieren wenn du weißt was du tust.
          </p>
        </div>
      )}
      <hr className="mx-side mb-4 -mt-2" />
      {features.legacyDesign && (
        <div>
          <h3 className="serlo-h3 mb-3">
            {renderFeatureButton('legacyDesign', '/disable-frontend')} Frontend:
            Altes Design 👻
          </h3>
          <p className="serlo-p">
            Zurück ins alte Design, sollte nur noch bei akuten Problemen oder
            zum Vergleichen mit den neuen Design benutzt werden.
          </p>
        </div>
      )}
    </section>
  )

  function renderFeatureButton(feature: FeatureKey, href?: string) {
    if (!features[feature]) return null

    const isActive = features[feature]!.isActive
    return (
      <button
        className="inline-block cursor-pointer align-bottom"
        onClick={() =>
          href ? (window.location.href = href) : handleButtonClick(feature)
        }
      >
        <div
          className={clsx(
            'w-12 h-6 flex bg-gray-300 rounded-full p-1 duration-300 ease-in-out',
            isActive && 'bg-green-400'
          )}
        >
          <div
            className={clsx(
              'bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out',
              isActive && 'translate-x-6'
            )}
          ></div>
        </div>
      </button>
    )
  }
}
