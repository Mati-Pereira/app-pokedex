import { Ring } from '@uiball/loaders';
import { KeyboardEvent, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import WindowedSelect, { createFilter } from 'react-windowed-select';

export interface SelectOption {
  label: string;
  value: string;
}

interface SearchFieldProps {
  instanceId: string;
  placeholder: string;
  ariaLabel: string;
  options: SelectOption[] | undefined;
  /** Controlled selection; omit to let the select manage its own value. */
  value?: SelectOption | null;
  isLoadingOptions?: boolean;
  /** Whether a search can be started (something is selected). */
  canSearch: boolean;
  /** This field's own search is in flight. */
  isSearching: boolean;
  /** Any search is in flight; disables the button. */
  isDisabled: boolean;
  onSelect: (option: SelectOption) => void;
  onSearch: () => void;
}

const filterOption = createFilter({ ignoreAccents: false, trim: true });

function SearchField({
  instanceId,
  placeholder,
  ariaLabel,
  options,
  value,
  isLoadingOptions,
  canSearch,
  isSearching,
  isDisabled,
  onSelect,
  onSearch,
}: SearchFieldProps) {
  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || isMenuOpen || !canSearch) return;
    event.preventDefault();
    onSearch();
  };

  const selectProps = value === undefined ? {} : { value };

  return (
    <div className="flex items-stretch">
      <WindowedSelect
        instanceId={instanceId}
        isLoading={isLoadingOptions}
        options={options}
        {...selectProps}
        windowThreshold={50}
        filterOption={filterOption}
        onChange={(option: unknown) => {
          if (option) onSelect(option as SelectOption);
        }}
        onMenuOpen={() => setMenuOpen(true)}
        onMenuClose={() => setMenuOpen(false)}
        onKeyDown={handleKeyDown}
        className="w-48"
        placeholder={placeholder}
      />
      <button
        title="button"
        type="button"
        className="rounded-r-full bg-blue-700 p-3 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700"
        onClick={onSearch}
        disabled={isDisabled}
        aria-busy={isSearching}
        aria-label={ariaLabel}
      >
        {isSearching ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
      </button>
    </div>
  );
}

export default SearchField;
