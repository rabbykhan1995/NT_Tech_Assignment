import type { StylesConfig } from "react-select";
import type { SelectOption } from "../types/type";

// Colors are driven by CSS variables defined in index.css (:root / html.dark),
// so selects restyle instantly on theme toggle without any re-render.
export const getReactSelectStyles = <T extends { value: string; label: string } = SelectOption>(): StylesConfig<T> => {
  return {
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    input: (base) => ({ ...base, color: "var(--rs-text)" }),
    singleValue: (base) => ({ ...base, color: "var(--rs-text)" }),
    placeholder: (base) => ({ ...base, color: "var(--rs-placeholder)" }),
    control: (base) => ({
      ...base,
      backgroundColor: "var(--rs-control-bg)",
      borderColor: "var(--rs-border)",
    }),
    menu: (base) => ({ ...base, backgroundColor: "var(--rs-menu-bg)" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "var(--rs-option-focused-bg)" : "transparent",
      color: "var(--rs-text)",
    }),
    indicatorSeparator: (base) => ({
      ...base,
      display: "none",
    }),
  };
};


export const smallReactStyle = <T,>(): StylesConfig<T, false> => ({
  control: (base) => ({
    ...base,
    backgroundColor: "var(--rs-sm-control-bg)",
    borderColor: "var(--rs-border)",
    color: "var(--rs-text)",
    minHeight: '30px', // optional: compact height
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--rs-sm-menu-bg)",
    zIndex: 9999,
    fontSize: '11px'
  }),
  option: (base, state) => ({
    ...base,

    backgroundColor: state.isFocused
      ? "var(--rs-sm-option-focused-bg)"
      : "var(--rs-sm-option-bg)",
    color: "var(--rs-text)",
    fontSize: '11px',
    padding: '2px 4px',
  }),
  input: (base) => ({
    ...base,
    color: "var(--rs-text)",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--rs-text)",
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--rs-placeholder)",
  }),
  // ✅ Hide dropdown arrow
  dropdownIndicator: (base) => ({
    ...base,
    display: "none",
  }),
  // ✅ Hide separator between input and arrow
  indicatorSeparator: (base) => ({
    ...base,
    display: "none",
  }),
  // ✅ Hide clear (X) button
  clearIndicator: (base) => ({
    ...base,
    display: "none",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  }),
});


export const smallReactStyleMulti = <T,>(): StylesConfig<T, true> => ({
  control: (base) => ({
    ...base,
    backgroundColor: "var(--rs-sm-control-bg)",
    borderColor: "var(--rs-border)",
    color: "var(--rs-text)",
    minHeight: '30px',
    fontSize: '11px',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--rs-sm-menu-bg)",
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "var(--rs-sm-option-focused-bg)"
      : "var(--rs-sm-option-bg)",
    color: "var(--rs-text)",
    fontSize: '11px',
    padding: '2px 4px',
  }),
  input: (base) => ({
    ...base,
    color: "var(--rs-text)",
    fontSize: '11px',
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--rs-placeholder)",
    fontSize: '11px',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "var(--rs-sm-multivalue-bg)",
    fontSize: '11px',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "var(--rs-text)",
    fontSize: '11px',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "var(--rs-placeholder)",
    ':hover': {
      backgroundColor: "var(--rs-sm-mvremove-hover-bg)",
      color: '#ffffff',
    },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    display: "none",
  }),
  indicatorSeparator: (base) => ({
    ...base,
    display: "none",
  }),
  clearIndicator: (base) => ({
    ...base,
    display: "none",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  }),
});
