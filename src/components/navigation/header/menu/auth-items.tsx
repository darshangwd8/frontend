import { faBell } from '@fortawesome/free-solid-svg-icons/faBell'

import { Item } from './item'
import { NoAuthItem } from './no-auth-item'
import { useAuthentication } from '@/auth/use-authentication'
import { UnreadNotificationsCount } from '@/components/user-tools/unread-notifications-count'
import { getAvatarUrl } from '@/components/user/user-link'
import { useLoggedInData } from '@/contexts/logged-in-data-context'

export function AuthItems() {
  const auth = useAuthentication()
  const loggedInData = useLoggedInData()

  if (!auth || !loggedInData || !auth.username)
    return <NoAuthItem hidden={false} />

  const { id, username } = auth
  const userMeReplacement = `user/${id}/${username}`

  const [notificationLinkData, userLinkData] = loggedInData.authMenu
  const updatedSubData = {
    ...userLinkData,
    children: userLinkData.children?.map((item) => {
      return { ...item, url: item.url.replace('user/me', userMeReplacement) }
    }),
  }

  return (
    <>
      <Item
        link={notificationLinkData}
        elementAsIcon={
          <div className="-top-[2px] md:relative md:mx-[3px] md:my-[7px]">
            <UnreadNotificationsCount icon={faBell} />
          </div>
        }
      />
      <Item
        link={updatedSubData}
        elementAsIcon={
          <img
            className="rounded-full w-6 h-6 inline md:my-[7px]"
            src={getAvatarUrl(username)}
            title={`${updatedSubData.title} ${username}`}
          />
        }
      />
    </>
  )
}
