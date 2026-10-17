import { lazy, Suspense } from "react";
import type { GroupBase, Props } from "react-select";
import SuspenseFallback from "../loader/SuspenseFallback";

const ActualSelect = lazy(() => import("react-select"));

export default function LazySelect<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: Props<Option, IsMulti, Group>) {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      {/* @ts-expect-error — lazy generic forwarding */}
      <ActualSelect {...props} />
    </Suspense>
  );
}
