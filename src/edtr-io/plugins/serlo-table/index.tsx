import { useScopedSelector, useScopedStore } from '@edtr-io/core'
import {
  child,
  EditorPlugin,
  EditorPluginProps,
  list,
  object,
  string,
} from '@edtr-io/plugin'
import { focus, getDocument, getFocused, isFocused } from '@edtr-io/store'
import { Icon, faTimes, styled } from '@edtr-io/ui'
import * as R from 'ramda'

import { useLoggedInData } from '@/contexts/logged-in-data-context'
import { SerloTableRenderer, Table, TableCell, TableHeader } from './renderer'

export enum TableType {
  OnlyColumnHeader = 'OnlyColumnHeader',
  OnlyRowHeader = 'OnlyRowHeader',
  ColumnAndRowHeader = 'RowAndColumnHeader',
}

const tableState = object({
  // Headings, bold, italic should not be allowed and this should be an inline field
  // see https://github.com/edtr-io/edtr-io/issues/359
  columnHeaders: list(object({ content: child({ plugin: 'text' }) }), 2),
  rowHeaders: list(object({ content: child({ plugin: 'text' }) }), 4),
  rows: list(
    object({
      columns: list(object({ content: child({ plugin: 'text' }) }), 2),
    }),
    4
  ),
  tableType: string(TableType.OnlyColumnHeader),
})

export type SerloTablePluginState = typeof tableState
export type SerloTableProps = EditorPluginProps<SerloTablePluginState>

export const serloTablePlugin: EditorPlugin<SerloTablePluginState> = {
  Component: SerloTableEditor,
  config: {},
  state: tableState,
}

function SerloTableEditor(props: SerloTableProps) {
  const { rowHeaders, columnHeaders, rows } = props.state
  const store = useScopedStore()
  const focusedElement = useScopedSelector(getFocused())
  const nestedFocus =
    props.focused ||
    columnHeaders
      .map((header) => header.content.id as string | null)
      .includes(focusedElement) ||
    rowHeaders
      .map((header) => header.content.id as string | null)
      .includes(focusedElement) ||
    rows.some((row) =>
      row.columns
        .map((column) => column.content.id as string | null)
        .includes(focusedElement)
    )

  const loggedInData = useLoggedInData()
  if (!loggedInData) return null
  const tableStrings = loggedInData.strings.editor.serloTable

  const tableType = getTableType(props.state.tableType.value)
  const showRowHeader =
    tableType === TableType.OnlyRowHeader ||
    tableType === TableType.ColumnAndRowHeader
  const showColumnHeader =
    tableType === TableType.OnlyColumnHeader ||
    tableType === TableType.ColumnAndRowHeader

  if (!nestedFocus) return <SerloTableRenderer {...props} />

  return (
    <Table>
      {props.renderIntoSettings(
        <div>
          <label>
            {tableStrings.mode}{' '}
            <select
              value={tableType}
              onChange={(e) => props.state.tableType.set(e.target.value)}
            >
              <option value={TableType.OnlyColumnHeader}>
                {tableStrings.columnHeaders}
              </option>
              <option value={TableType.OnlyRowHeader}>
                {tableStrings.rowHeaders}
              </option>
              <option value={TableType.ColumnAndRowHeader}>
                {tableStrings.columnAndRowHeaders}
              </option>
            </select>
          </label>
        </div>
      )}
      <tbody>
        <tr>
          <td />
          {showRowHeader && <td />}
          {R.range(0, columnHeaders.length).map((column, key) => (
            <td style={{ textAlign: 'center' }} key={key}>
              <RemoveButton
                onClick={() => {
                  if (columnHeaders.length === 1) return
                  columnHeaders.remove(column)
                  for (const row of rows) {
                    row.columns.remove(column)
                  }
                }}
              >
                <Icon icon={faTimes} />
              </RemoveButton>
            </td>
          ))}
        </tr>
        {showColumnHeader && (
          <tr>
            <td />
            {showRowHeader && <TableHeader />}
            {columnHeaders.map(({ content }, column) => (
              <TableHeader key={column}>
                {content.render({ config: { placeholder: '' } })}
              </TableHeader>
            ))}
            {renderAddColumnButton()}
          </tr>
        )}
        {rows.map(({ columns }, rowIndex) => (
          <tr key={rowIndex}>
            <td style={{ width: '2em' }}>
              <RemoveButton
                onClick={() => {
                  rows.remove(rowIndex)
                  rowHeaders.remove(rowIndex)
                }}
              >
                <Icon icon={faTimes} />
              </RemoveButton>
            </td>
            {showRowHeader && (
              <TableHeader>
                {rowHeaders[rowIndex].content.render({
                  config: { placeholder: '' },
                })}
              </TableHeader>
            )}
            {columns.map(({ content }, columnIndex) => {
              const isImage =
                getDocument(content.get())(store.getState())?.plugin === 'image'
              const contentHasFocus = isFocused(content.get())(store.getState())
              const onClick = isImage
                ? undefined
                : () => store.dispatch(focus(content.get()))

              return (
                <TableCell
                  key={columnIndex}
                  style={{ width: `${100 / columnHeaders.length}%` }}
                  onClick={onClick}
                >
                  {content.render(
                    isImage ? undefined : { config: { placeholder: '' } }
                  )}
                  {contentHasFocus && (
                    <button
                      onMouseDown={(e) => e.stopPropagation()} // hack to stop edtr from stealing events
                      onClick={() =>
                        content.replace(isImage ? 'text' : 'image')
                      }
                      className="serlo-button serlo-make-interactive-light m-2 py-0.5 text-sm"
                    >
                      {isImage
                        ? tableStrings.convertToText
                        : tableStrings.convertToImage}
                    </button>
                  )}
                </TableCell>
              )
            })}
            {rowIndex === 0 && !showColumnHeader && renderAddColumnButton()}
          </tr>
        ))}
        <tr>
          <td />
          <td
            colSpan={
              showRowHeader ? columnHeaders.length + 1 : columnHeaders.length
            }
          >
            <AddButton
              onClick={() => {
                rows.insert(columnHeaders.length, {
                  columns: R.range(0, columnHeaders.length).map((_) => {
                    return { content: { plugin: 'text' } }
                  }),
                })
                rowHeaders.insert(rowHeaders.length, {
                  content: { plugin: 'text' },
                })
              }}
            >
              + {tableStrings.addRow}
            </AddButton>
          </td>
        </tr>
      </tbody>
    </Table>
  )

  function renderAddColumnButton() {
    return (
      <td
        rowSpan={showColumnHeader ? rows.length + 1 : rows.length}
        style={{ height: '100%', width: '2em' }}
      >
        <AddColumnButton
          onClick={() => {
            columnHeaders.insert(columnHeaders.length, {
              content: { plugin: 'text' },
            })

            for (const row of rows) {
              row.columns.insert(row.columns.length, {
                content: { plugin: 'text' },
              })
            }
          }}
        >
          +
        </AddColumnButton>
      </td>
    )
  }
}

export function getTableType(text: string): TableType {
  return isTableType(text) ? text : TableType.OnlyColumnHeader
}

export function isTableType(text: string): text is TableType {
  return Object.values<string>(TableType).includes(text)
}

const AddButton = styled.button({
  border: '2px solid lightgrey',
  margin: '3px',
  backgroundColor: 'white',
  textAlign: 'center',
  verticalAlign: 'middle',
  borderRadius: '10px',
  minHeight: '50px',
  color: 'lightgrey',
  fontWeight: 'bold',
  width: '100%',
  '&:hover, &:focused': {
    color: '#007ec1',
    border: '3px solid #007ec1',
  },
})

const AddColumnButton = styled(AddButton)({
  width: '2em',
  height: '100%',
})

const RemoveButton = styled.button({
  outline: 'none',
  width: '35px',
  border: 'none',
  background: 'transparent',
  color: 'lightgrey',
})
