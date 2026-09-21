import { Injectable, signal } from '@angular/core';
import { GridApi } from 'ag-grid-community';
import { ErpGridRowWrapper, GridBatchPayload, SqlRowState } from '../models/grid-row-state.enum';
import { areGridValuesEqual } from '../utils/lookup-options';

@Injectable()
export class GridApiService<T = any> {
  private gridApi?: GridApi;
  private rowIdField?: string;
  public rows = signal<ErpGridRowWrapper<T>[]>([]);
  public selectedUids = signal<string[]>([]);
  public isDirty = signal<boolean>(false);

  setApi(api: GridApi): void {
    this.gridApi = api;
  }

  /**
   * Commit any row still open in the editor.
   *
   * A row being edited holds its changes in AG Grid until the edit ends, so `(rowChange)` has not
   * fired yet and the form's own row state is one edit behind. A form that builds its save payload
   * while a cell is open therefore posts stale data — on PUR_1105 that meant typing a batch code
   * and hitting Save was rejected as if the field were still empty. Call this FIRST in any save,
   * submit or post handler that reads rows the grid can edit.
   */
  stopEditing(): void {
    this.gridApi?.stopEditing();
  }

  setRows(dataList: T[], rowIdField?: string): void {
    this.rowIdField = rowIdField;
    const wrappers: ErpGridRowWrapper<T>[] = dataList.map((item, index) => {
      const uid = rowIdField && (item as any)[rowIdField] ? String((item as any)[rowIdField]) : `row_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`;
      return {
        __uid: uid,
        __sqlState: SqlRowState.Unchanged,
        __isDirty: false,
        __errors: {},
        data: { ...item },
      };
    });
    this.rows.set(wrappers);
    this.isDirty.set(false);
  }

  addRow(defaultData?: Partial<T>, position: 'top' | 'bottom' = 'bottom'): string {
    const uid = `new_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newWrapper: ErpGridRowWrapper<T> = {
      __uid: uid,
      __sqlState: SqlRowState.Insert,
      __isDirty: true,
      __errors: {},
      data: (defaultData ?? {}) as T,
    };

    const current = [...this.rows()];
    if (position === 'top') {
      current.unshift(newWrapper);
    } else {
      current.push(newWrapper);
    }

    this.rows.set(current);
    this.isDirty.set(true);
    return uid;
  }

  deleteRow(uid: string): void {
    const current = [...this.rows()];
    const index = current.findIndex((r) => r.__uid === uid);
    if (index < 0) return;

    const row = current[index];
    if (row.__sqlState === SqlRowState.Insert) {
      current.splice(index, 1);
    } else {
      current[index] = {
        ...row,
        __sqlState: SqlRowState.Delete,
        __isDirty: true,
      };
    }

    // Remove from selected uids
    this.selectedUids.update((uids) => uids.filter((id) => id !== uid));

    this.rows.set(current);
    this.isDirty.set(true);
  }

  duplicateRow(uid: string): string | null {
    const row = this.rows().find((r) => r.__uid === uid);
    if (!row) return null;

    const copyData = JSON.parse(JSON.stringify(row.data));
    if (this.rowIdField) delete copyData[this.rowIdField];
    delete copyData['id'];
    delete copyData['row_version'];
    return this.addRow(copyData);
  }

  updateCellValue(uid: string, field: string, newValue: any): void {
    const current = [...this.rows()];
    const index = current.findIndex((r) => r.__uid === uid);
    if (index < 0) return;

    const wrapper = current[index];
    const oldValue = (wrapper.data as any)?.[field];
    if (areGridValuesEqual(oldValue, newValue)) {
      return;
    }

    const updatedData = { ...wrapper.data, [field]: newValue };
    const nextState = wrapper.__sqlState === SqlRowState.Insert ? SqlRowState.Insert : SqlRowState.Update;

    current[index] = {
      ...wrapper,
      __sqlState: nextState,
      __isDirty: true,
      data: updatedData,
    };

    this.rows.set(current);
    this.isDirty.set(true);
  }

  setRowError(uid: string, field: string, errorMsg: string | null): void {
    const current = [...this.rows()];
    const index = current.findIndex((r) => r.__uid === uid);
    if (index < 0) return;

    const wrapper = current[index];
    const errors = { ...wrapper.__errors };
    if (errorMsg) {
      errors[field] = errorMsg;
    } else {
      delete errors[field];
    }

    current[index] = {
      ...wrapper,
      __errors: errors,
    };
    this.rows.set(current);
  }

  getDirtyRows(): GridBatchPayload<T> {
    const current = this.rows();
    const inserted: T[] = [];
    const updated: T[] = [];
    const deleted: T[] = [];
    let hasErrors = false;

    for (const r of current) {
      if (Object.keys(r.__errors).length > 0) hasErrors = true;

      if (r.__sqlState === SqlRowState.Insert) {
        inserted.push(r.data);
      } else if (r.__sqlState === SqlRowState.Update) {
        updated.push(r.data);
      } else if (r.__sqlState === SqlRowState.Delete) {
        deleted.push(r.data);
      }
    }

    return { inserted, updated, deleted, hasErrors };
  }

  getAllRows(): T[] {
    return this.rows().filter((r) => r.__sqlState !== SqlRowState.Delete).map((r) => r.data);
  }

  clearDirtyState(): void {
    const current = this.rows().filter((r) => r.__sqlState !== SqlRowState.Delete).map((r) => ({
      ...r,
      __sqlState: SqlRowState.Unchanged,
      __isDirty: false,
      __errors: {},
    }));
    this.rows.set(current);
    this.isDirty.set(false);
  }

  refreshView(): void {
    if (this.gridApi) {
      this.gridApi.refreshCells({ force: true });
    }
  }
}
