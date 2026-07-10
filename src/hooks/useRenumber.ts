import { useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  applyManualReorder,
  getListRows,
  hasManualOverride,
  seedRenumber,
  type OrderAssignment,
} from '../lib/numbering/numbering';
import type { PropertyRow } from '../lib/supabase/types';

export function useRenumber(inBoundsRows: PropertyRow[], onApply: (updates: OrderAssignment[]) => void) {
  const [showConfirm, setShowConfirm] = useState(false);
  const listRows = getListRows(inBoundsRows);

  function onRenumberClick() {
    if (hasManualOverride(inBoundsRows)) {
      setShowConfirm(true);
    } else {
      onApply(seedRenumber(inBoundsRows));
    }
  }

  function confirmRenumber() {
    onApply(seedRenumber(inBoundsRows));
    setShowConfirm(false);
  }

  function cancelRenumber() {
    setShowConfirm(false);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = listRows.findIndex((r) => r.id === active.id);
    const newIndex = listRows.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(listRows, oldIndex, newIndex);
    onApply(applyManualReorder(reordered));
  }

  return {
    listRows,
    showConfirm,
    onRenumberClick,
    confirmRenumber,
    cancelRenumber,
    onDragEnd,
  };
}
