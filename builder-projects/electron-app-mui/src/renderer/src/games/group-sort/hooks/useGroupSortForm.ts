/**
 * TanStack Form hook for GroupSort Editor.
 * Provides uncontrolled state management with commit-on-blur pattern.
 *
 * Pattern: Editor creates form internally via useForm, then registers getValue/setValue methods
 * to parent via onRegisterMethods callback.
 */

import { useForm } from '@tanstack/react-form'
import { useSettings } from '@renderer/hooks/useSettings'
import type { GroupSortAppData, GroupSortGroup, GroupSortItem } from '@shared/types'
import { useCallback, useMemo, useRef, type MutableRefObject } from 'react'

function normalize(d: GroupSortAppData): GroupSortAppData {
  return { ...d, _groupCounter: d._groupCounter ?? 0, _itemCounter: d._itemCounter ?? 0 }
}

export interface GroupSortEditorRef {
  getValue: () => GroupSortAppData
  setValue: (data: GroupSortAppData) => void
}

export interface UseGroupSortFormOptions {
  initialData: GroupSortAppData
  onCommit: (data: GroupSortAppData) => void
  registerMethods: (methods: GroupSortEditorRef) => void
}

export function useGroupSortForm({
  initialData,
  onCommit,
  registerMethods
}: UseGroupSortFormOptions) {
  const { resolved } = useSettings()
  const normalizedInitial = useMemo(() => normalize(initialData), [initialData])

  const projectDirRef = useRef('')
  const setProjectDir = (dir: string) => {
    projectDirRef.current = dir
  }

  const form = useForm<GroupSortAppData>({
    defaultValues: normalizedInitial,
    onSubmit: () => {}
  })

  const formRef = useRef(form)
  formRef.current = form

  const handleCommit = useCallback(() => {
    const current = formRef.current.state.values as GroupSortAppData
    onCommit(current)
  }, [onCommit])

  const getValue = useCallback((): GroupSortAppData => {
    return formRef.current.state.values as GroupSortAppData
  }, [])

  const setValue = useCallback((data: GroupSortAppData) => {
    formRef.current.reset(normalize(data))
  }, [])

  const nextGroupId = useCallback(() => {
    const c = form.state.values._groupCounter + 1
    return { id: `group-${c}`, counter: c }
  }, [form])

  const nextItemId = useCallback(() => {
    const c = form.state.values._itemCounter + 1
    return { id: `item-${c}`, counter: c }
  }, [form])

  const addGroup = useCallback(
    async (initialImage?: string) => {
      const { id, counter } = nextGroupId()
      const g: GroupSortGroup = {
        id,
        name: resolved.prefillNames ? `Group ${counter}` : '',
        imagePath: initialImage ?? null
      }
      const current = form.state.values
      form.setValues({
        ...current,
        _groupCounter: counter,
        groups: [...current.groups, g]
      })
      handleCommit()
    },
    [form, resolved.prefillNames, nextGroupId, handleCommit]
  )

  const addGroupFromDrop = useCallback(
    async (filePath: string) => {
      const { id, counter } = nextGroupId()
      const projectDir = projectDirRef.current
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const g: GroupSortGroup = {
        id,
        name: resolved.prefillNames ? `Group ${counter}` : '',
        imagePath
      }
      const current = form.state.values
      form.setValues({
        ...current,
        _groupCounter: counter,
        groups: [...current.groups, g]
      })
      handleCommit()
    },
    [form, resolved.prefillNames, nextGroupId, handleCommit]
  )

  const updateGroup = useCallback(
    (id: string, patch: Partial<GroupSortGroup>) => {
      const current = form.state.values
      form.setValues({
        ...current,
        groups: current.groups.map((g) => (g.id === id ? { ...g, ...patch } : g))
      })
      handleCommit()
    },
    [form, handleCommit]
  )

  const deleteGroup = useCallback(
    (id: string) => {
      const current = form.state.values
      form.setValues({
        ...current,
        groups: current.groups.filter((g) => g.id !== id),
        items: current.items.map((i) => (i.groupId === id ? { ...i, groupId: '' } : i))
      })
      handleCommit()
    },
    [form, handleCommit]
  )

  const addItem = useCallback(
    (groupId?: string, initialImage?: string) => {
      const { id, counter } = nextItemId()
      const groups = form.state.values.groups
      const targetGroupId = groupId ?? groups[groups.length - 1]?.id ?? ''
      const i: GroupSortItem = {
        id,
        name: resolved.prefillNames ? `Item ${counter}` : '',
        imagePath: initialImage ?? null,
        groupId: targetGroupId
      }
      const current = form.state.values
      form.setValues({
        ...current,
        _itemCounter: counter,
        items: [...current.items, i]
      })
      handleCommit()
    },
    [form, resolved.prefillNames, nextItemId, handleCommit]
  )

  const addItemFromDrop = useCallback(
    async (filePath: string, groupId?: string) => {
      const { id, counter } = nextItemId()
      const projectDir = projectDirRef.current
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const groups = form.state.values.groups
      const targetGroupId = groupId ?? groups[groups.length - 1]?.id ?? ''
      const i: GroupSortItem = {
        id,
        name: resolved.prefillNames ? `Item ${counter}` : '',
        imagePath,
        groupId: targetGroupId
      }
      const current = form.state.values
      form.setValues({
        ...current,
        _itemCounter: counter,
        items: [...current.items, i]
      })
      handleCommit()
    },
    [form, resolved.prefillNames, nextItemId, handleCommit]
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<GroupSortItem>) => {
      const current = form.state.values
      form.setValues({
        ...current,
        items: current.items.map((i) => (i.id === id ? { ...i, ...patch } : i))
      })
      handleCommit()
    },
    [form, handleCommit]
  )

  const deleteItem = useCallback(
    (id: string) => {
      const current = form.state.values
      form.setValues({
        ...current,
        items: current.items.filter((i) => i.id !== id)
      })
      handleCommit()
    },
    [form, handleCommit]
  )

  const crud = {
    addGroup,
    addGroupFromDrop,
    updateGroup,
    deleteGroup,
    addItem,
    addItemFromDrop,
    updateItem,
    deleteItem,
    setProjectDir
  }

  // Register methods with parent
  registerMethods({ getValue, setValue })

  return {
    form,
    crud
  }
}

export interface GroupSortCrud {
  addGroup: (initialImage?: string) => void
  addGroupFromDrop: (filePath: string) => Promise<void>
  updateGroup: (id: string, patch: Partial<GroupSortGroup>) => void
  deleteGroup: (id: string) => void
  addItem: (groupId?: string, initialImage?: string) => void
  addItemFromDrop: (filePath: string, groupId?: string) => Promise<void>
  updateItem: (id: string, patch: Partial<GroupSortItem>) => void
  deleteItem: (id: string) => void
  setProjectDir: (dir: string) => void
}