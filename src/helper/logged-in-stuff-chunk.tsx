import { createAuthAwareGraphqlFetch } from '@/api/graphql-fetch'
import { ExerciseAuthorTools } from '@/components/content/exercises/exercise-author-tools'
import { AuthorToolsHoverMenu } from '@/components/user-tools/more-author-tools/author-tools-hover-menu'
import { UnreadNotificationsCount } from '@/components/user-tools/unread-notifications-count'

export const Components = {
  UnreadNotificationsCount,
  AuthorToolsHoverMenu,
  ExerciseAuthorTools,
  createAuthAwareGraphqlFetch,
}

export type LoggedInStuff = typeof Components
