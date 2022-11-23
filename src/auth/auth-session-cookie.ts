import type { Session } from '@ory/client'
import Cookies from 'js-cookie'

import { serloDomain } from '@/helper/urls/serlo-domain'

export const AuthSessionCookie = {
  cookieName: 'auth-session',
  get() {
    return Cookies.get(this.cookieName)
  },
  set(session: Session) {
    // TODO: is the cookie id problematic to store locally?
    Cookies.set(this.cookieName, JSON.stringify(session), {
      sameSite: 'Strict',
      domain: serloDomain,
      expires: session.expires_at ? new Date(session.expires_at) : undefined,
    })
  },
  remove() {
    Cookies.remove(this.cookieName)
  },
  parse(cookies?: Partial<{ [key: string]: string }>): Session | null {
    const session = cookies
      ? cookies[this.cookieName]
      : Cookies.get(this.cookieName)
    if (!session) return null
    return JSON.parse(session) as Session
  },
}
