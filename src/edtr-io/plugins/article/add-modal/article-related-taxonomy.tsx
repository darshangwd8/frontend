import { faSearch, Icon } from '@edtr-io/ui'
import { gql } from 'graphql-request'

import { SerloAddButton } from '../../helpers/serlo-editor-button'
import { useGraphqlSwr } from '@/api/use-graphql-swr'
import { useEntityId } from '@/contexts/entity-id-context'
import { useInstanceData } from '@/contexts/instance-context'
import { useLoggedInData } from '@/contexts/logged-in-data-context'
import { UuidType, UuidWithRevType } from '@/data-types'
import { TaxonomyTermType } from '@/fetcher/graphql-types/operations'
import { getCategoryByTypename } from '@/helper/get-category-by-typename'
import { getTranslatedType } from '@/helper/get-translated-type'
import { getIconByTypename } from '@/helper/icon-by-entity-type'

interface ArticleRelatedTaxonomyProps {
  addEntry: (id: number, typename: UuidWithRevType, title?: string) => void
  checkDuplicates: (id: number, typename: UuidWithRevType) => boolean
  showExerciseFolderPreview: (id: number) => void
}

export function ArticleRelatedTaxonomy({
  addEntry,
  checkDuplicates,
  showExerciseFolderPreview,
}: ArticleRelatedTaxonomyProps) {
  const entityId = useEntityId()
  const { data, error } = useFetchParentTaxonomy(entityId)

  const { strings } = useInstanceData()
  const loggedInData = useLoggedInData()
  if (!loggedInData) return null
  const articleStrings = loggedInData.strings.editor.article

  const dataAndTerm = getCategorisedDataAndTerm(data, error)
  if (!dataAndTerm) {
    const isNew =
      typeof window !== undefined &&
      window.location.pathname.startsWith('/entity/create')
    return (
      <p className="mt-4 pt-4 border-t-2 text-gray-400 italic">
        {isNew
          ? 'Sorry, folder preview is currently not supported for new articles.'
          : 'Sorry, something went wrong.'}
      </p>
    )
  }
  const { categorisedData, term } = dataAndTerm

  return (
    <div className="mt-5 border-t-2 pt-6">
      {articleStrings.addModal.addFromFolderTitle}
      <a
        className="font-bold text-brand ml-2"
        target="_blank"
        href={`/${term.id}`}
        rel="noreferrer"
      >
        <Icon icon={getIconByTypename(UuidType.TaxonomyTerm)} /> {term.name}
      </a>
      <div className="mt-4 flex flex-wrap">
        {Object.entries(categorisedData).map(([typename, categoryData]) => {
          return renderList(typename as UuidWithRevType, categoryData)
        })}
      </div>
    </div>
  )

  function renderList(typename: UuidWithRevType, dataArray: ChildNode[]) {
    if (dataArray.length === 0) return null
    const isTax = typename === UuidType.TaxonomyTerm

    return (
      <div className="py-2 max-w-[30%] mr-4" key={typename}>
        <b className="block mb-2">
          <Icon icon={getIconByTypename(typename)} />{' '}
          {isTax
            ? strings.entities.exerciseFolder
            : strings.categories[getCategoryByTypename(typename)]}
        </b>
        {isTax ? articleStrings.addModal.exerciseFolderNote : null}
        <ul>{dataArray.map((item) => renderLi(item, typename))}</ul>
      </div>
    )
  }

  function renderLi(item: ChildNode, typename: UuidWithRevType) {
    const title = typename.includes(UuidType.Exercise)
      ? getTranslatedType(strings, typename)
      : typename === UuidType.TaxonomyTerm
      ? item.name
      : item.currentRevision?.title

    if (!title) return null

    const isTax = typename === UuidType.TaxonomyTerm

    if (checkDuplicates(item.id, typename)) return null

    return (
      <li key={item.id} className="group flex justify-between">
        <a
          href={`/${item.id}`}
          className="text-brand mt-1 mb-2 leading-tight"
          target="_blank"
          rel="noreferrer"
        >
          {title}
        </a>{' '}
        {isTax ? (
          <button
            className="invisible group-hover:visible group-focus-within:visible whitespace-nowrap ml-2 max-h-8 self-center serlo-button bg-amber-100 hover:bg-amber-300 text-base leading-browser"
            onClick={() => {
              showExerciseFolderPreview(item.id)
            }}
            title="Preview"
          >
            <Icon icon={faSearch} />
          </button>
        ) : null}
        <SerloAddButton
          text=""
          className="invisible group-hover:visible group-focus-within:visible whitespace-nowrap ml-2 max-h-8 self-center"
          onClick={() => {
            addEntry(item.id, item.__typename, title)
          }}
        />
      </li>
    )
  }
}

const fetchParentQuery = gql`
  query fetchParentQuery($id: Int!) {
    uuid(id: $id) {
      ... on Article {
        taxonomyTerms {
          ...taxonomyTerm
        }
      }
    }
  }

  fragment taxonomyTerm on TaxonomyTermConnection {
    nodes {
      id
      type
      name
      children {
        nodes {
          id
          __typename
          trashed
          ... on Article {
            currentRevision {
              title
            }
          }
          ... on Course {
            currentRevision {
              title
            }
          }
          ... on Video {
            currentRevision {
              title
            }
          }
          ... on TaxonomyTerm {
            name
            type
          }
          ... on Exercise {
            currentRevision {
              id
            }
          }
        }
      }
    }
  }
`

interface ChildNode {
  __typename: UuidWithRevType
  id: number
  trashed: boolean
  currentRevision?: {
    title?: string
    id?: string
  }
  type?: TaxonomyTermType
  name?: string
}

interface FetchParentType {
  uuid: {
    taxonomyTerms: {
      nodes: {
        type: TaxonomyTermType
        name: string
        id: number
        children: {
          nodes: ChildNode[]
        }
      }[]
    }
  }
}

function useFetchParentTaxonomy(id: number) {
  return useGraphqlSwr<FetchParentType>({
    query: fetchParentQuery,
    variables: { id },
    config: {
      refreshInterval: 1 * 60 * 1000, //1min
    },
  })
}

function getCategorisedDataAndTerm(data?: FetchParentType, error?: object) {
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return false
  }
  if (!data) return null
  const { uuid } = data
  if (!uuid) return null

  const term = uuid.taxonomyTerms?.nodes.find((node) => node.type === 'topic')
  if (!term || term.children.nodes.length === 0) return null

  const categorisedData = {} as {
    [key: string]: ChildNode[]
  }

  term.children.nodes.map((child) => {
    const isEx = child.__typename.includes(UuidType.Exercise)
    const isTax = child.__typename === UuidType.TaxonomyTerm

    if (
      ![
        UuidType.Article,
        UuidType.Course,
        UuidType.CoursePage,
        UuidType.Video,
      ].includes(child.__typename as UuidType) &&
      !isEx &&
      !isTax
    )
      return

    if (isTax && child.type !== TaxonomyTermType.ExerciseFolder) return

    if ((!isTax && !child.currentRevision) || child.trashed) return

    const category = isEx ? UuidType.Exercise : child.__typename
    if (!categorisedData[category]) categorisedData[category] = []
    categorisedData[category].push(child)
  })

  return { categorisedData, term }
}
