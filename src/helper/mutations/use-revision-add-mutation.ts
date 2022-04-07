import {
  AddAppletRevisionInput,
  AddArticleRevisionInput,
  AddCoursePageRevisionInput,
  AddCourseRevisionInput,
  AddEventRevisionInput,
  AddExerciseGroupRevisionInput,
  AddGenericRevisionInput,
  AddVideoRevisionInput,
} from '@serlo/api'
import { gql } from 'graphql-request'
import { RefObject } from 'react'

import { showToastNotice } from '../show-toast-notice'
import { mutationFetch } from './helper'
import { AuthenticationPayload } from '@/auth/auth-provider'
import { useAuthentication } from '@/auth/use-authentication'
import { useLoggedInData } from '@/contexts/logged-in-data-context'
import { LoggedInData } from '@/data-types'
import {
  AppletSerializedState,
  ArticleSerializedState,
  CoursePageSerializedState,
  CourseSerializedState,
  EventSerializedState,
  TextExerciseGroupSerializedState,
  TextExerciseSerializedState,
  TextSolutionSerializedState,
  VideoSerializedState,
} from '@/edtr-io/editor-response-to-state'
import { EdtrState } from '@/schema/edtr-io-types'

export interface OnSaveData {
  csrf?: string
  controls: {
    subscription?: {
      subscribe: number
      mailman: number
    }
    checkout?: boolean
  }
}

export type AddRevisionInputTypes =
  | AddGenericRevisionInput
  | AddAppletRevisionInput
  | AddArticleRevisionInput
  | AddCourseRevisionInput
  | AddCoursePageRevisionInput
  | AddEventRevisionInput
  | AddExerciseGroupRevisionInput
  | AddVideoRevisionInput

export type SupportedTypesSerializedState =
  | AppletSerializedState
  | ArticleSerializedState
  | CourseSerializedState
  | CoursePageSerializedState
  | EventSerializedState
  | TextExerciseSerializedState
  | TextExerciseGroupSerializedState
  | TextSolutionSerializedState
  | VideoSerializedState

export type RevisionAddMutationData = SupportedTypesSerializedState & OnSaveData

export function useRevisionAddMutation() {
  const auth = useAuthentication()
  const loggedInData = useLoggedInData()

  return async (
    data: RevisionAddMutationData,
    needsReview: boolean,
    initialState: EdtrState
  ) =>
    await addRevisionMutation({
      auth,
      data,
      needsReview,
      loggedInData,
      initialState,
    })
}

interface AddRevisionMutationData {
  auth: RefObject<AuthenticationPayload>
  data: RevisionAddMutationData
  needsReview: boolean
  loggedInData: LoggedInData | null
  isRecursiveCall?: boolean
  initialState: EdtrState
}

export const addRevisionMutation = async function ({
  auth,
  data,
  needsReview,
  loggedInData,
  isRecursiveCall,
  initialState,
}: AddRevisionMutationData) {
  if (!auth || !loggedInData) {
    showToastNotice('Please make sure you are logged in!', 'warning')
    return false
  }

  if (!data.__typename) return false

  const childrenResult = await loopNestedChildren({
    auth,
    data,
    needsReview,
    loggedInData,
    initialState,
  })

  try {
    const genericInput = getGenericInputData(loggedInData, data, needsReview)
    const additionalInput = getAdditionalInputData(loggedInData, data)
    const input = { ...genericInput, ...additionalInput }

    const success = await mutationFetch(
      auth,
      getAddMutation(data.__typename),
      input,
      loggedInData?.strings.mutations.errors
    )

    if (success && childrenResult) {
      if (!isRecursiveCall) {
        showToastNotice(loggedInData.strings.mutations.success.save, 'success')
        window.location.href = `/entity/repository/history/${data.id}`
      }
      return true
    }
    return false
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('probably missing value?')
    return false
  }
}

const loopNestedChildren = async ({
  auth,
  data,
  needsReview,
  loggedInData,
  initialState,
}: AddRevisionMutationData): Promise<boolean> => {
  if (!data.__typename) return false

  let success = true

  if (data.__typename === 'Course' && data['course-page']) {
    success =
      success &&
      (await mapField<CoursePageSerializedState>(
        data['course-page'],
        'CoursePage',
        initialState.state['course-page']
      ))
  }
  if (data.__typename === 'ExerciseGroup' && data['grouped-text-exercise']) {
    success =
      success &&
      (await mapField<TextExerciseSerializedState>(
        data['grouped-text-exercise'],
        'Exercise'
      ))
  }
  if (data.__typename === 'Exercise' && data['text-solution']) {
    success =
      success &&
      (await mapField<TextSolutionSerializedState>(
        data['text-solution'],
        'Solution'
      ))
  }

  return success

  type ChildFieldsData =
    | CoursePageSerializedState
    | TextSolutionSerializedState
    | TextExerciseSerializedState

  async function mapField<ChildFieldsData>(
    childrenArray: ChildFieldsData[] | ChildFieldsData,
    childrenType: RevisionAddMutationData['__typename'],
    childrenInitialState?: ChildFieldsData[] | ChildFieldsData
  ) {
    console.log(childrenInitialState)

    //bonus points if we check if they were changed at all
    const _childrenArray = Array.isArray(childrenArray)
      ? childrenArray
      : [childrenArray]

    const results = await Promise.all(
      _childrenArray.map(async (child) => {
        const input: ChildFieldsData & OnSaveData = {
          ...child,
          __typename: childrenType,
          changes: data.changes,
          csrf: data.csrf,
          controls: data.controls,
        }
        const success = await addRevisionMutation({
          auth,
          data: input as unknown as RevisionAddMutationData,
          needsReview,
          loggedInData,
          isRecursiveCall: true,
          initialState,
        })
        return success
      })
    )
    return results.every((result) => result === true)
  }
}

const addAppletRevisionMutation = gql`
  mutation addAppletRevision($input: AddAppletRevisionInput!) {
    entity {
      addAppletRevision(input: $input) {
        success
      }
    }
  }
`
const addArticleRevisionMutation = gql`
  mutation addArticleRevision($input: AddArticleRevisionInput!) {
    entity {
      addArticleRevision(input: $input) {
        success
      }
    }
  }
`
const addCourseRevisionMutation = gql`
  mutation addCourseRevision($input: AddCourseRevisionInput!) {
    entity {
      addCourseRevision(input: $input) {
        success
      }
    }
  }
`
const addCoursePageRevisionMutation = gql`
  mutation addCoursePageRevision($input: AddCoursePageRevisionInput!) {
    entity {
      addCoursePageRevision(input: $input) {
        success
      }
    }
  }
`
const addEventRevisionMutation = gql`
  mutation addEventRevision($input: AddEventRevisionInput!) {
    entity {
      addEventRevision(input: $input) {
        success
      }
    }
  }
`
const addExerciseRevisionMutation = gql`
  mutation addExerciseRevision($input: AddGenericRevisionInput!) {
    entity {
      addExerciseRevision(input: $input) {
        success
      }
    }
  }
`
const addExerciseGroupRevisionMutation = gql`
  mutation addExerciseGroupRevision($input: AddExerciseGroupRevisionInput!) {
    entity {
      addExerciseGroupRevision(input: $input) {
        success
      }
    }
  }
`
const addGroupedExerciseRevisionMutation = gql`
  mutation addGroupedExerciseRevision($input: AddGenericRevisionInput!) {
    entity {
      addGroupedExerciseRevision(input: $input) {
        success
      }
    }
  }
`
const addSolutionRevisionMutation = gql`
  mutation addSolutionRevision($input: AddGenericRevisionInput!) {
    entity {
      addSolutionRevision(input: $input) {
        success
      }
    }
  }
`
const addVideoRevisionMutation = gql`
  mutation addVideoRevision($input: AddVideoRevisionInput!) {
    entity {
      addVideoRevision(input: $input) {
        success
      }
    }
  }
`

function getAddMutation(
  type: Exclude<SupportedTypesSerializedState['__typename'], undefined>
) {
  return {
    Applet: addAppletRevisionMutation,
    Article: addArticleRevisionMutation,
    Course: addCourseRevisionMutation,
    CoursePage: addCoursePageRevisionMutation,
    Event: addEventRevisionMutation,
    Exercise: addExerciseRevisionMutation,
    ExerciseGroup: addExerciseGroupRevisionMutation,
    GroupedExercise: addGroupedExerciseRevisionMutation,
    Solution: addSolutionRevisionMutation,
    Video: addVideoRevisionMutation,
  }[type]
}

function getRequiredString(
  loggedInData: LoggedInData,
  name: string,
  value?: string
) {
  if (!value) {
    const msg = `${loggedInData.strings.mutations.errors.valueMissing} ("${name}")`
    showToastNotice(msg, 'warning')
    throw msg
  }
  return value
}

function getGenericInputData(
  loggedInData: LoggedInData,
  data: RevisionAddMutationData,
  needsReview: boolean
): AddGenericRevisionInput {
  const content = data.__typename === 'Course' ? data.description : data.content

  return {
    changes: getRequiredString(loggedInData, 'changes', data.changes),
    content: getRequiredString(loggedInData, 'content', content),
    entityId: data.id,
    needsReview: needsReview,
    subscribeThis: data.controls.subscription?.subscribe === 1 ? true : false, //simplify when old code is unused
    subscribeThisByEmail:
      data.controls.subscription?.mailman === 1 ? true : false, //simplify when old code is unused
  }
}

function getAdditionalInputData(
  loggedInData: LoggedInData,
  data: RevisionAddMutationData
) {
  switch (data.__typename) {
    case 'Applet':
      return {
        title: getRequiredString(loggedInData, 'title', data.title),
        url: getRequiredString(loggedInData, 'url', data.url),
        metaTitle: data['meta_title'],
        metaDescription: data['meta_description'],
      }
    case 'Article':
      return {
        title: getRequiredString(loggedInData, 'title', data.title),
        metaTitle: data['meta_title'],
        metaDescription: data['meta_description'],
      }
    case 'Course':
      return {
        title: getRequiredString(loggedInData, 'title', data.title),
        metaDescription: data['meta_description'],
      }
    case 'CoursePage':
      return { title: getRequiredString(loggedInData, 'title', data.title) }
    case 'Event':
      return {
        title: getRequiredString(loggedInData, 'title', data.title),
        metaTitle: data['meta_title'],
        metaDescription: data['meta_description'],
      }
    case 'Exercise':
      return {}
    case 'ExerciseGroup':
      return { cohesive: data.cohesive === 'true' }
    case 'Video':
      return {
        title: getRequiredString(loggedInData, 'title', data.title),
        url: getRequiredString(loggedInData, 'url', data.content), // url is stored in content for some reason
        content: getRequiredString(loggedInData, 'content', data.description),
      }
  }
  return {}
}
