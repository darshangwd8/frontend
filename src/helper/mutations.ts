import {
  ThreadCreateCommentInput,
  ThreadCreateThreadInput,
  ThreadMutation,
} from '@serlo/api'
import { gql } from 'graphql-request'
import NProgress from 'nprogress'
import { mutate } from 'swr'

import { createAuthAwareGraphqlFetch } from '@/api/graphql-fetch'
import { AuthPayload } from '@/auth/use-auth'

export async function setStateMutation(
  auth: React.RefObject<AuthPayload>,
  id: number,
  unread: boolean
) {
  const input = {
    query: gql`
      mutation setState($input: NotificationSetStateInput!) {
        notification {
          setState(input: $input) {
            success
          }
        }
      }
    `,
    variables: {
      input: {
        id,
        unread,
      },
    },
  }
  const result = await createAuthAwareGraphqlFetch(auth)(JSON.stringify(input))
  console.log(result)
}

// export async function setThreadState(id: number, unread: boolean) {
//   const input = {
//     query: gql`
//       mutation setState($input: NotificationSetStateInput!) {
//         notification {
//           setState(input: $input) {
//             success
//           }
//         }
//       }
//     `,
//     variables: {
//       input: {
//         id,
//         unread,
//       },
//     },
//   }
//   const result = await createAuthAwareGraphqlFetch(auth)(JSON.stringify(input))
//   console.log(result)
// }

export async function setThreadArchivedMutation(
  auth: React.RefObject<AuthPayload>,
  id: string,
  archived: boolean,
  entityId: number
) {
  const input = {
    query: gql`
      mutation setState($input: ThreadSetThreadArchivedInput!) {
        thread {
          setThreadArchived(input: $input) {
            success
          }
        }
      }
    `,
    variables: {
      input: {
        id,
        archived,
      },
    },
  }
  NProgress.start()
  const response = (await createAuthAwareGraphqlFetch(auth)(
    JSON.stringify(input)
  )) as { thread: ThreadMutation }

  if (response.thread.setThreadArchived?.success) {
    await mutate(`comments::${entityId}`)
    NProgress.done()
    return true
  } else {
    //TODO: display error notice
    console.log(response)
    NProgress.done()
    return false
  }
}

export async function setCommentStateMutation(
  auth: React.RefObject<AuthPayload>,
  id: number,
  trashed: boolean,
  entityId: number
) {
  const input = {
    query: gql`
      mutation setState($input: ThreadSetCommentStateInput!) {
        thread {
          setCommentState(input: $input) {
            success
          }
        }
      }
    `,
    variables: {
      input: {
        id,
        trashed,
      },
    },
  }
  const response = (await createAuthAwareGraphqlFetch(auth)(
    JSON.stringify(input)
  )) as { thread: ThreadMutation }
  console.log(response)

  if (response.thread.setCommentState?.success) {
    return !!(await mutate(`comments::${entityId}`))
  } else {
    //TODO: display error notice
    console.log(response)
    return false
  }
}

export async function createThreadMutation(
  auth: React.RefObject<AuthPayload>,
  input: ThreadCreateThreadInput
) {
  const args = {
    query: gql`
      mutation createThread($input: ThreadCreateThreadInput!) {
        thread {
          createThread(input: $input) {
            success
          }
        }
      }
    `,
    variables: { input },
  }

  const response = (await createAuthAwareGraphqlFetch(auth)(
    JSON.stringify(args)
  )) as {
    thread: ThreadMutation
  }

  if (response.thread.createThread?.success) {
    return !!(await mutate(`comments::${input.objectId}`))
  } else {
    //TODO: display error notice
    console.log(response)
    return false
  }
}

export async function createCommentMutation(
  auth: React.RefObject<AuthPayload>,
  input: ThreadCreateCommentInput,
  entityId: number
) {
  const args = {
    query: gql`
      mutation createComment($input: ThreadCreateCommentInput!) {
        thread {
          createComment(input: $input) {
            success
          }
        }
      }
    `,
    variables: { input },
  }

  const response = (await createAuthAwareGraphqlFetch(auth)(
    JSON.stringify(args)
  )) as { thread: ThreadMutation }

  if (response.thread.createComment?.success) {
    return !!(await mutate(`comments::${entityId}`))
  } else {
    //TODO: display error notice
    console.log(response)
    return false
  }
}
