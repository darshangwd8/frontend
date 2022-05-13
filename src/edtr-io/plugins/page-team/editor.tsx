import clsx from 'clsx'
import { either as E } from 'fp-ts'
import * as t from 'io-ts'

import { PageTeamPluginProps } from '.'
import { PageTeamRenderer, supportedTypes } from './renderer'
import { showToastNotice } from '@/helper/show-toast-notice'

const TeamDataDecoder = t.array(
  t.strict({
    firstName: t.string,
    lastName: t.string,
    user: t.string,
    position: t.string,
    extraLinkUrl: t.string,
    extraLinkText: t.string,
    photo: t.string,
  })
)

export const PageTeamEditor: React.FunctionComponent<PageTeamPluginProps> = (
  props
) => {
  const { type, data } = props.state

  const hasNoType = type.value === ''

  return (
    <>
      {hasNoType ? (
        renderTypeChooser()
      ) : (
        <div>
          {data.value === '' ? (
            renderDataImport()
          ) : (
            <PageTeamRenderer type={type.value} data={data.value} />
          )}
        </div>
      )}
      {renderIntoSettingsModal()}
    </>
  )

  function renderIntoSettingsModal() {
    return props.renderIntoSettings(
      <>
        {renderTypeChooser()}
        {renderDataImport()}
      </>
    )
  }

  function renderTypeChooser() {
    return (
      <>
        <b className="serlo-h4 block mt-6 ml-0 mb-4">Choose a type</b>
        <ul className="pb-8 unstyled-list flex">
          {supportedTypes.map(renderLi)}
        </ul>
      </>
    )
  }

  function renderDataImport() {
    return (
      <>
        <b className="serlo-h4 block ml-0 mb-4">Supply data to plugin</b>
        <p className="mb-2">
          Make your changes in{' '}
          <a href="https://docs.google.com/spreadsheets/d/1VmoqOrPByExqnXABBML_SymPO_TgDj7qQcBi3N2iTuA/edit#gid=0">
            this spreadsheet
          </a>{' '}
          first and then import data here.
        </p>
        <button
          className="serlo-button bg-amber-200 hover:bg-amber-300 focus:bg-amber-300 mb-12 text-base"
          onClick={async () => {
            try {
              const response = await fetch(
                'https://opensheet.elk.sh/1VmoqOrPByExqnXABBML_SymPO_TgDj7qQcBi3N2iTuA/teamdata'
              )
              const teamData = TeamDataDecoder.decode(
                (await response.json()) as unknown
              )

              if (E.isRight(teamData)) {
                data.set(JSON.stringify(teamData.right))
                showToastNotice('👍 Imported', 'success')
              } else {
                throw new Error(
                  'Json result from opensheet.elk.sh is not valid'
                )
              }
            } catch (error) {
              showToastNotice('⚠️ Sorry… something went wrong', 'warning')
              // eslint-disable-next-line no-console
              console.log(error)
            }
          }}
        >
          Import Data
        </button>
      </>
    )
  }

  function renderLi(title: typeof supportedTypes[number]) {
    const active = type.value === title

    return (
      <li key={title}>
        <button
          onClick={(event) => {
            event.preventDefault()
            type.set(title)
          }}
          className={clsx(
            'bg-amber-200 rounded-lg flex flex-row w-24 mr-2 p-1',
            'hover:bg-amber-300 capitalize',
            active && 'bg-amber-300  font-bold'
          )}
        >
          {title}
        </button>
      </li>
    )
  }
}
