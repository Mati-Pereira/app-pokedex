import { Ring } from '@uiball/loaders';
import {
  Children,
  isValidElement,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import Select, { components, createFilter, MenuListProps } from 'react-select';
import { List, ListImperativeAPI, RowComponentProps } from 'react-window';

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

const filterOption = createFilter<SelectOption>({ ignoreAccents: false, trim: true });
const optionHeight = 35;

interface MenuRowProps {
  children: ReactNode[];
}

function MenuRow({ index, style, children }: RowComponentProps<MenuRowProps>) {
  return <div style={style}>{children[index]}</div>;
}

function VirtualizedMenuList(props: MenuListProps<SelectOption, false>) {
  const children = Children.toArray(props.children);
  const focusedIndex = children.findIndex(
    child => isValidElement(child) && (child.props as { isFocused?: boolean }).isFocused
  );
  const listRef = useRef<ListImperativeAPI | null>(null);

  useEffect(() => {
    if (focusedIndex >= 0) listRef.current?.scrollToRow({ index: focusedIndex, align: 'smart' });
  }, [focusedIndex, listRef]);

  const height = Math.min(Math.max(0, props.maxHeight - 16), children.length * optionHeight);

  return (
    <components.MenuList {...props}>
      <List
        listRef={listRef}
        defaultHeight={height}
        rowComponent={MenuRow}
        rowCount={children.length}
        rowHeight={optionHeight}
        rowProps={{ children }}
        overscanCount={5}
        role="presentation"
        style={{ height, width: '100%' }}
      />
    </components.MenuList>
  );
}

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
      <Select<SelectOption, false>
        instanceId={instanceId}
        aria-label={ariaLabel}
        isLoading={isLoadingOptions}
        options={options}
        {...selectProps}
        filterOption={filterOption}
        components={{ MenuList: VirtualizedMenuList }}
        styles={{ menuList: base => ({ ...base, overflowY: 'hidden' } as typeof base) }}
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
