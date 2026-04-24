import { AnyAppData } from '@shared'
import React from 'react'
import { LegacyEditorProps } from '../games/legacyEditorProps'
import { EditorWrapper, EditorWrapperHandle } from './EditorWrapper'

// Helper to obtain a wrapped editor from an existing editor component
// This is a thin adapter that can be used by the registry to migrate editors progressively

type WrapperIncomingProps<T extends AnyAppData> = {
  initialData: T
  projectDir: string
  onCommit: (data: T) => void
}

export function wrapEditor<T extends AnyAppData>(
  EditorComponent: React.ComponentType<LegacyEditorProps<T>>
): React.ComponentType<WrapperIncomingProps<T> & React.RefAttributes<EditorWrapperHandle<T>>> {
  const Wrapped = React.forwardRef<EditorWrapperHandle<T>, WrapperIncomingProps<T>>(
    (props, ref) => <EditorWrapper ref={ref} EditorComponent={EditorComponent} {...props} />
  )
  Wrapped.displayName = `WrapEditor(${EditorComponent.displayName ?? EditorComponent.name ?? 'Editor'})`
  return Wrapped
}
