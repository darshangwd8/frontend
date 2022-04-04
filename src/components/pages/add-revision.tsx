import clsx from 'clsx'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'

import { LoadingSpinner } from '../loading/loading-spinner'
import { Breadcrumbs } from '../navigation/breadcrumbs'
import { features } from '../user/profile-experimental'
import { MathSpan } from '@/components/content/math-span'
import { useInstanceData } from '@/contexts/instance-context'
import { SerloEditor } from '@/edtr-io/serlo-editor'
import { EditorPageData } from '@/fetcher/fetch-editor-data'
import {
  RevisionAddMutationData,
  useRevisionAddMutation,
} from '@/helper/mutations/revision'

export function AddRevision({
  initialState,
  type,
  needsReview,
  id,
  breadcrumbsData,
}: EditorPageData) {
  const { strings } = useInstanceData()

  const backlink = {
    label: strings.revisions.toContent,
    url: `/${id}`,
  }

  const addRevisionMutation = useRevisionAddMutation()

  const [cookieReady, setCookieReady] = useState(false)

  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      setCookieReady(true)
    } else {
      fetch('/auth/password/change')
        .then((res) => res.text())
        .then(() => {
          setCookieReady(true)
        })
        .catch(() => {})
    }
  }, [])

  if (!cookieReady) return <LoadingSpinner noText />

  const supportedTypes = [
    'Applet',
    'Article',
    'Course',
    'CoursePage',
    'Event',
    'Solution',
    'Video',
    'Exercise',
    'ExerciseGroup',
    'GroupedExercise',
  ]
  // 'Page'
  // 'Taxonomy'
  // 'User'

  return (
    <>
      <Breadcrumbs
        data={breadcrumbsData ? [...breadcrumbsData, backlink] : [backlink]}
        noIcon
      />
      <MathSpan formula="" />
      <div className="controls-portal sticky top-0 z-[94] bg-white" />
      <div
        className={clsx(
          'max-w-[816px] mx-auto mb-24 edtr-io serlo-editor-hacks'
        )}
      >
        <SerloEditor
          getCsrfToken={() => {
            const cookies = typeof window === 'undefined' ? {} : Cookies.get()
            return cookies['CSRF']
          }}
          needsReview={needsReview}
          onSave={async (data: RevisionAddMutationData) => {
            if (
              features.addRevisionMutation &&
              document.cookie.includes(
                features.addRevisionMutation.cookieName + '=1'
              ) &&
              supportedTypes.includes(type)
            ) {
              // eslint-disable-next-line no-console
              console.log('using api endpoint to save')

              // refactor and rename when removing legacy code
              const skipReview = data.controls.checkout
              const _needsReview = skipReview ? false : needsReview

              const success = await addRevisionMutation(
                {
                  ...data,
                  // @ts-expect-error temporary
                  __typename: type === 'GroupedExercise' ? 'Exercise' : type,
                },
                _needsReview
              )
              return new Promise((resolve, reject) => {
                if (success) resolve()
                else reject()
              })
            }

            return new Promise((resolve, reject) => {
              fetch(window.location.pathname, {
                method: 'POST',
                headers: {
                  'X-Requested-with': 'XMLHttpRequest',
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                  'X-From': 'legacy-serlo.org',
                },
                body: JSON.stringify(data),
              })
                .then((response) => response.json())
                .then(
                  (data: {
                    success: boolean
                    redirect: string
                    errors: object
                  }) => {
                    if (data.success) {
                      resolve()
                      window.location.href =
                        data.redirect.length > 5
                          ? data.redirect
                          : window.location.href
                    } else {
                      // eslint-disable-next-line no-console
                      console.log(data.errors)
                      reject()
                    }
                  }
                )
                .catch((value) => {
                  // eslint-disable-next-line no-console
                  console.log(value)
                  reject(value)
                })
            })
          }}
          type={type}
          initialState={initialState}
        />
      </div>
    </>
  )
}
