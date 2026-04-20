/**
 * Group Sort Editor with uncontrolled architecture.
 * Uses TanStack Form for internal state management.
 *
 * API (uncontrolled):
 * - initialData: Initial data for first render only
 * - projectDir: Project directory for image imports
 * - getValue: Synchronous pull for current data (called by parent on save)
 * - setValue: Reset editor state (called by parent on undo)
 * - onCommit: Callback when editor commits changes
 */

import CategoryIcon from '@mui/icons-material/Category'
import ExtensionIcon from '@mui/icons-material/Extension'
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Alert, Box, Chip, Collapse, Divider, Typography } from '@mui/material'
import { SidebarTab } from '@renderer/components/editors'
import type { GroupSortAppData } from '@shared/types'
import { JSX, useEffect, useRef, useState } from 'react'
import { GroupsTab, ItemsTab, OverviewTab } from './components'
import { useGroupSortForm } from './hooks/useGroupSortForm'

interface Props {
  initialData: GroupSortAppData
  projectDir: string
  getValue: () => GroupSortAppData
  setValue: (data: GroupSortAppData) => void
  onCommit: (data: GroupSortAppData) => void
}

type Tab = 'groups' | 'items' | 'overview'

export default function GroupSortEditor({
  initialData,
  projectDir,
  getValue,
  setValue,
  onCommit
}: Props): JSX.Element {
  const [tab, setTab] = useState<Tab>('groups')

  const getValueRef = useRef(getValue)
  const setValueRef = useRef(setValue)

  useEffect(() => {
    getValueRef.current = getValue
    setValueRef.current = setValue
  }, [getValue, setValue])

  const { form, crud } = useGroupSortForm({
    initialData,
    onCommit,
    registerMethods: (methods) => {
      getValueRef.current = methods.getValue
      setValueRef.current = methods.setValue
    }
  })

  useEffect(() => {
    crud.setProjectDir(projectDir)
  }, [projectDir, crud])

  const groups = form.state.values.groups
  const items = form.state.values.items

  const unassigned = items.filter((i) => !i.groupId || !groups.find((g) => g.id === i.groupId))
  const unnamedG = groups.filter((g) => !g.name.trim())
  const unnamedI = items.filter((i) => !i.name.trim())
  const hasIssues = unassigned.length > 0 || unnamedG.length > 0 || unnamedI.length > 0
  const itemsPerGroup = groups.map((g) => ({
    group: g,
    count: items.filter((i) => i.groupId === g.id).length
  }))

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          background: '#13161f',
          p: 2,
          gap: 1
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
        >
          Sections
        </Typography>
        <SidebarTab
          active={tab === 'groups'}
          onClick={() => setTab('groups')}
          icon={<CategoryIcon fontSize="small" />}
          label="Groups"
          badge={groups.length}
          badgeColor={unnamedG.length > 0 ? 'error' : 'default'}
        />
        <SidebarTab
          active={tab === 'items'}
          onClick={() => setTab('items')}
          icon={<ExtensionIcon fontSize="small" />}
          label="Items"
          badge={items.length}
          badgeColor={unassigned.length > 0 || unnamedI.length > 0 ? 'error' : 'default'}
        />
        <SidebarTab
          active={tab === 'overview'}
          onClick={() => setTab('overview')}
          icon={<ViewQuiltIcon fontSize="small" />}
          label="Overview"
          badge={groups.length + items.length}
          badgeColor={hasIssues ? 'error' : 'default'}
        />

        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
        >
          Distribution
        </Typography>
        {groups.length === 0 ? (
          <Typography variant="caption" color="text.disabled">
            No groups yet
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {itemsPerGroup.map(({ group, count }) => (
              <Box
                key={group.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}
                >
                  {group.name || '(unnamed)'}
                </Typography>
                <Chip
                  label={count}
                  size="small"
                  sx={{ height: 16, fontSize: '0.65rem', minWidth: 24 }}
                  color={count === 0 ? 'default' : 'primary'}
                />
              </Box>
            ))}
          </Box>
        )}
        {unassigned.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
            <Typography variant="caption" color="warning.main">
              {unassigned.length} unassigned
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Collapse in={hasIssues}>
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
            {[
              unnamedG.length > 0 && `${unnamedG.length} group(s) missing a name`,
              unnamedI.length > 0 && `${unnamedI.length} item(s) missing a name`,
              unassigned.length > 0 && `${unassigned.length} item(s) not assigned to a group`
            ]
              .filter(Boolean)
              .join(' · ')}
          </Alert>
        </Collapse>

        {tab === 'groups' && (
          <GroupsTab
            groups={groups}
            projectDir={projectDir}
            onAdd={crud.addGroup}
            onAddFromDrop={crud.addGroupFromDrop}
            onUpdate={crud.updateGroup}
            onDelete={crud.deleteGroup}
          />
        )}
        {tab === 'items' && (
          <ItemsTab
            items={items}
            groups={groups}
            projectDir={projectDir}
            onAdd={crud.addItem}
            onAddFromDrop={crud.addItemFromDrop}
            onUpdate={crud.updateItem}
            onDelete={crud.deleteItem}
          />
        )}
        {tab === 'overview' && (
          <OverviewTab
            groups={groups}
            items={items}
            projectDir={projectDir}
            onAddGroup={crud.addGroup}
            onAddGroupFromDrop={crud.addGroupFromDrop}
            onAddItem={crud.addItem}
            onAddItemFromDrop={crud.addItemFromDrop}
            onUpdateGroup={crud.updateGroup}
            onUpdateItem={crud.updateItem}
            onDeleteGroup={crud.deleteGroup}
            onDeleteItem={crud.deleteItem}
            unassigned={unassigned}
          />
        )}
      </Box>
    </Box>
  )
}