import { useConfirmStore, type ConfirmOptions } from "../stores/confirm.store";

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().openConfirm(options);
}