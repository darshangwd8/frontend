import { NextPage } from 'next'
import { useEffect } from 'react'

import { useAuthentication } from '@/auth/use-authentication'
import { LoadingSpinner } from '@/components/loading/loading-spinner'

//fallback for legacy routes /user/me and /user/public

export const ProfileRedirectMe: NextPage = () => {
  const auth = useAuthentication()

  useEffect(() => {
    if (auth.current) {
      console.log(document.referrer)
      const url = `/user/${auth.current.id}/${auth.current.username}`
      setTimeout(() => {
        window.location.replace(url)
      }, 2000)
    } else {
      window.location.replace('/api/auth/login')
    }
  }, [auth])

  return <LoadingSpinner noText />
}
