import {
  SelfServiceRecoveryFlow,
  SubmitSelfServiceRecoveryFlowBody,
} from '@ory/client'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { kratos } from '@/auth/kratos'
import { Flow, FlowType, handleFlowError } from '@/components/auth/flow'
import { PageTitle } from '@/components/content/page-title'
import { useInstanceData } from '@/contexts/instance-context'

export function Recovery() {
  const [flow, setFlow] = useState<SelfServiceRecoveryFlow>()
  const { strings } = useInstanceData()
  const router = useRouter()
  const { flow: flowId, return_to: returnTo } = router.query

  useEffect(() => {
    if (!router.isReady || flow) return

    if (flowId) {
      kratos
        .getSelfServiceRecoveryFlow(String(flowId))
        .then(({ data }) => setFlow(data))
        .catch(handleFlowError(router, FlowType.recovery, setFlow, strings))
      return
    }

    kratos
      .initializeSelfServiceRecoveryFlowForBrowsers()
      .then(({ data }) => setFlow(data))
      .catch(handleFlowError(router, FlowType.recovery, setFlow, strings))
  }, [flowId, router, router.isReady, returnTo, flow, strings])

  const onSubmit = (values: SubmitSelfServiceRecoveryFlowBody) => {
    return router
      .push(`${router.pathname}?flow=${String(flow?.id)}`, undefined, {
        shallow: true,
      })
      .then(() =>
        kratos
          .submitSelfServiceRecoveryFlow(String(flow?.id), values)
          .then(({ data }) => setFlow(data))
          .catch(
            handleFlowError(router, FlowType.recovery, setFlow, strings, true)
          )
      )
  }
  if (!flow) return null
  return (
    <div className="max-w-md mx-auto">
      <PageTitle headTitle title={`${strings.auth.recoverTitle} 🕊`} extraBold />
      <p className="serlo-p mb-10 -mt-4">{strings.auth.recoveryInstructions}</p>
      <Flow onSubmit={onSubmit} flow={flow} />
      <style jsx>{`
        @font-face {
          font-family: 'Karmilla';
          font-style: bolder;
          font-weight: 800;
          src: url('/_assets/fonts/karmilla/karmilla-bolder.woff2')
              format('woff2'),
            url('/_assets/fonts/karmilla/karmilla-bold.woff') format('woff');
          font-display: swap;
        }
      `}</style>
    </div>
  )
}
