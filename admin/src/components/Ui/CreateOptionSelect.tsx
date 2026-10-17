import { useState } from "react";
import type { GroupBase, InputActionMeta, StylesConfig } from "react-select";
import { Plus } from "lucide-react";
import LazySelect from "./LazySelect";
import CreateEntityModal, { type ExtraField } from "../modals/CreateEntityModal";
import Helper from "../../utils/helper";
import type { SelectOption } from "../../types/type";

type CreatableEntity = { id: number; name: string };

type CreateOptionSelectProps<T extends CreatableEntity = CreatableEntity> = {
  options: SelectOption<T>[];
  value: SelectOption<T> | null;
  onChange: (option: SelectOption<T> | null) => void;
  onCreate: (name: string, fields: Record<string, string>) => Promise<SelectOption<T>>;
  onSearchChange?: (search: string) => void;
  placeholder?: string;
  isClearable?: boolean;
  permission?: string;
  modalTitle?: string;
  inputLabel?: string;
  createButtonLabel?: string;
  fields?: ExtraField[];
  styles?: StylesConfig<SelectOption<T>, false, GroupBase<SelectOption<T>>>;
  className?: string;
};

export default function CreateOptionSelect<T extends CreatableEntity = CreatableEntity>({
  options,
  value,
  onChange,
  onCreate,
  onSearchChange,
  placeholder,
  isClearable,
  permission,
  modalTitle = "Create New Option",
  inputLabel = "Name",
  createButtonLabel = "Create",
  fields,
  styles,
  className = "",
}: CreateOptionSelectProps<T>) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [session, setSession] = useState(0);

  const canCreate = !permission || Helper.isPermitter(permission);
  const query = search.trim().toLowerCase();
  const hasMatchingOption =
    query.length > 0 &&
    options.some((opt) =>
      String(opt.label ?? opt.value ?? "").toLowerCase().includes(query)
    );
  const showCreateButton = canCreate && query.length > 0 && !hasMatchingOption;

  const openCreateModal = () => {
    setDraftName(search);
    setSession((s) => s + 1);
    setOpen(true);
  };

  const handleChange = (next: SelectOption<T> | null) => {
    onChange(next);
    setSearch("");
    onSearchChange?.("");
  };

  const handleSubmitCreate = async (values: { name: string; fields: Record<string, string> }) => {
    if (!values.name.trim() || creating) return;
    setCreating(true);
    try {
      const created = await onCreate(values.name.trim(), values.fields);
      handleChange(created);
      setOpen(false);
    } catch {
      // keep modal open; error toast is handled by the caller
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className={`flex items-start gap-1 ${className}`}>
        <div className="flex-1 min-w-0">
          <LazySelect<SelectOption<T>>
            options={options}
            value={value}
            onChange={(val) => handleChange(val as SelectOption<T> | null)}
            onInputChange={(val: string, action: InputActionMeta) => {
              if (action.action === "input-change") {
                setSearch(val);
                onSearchChange?.(val);
              }
            }}
            inputValue={search}
            placeholder={placeholder}
            isClearable={isClearable}
            styles={styles}
            blurInputOnSelect={false}
            noOptionsMessage={({ inputValue }) =>
              canCreate && inputValue.trim().length > 0
                ? "No results — use + to create"
                : "No options"
            }
          />
        </div>
        {showCreateButton && (
          <button
            type="button"
            onClick={openCreateModal}
            className="global_button px-2.5 h-full whitespace-nowrap"
            title={`Create "${search.trim()}"`}
          >
            <Plus size={16} />
            <span className="hidden sm:inline"> {createButtonLabel}</span>
          </button>
        )}
      </div>

      <CreateEntityModal
        key={open ? session : 0}
        isOpen={open}
        title={modalTitle}
        label={inputLabel}
        initialName={draftName}
        loading={creating}
        submitLabel={"Create"}
        fields={fields}
        onClose={() => setOpen(false)}
        onSubmit={(values) => void handleSubmitCreate(values)}
      />
    </>
  );
}