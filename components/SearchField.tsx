import { Ring } from '@uiball/loaders';
import {
  Children,
  isValidElement,
  KeyboardEvent,
  ReactNode,
  WheelEvent as ReactWheelEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import Select, { components, createFilter, MenuListProps } from 'react-select';
import { List, ListImperativeAPI, RowComponentProps } from 'react-window';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

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
  onSelect: (option: SelectOption | null) => void;
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

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const list = listRef.current?.element;
    if (!list || event.deltaY === 0) return;

    event.preventDefault();
    const deltaMultiplier =
      event.deltaMode === 1 ? optionHeight : event.deltaMode === 2 ? list.clientHeight : 1;
    list.scrollTop += event.deltaY * deltaMultiplier;
  };

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
        onWheelCapture={handleWheel}
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
  const { language } = useLanguage();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || isMenuOpen || !canSearch) return;
    event.preventDefault();
    onSearch();
  };

  const selectProps = value === undefined ? {} : { value };

  return (
    <div className="flex min-w-0 items-stretch">
      <Select<SelectOption, false>
        instanceId={instanceId}
        aria-label={ariaLabel}
        isLoading={isLoadingOptions}
        options={options}
        isClearable
        isDisabled={isDisabled || !!isLoadingOptions}
        {...selectProps}
        filterOption={filterOption}
        loadingMessage={() => t(language, 'loadingOptions')}
        noOptionsMessage={() => t(language, 'noOptions')}
        screenReaderStatus={({ count }) => t(language, 'optionsAvailable', { count })}
        ariaLiveMessages={{
          guidance: () => t(language, 'keyboardGuidance'),
          onChange: ({ action, label }) => action === 'clear' ? t(language, 'selectionCleared') : t(language, 'selected', { label }),
          onFilter: ({ resultsMessage }) => resultsMessage,
          onFocus: ({ label, isSelected }) => isSelected ? `${label}, selecionado` : label,
        }}
        components={{ MenuList: VirtualizedMenuList }}
        styles={{
          menu: base => ({ ...base, backgroundColor: 'var(--select-surface)' }),
          control: (base, state) => ({
            ...base,
            minHeight: 48,
            borderColor: state.isFocused ? 'var(--select-focus)' : 'var(--select-border)',
            boxShadow: state.isFocused ? '0 0 0 2px var(--select-focus-ring)' : 'none',
            '&:hover': { borderColor: 'var(--select-focus)' },
          }),
          input: base => ({ ...base, color: 'var(--select-text)' }),
          placeholder: base => ({ ...base, color: 'var(--select-muted)' }),
          singleValue: base => ({ ...base, color: 'var(--select-text)' }),
          loadingMessage: base => ({ ...base, color: 'var(--select-muted)' }),
          noOptionsMessage: base => ({ ...base, color: 'var(--select-muted)' }),
          menuList: base => ({ ...base, overflowY: 'hidden' } as typeof base),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? 'var(--select-selected)'
              : state.isFocused
                ? 'var(--select-option-focus)'
                : 'var(--select-surface)',
            color: state.isSelected ? '#fff' : '#1e293b',
            cursor: 'pointer',
          }),
        }}
        onChange={option => onSelect(option)}
        onMenuOpen={() => setMenuOpen(true)}
        onMenuClose={() => setMenuOpen(false)}
        onKeyDown={handleKeyDown}
        className="min-w-0 flex-1"
        placeholder={placeholder}
      />
      <button
        type="button"
        className="min-h-12 min-w-12 rounded-r-full bg-pokedex p-3 text-center text-sm font-medium text-white hover:bg-pokedex-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus-visible:outline-blue-700"
        onClick={onSearch}
        disabled={isDisabled || !canSearch}
        aria-busy={isSearching}
        aria-label={`${t(language, 'search')}: ${ariaLabel}`}
      >
        {isSearching ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
      </button>
    </div>
  );
}

export default SearchField;
