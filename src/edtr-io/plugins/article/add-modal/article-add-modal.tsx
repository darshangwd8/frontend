import clsx from 'clsx'
import { useState } from 'react'

import { ArticleProps } from '..'
import { ArticleRelatedExercises } from './article-related-exercises'
import { ArticleRelatedMagicInput } from './article-related-magic-input'
import { ArticleRelatedTaxonomy } from './article-related-taxonomy'
import { ModalWithCloseButton } from '@/components/modal-with-close-button'
import { useInstanceData } from '@/contexts/instance-context'
import { useLoggedInData } from '@/contexts/logged-in-data-context'
import { UuidType, UuidWithRevType } from '@/data-types'
import { getCategoryByTypename } from '@/helper/get-category-by-typename'
import { replacePlaceholders } from '@/helper/replace-placeholders'

interface ArticleAddModalProps {
  open: boolean
  data: ArticleProps['state']
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function ArticleAddModal({
  open,
  data,
  setModalOpen,
}: ArticleAddModalProps) {
  const [exerciseFolderId, setExerciseFolderId] = useState<undefined | number>(
    undefined
  )

  const { strings } = useInstanceData()
  const loggedInData = useLoggedInData()
  if (!loggedInData) return null
  const articleStrings = loggedInData.strings.editor.article

  const { exercises, exerciseFolder, relatedContent } = data

  const checkDuplicates = (id: number, typename: UuidWithRevType) => {
    const category = getCategoryByTypename(typename)
    if (
      category === 'articles' ||
      category === 'courses' ||
      category === 'videos'
    ) {
      return checkDuplicatesRelatedContent(id, category)
    }
    return false
  }

  const checkDuplicatesRelatedContent = (
    id: number,
    category: 'articles' | 'courses' | 'videos'
  ) => {
    return relatedContent[category].some(
      (field) => field.id.value === id.toString()
    )
  }

  const addEntry = (id: number, typename: UuidWithRevType, title?: string) => {
    const category = getCategoryByTypename(typename)
    if (
      category === 'articles' ||
      category === 'courses' ||
      category === 'videos'
    ) {
      if (!title || checkDuplicatesRelatedContent(id, category)) return
      relatedContent[category].insert(relatedContent[category].length, {
        id: id.toString(),
        title: title,
      })
    }

    if (typename === UuidType.TaxonomyTerm && title) {
      exerciseFolder.title.set(title)
      exerciseFolder.id.set(id.toString())
    }

    if (typename.includes(UuidType.Exercise)) {
      //maybe also check for duplicates
      exercises.insert(exercises.length, {
        plugin: 'injection',
        state: id.toString(),
      })
    }
  }

  return (
    <ModalWithCloseButton
      isOpen={open}
      onCloseClick={() => setModalOpen(false)}
      className={clsx()}
    >
      <h3 className="serlo-h3 mt-5 mb-4">{articleStrings.addModal.title}</h3>
      <div className="mx-side">
        <p>
          {replacePlaceholders(articleStrings.addModal.introText, {
            break: <br />,
            exercises: strings.categories.exercises,
            exerciseFolder: strings.entities.exerciseFolder,
            articles: strings.categories.articles,
            courses: strings.categories.courses,
            videos: strings.categories.videos,
          })}
        </p>
        <p className="mt-4">{articleStrings.addModal.introText2}</p>
        <ArticleRelatedMagicInput
          addEntry={addEntry}
          showExerciseFolderPreview={(id: number) => setExerciseFolderId(id)}
        />
        <ArticleRelatedTaxonomy
          checkDuplicates={checkDuplicates}
          addEntry={addEntry}
          showExerciseFolderPreview={(id: number) => setExerciseFolderId(id)}
        />
        <div id="exerciseFolderScroll" className="min-h-[8rem]">
          {exerciseFolderId ? (
            <ArticleRelatedExercises
              exerciseFolderId={exerciseFolderId}
              addEntry={addEntry}
            />
          ) : null}
        </div>
      </div>
    </ModalWithCloseButton>
  )
}
