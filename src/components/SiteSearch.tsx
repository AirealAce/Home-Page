'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { type SiteSection } from '../data/siteContent';
import { getEnterAction, getSearchResults, parseSearchQuery, type SearchEntry, type SearchResult } from '../utils/siteSearch';

export function SiteSearch({ entries, onLocateEntry, onLocateSection }: {
  entries: SearchEntry[];
  onLocateEntry: (entry: SearchEntry) => void;
  onLocateSection: (section: SiteSection) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<SiteSection>();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const id = useId();
  const listId = `${id}-results`;
  const helpId = `${id}-help`;
  const parsed = useMemo(() => {
    const draft = parseSearchQuery(query);
    // A new section: query can replace the current tag via the same suggestions.
    return draft.section || draft.sectionQuery !== undefined
      ? draft : { ...draft, section: selectedSection };
  }, [query, selectedSection]);
  const results = useMemo(() => getSearchResults(parsed, entries), [parsed, entries]);
  const optionId = (index: number) => `${id}-option-${index}`;

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    const option = list?.children[activeIndex] as HTMLElement | undefined;
    if (!list || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [activeIndex, isOpen]);

  const close = () => { setIsOpen(false); setActiveIndex(-1); };

  const updateQuery = (value: string) => {
    // Leave a typed name editable until a space separates it from the query.
    const next = isComposingRef.current ? undefined : parseSearchQuery(value, { requireSectionSeparator: true });
    if (next?.section) {
      setSelectedSection(next.section);
      setQuery(next.query);
    } else {
      setQuery(selectedSection && !isComposingRef.current ? value.trimStart() : value);
    }
    setActiveIndex(-1);
    setIsOpen(true);
  };

  const removeSection = () => {
    setSelectedSection(undefined);
    setActiveIndex(-1);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const choose = (result: SearchResult) => {
    if (result.kind === 'section') {
      setSelectedSection(result.section);
      setQuery('');
      setActiveIndex(-1);
      setIsOpen(true);
      inputRef.current?.focus();
    } else {
      close();
      onLocateEntry(result.entry);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || isComposingRef.current) return;
    if (event.key === 'Backspace' && selectedSection && !query) {
      event.preventDefault();
      removeSection();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      if (results.length) setActiveIndex(current => (
        event.key === 'ArrowDown'
          ? (current + 1) % results.length
          : (current <= 0 ? results.length - 1 : current - 1)
      ));
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if ((event.key === 'Home' || event.key === 'End') && isOpen && activeIndex >= 0) {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : results.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const action = getEnterAction(parsed, results, isOpen ? activeIndex : -1);
      if (action?.kind === 'locate-section') {
        close();
        onLocateSection(action.section);
      } else if (action) {
        choose(action);
      }
    }
  };

  return (
    <div className="site-search" ref={rootRef} role="search" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) close();
    }}>
      <div className="site-search-field">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="site-search-icon" />
        <div className="site-search-tokens">
        {selectedSection && <span className="site-search-section-tag" role="group" aria-label={`Section filter: ${selectedSection.title}`}>
          <span className="site-search-section-label" title={`section: ${selectedSection.title}`}>
            <span className="site-search-section-prefix">section:</span> {selectedSection.title}
          </span>
          <button type="button" className="site-search-section-remove" aria-label={`Remove ${selectedSection.title} section filter`}
            onClick={removeSection}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </span>}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={selectedSection ? `Search buttons in ${selectedSection.title}` : 'Search projects and writings'}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={isOpen && activeIndex >= 0 && results[activeIndex] ? optionId(activeIndex) : undefined}
          aria-describedby={isOpen ? helpId : undefined}
          placeholder={selectedSection ? 'Search links…' : 'Search links… or section:'}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={event => updateQuery(event.target.value)}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={event => { isComposingRef.current = false; updateQuery(event.currentTarget.value); }}
          onKeyDown={handleKeyDown}
        />
        </div>
        {query && <button type="button" className="site-search-clear" aria-label="Clear search and section filter"
          onClick={() => { setQuery(''); setSelectedSection(undefined); setActiveIndex(-1); setIsOpen(true); inputRef.current?.focus(); }}>
          <FontAwesomeIcon icon={faXmark} />
        </button>}
      </div>
      {isOpen && <div className="site-search-dropdown">
        <ul className="site-search-results" id={listId} ref={listRef} role="listbox" aria-label="Search results">
          {results.map((result, index) => <li
            key={result.id}
            id={optionId(index)}
            role="option"
            aria-selected={index === activeIndex}
            className={`site-search-option${index === activeIndex ? ' is-active' : ''}`}
            onMouseDown={event => event.preventDefault()}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => choose(result)}
          >
            <span className="site-search-result-name">{result.kind === 'entry' ? result.entry.text : result.section.title}</span>
            <span className="site-search-result-context">{result.kind === 'entry'
              ? `${result.entry.cardTitle} | ${result.entry.sectionTitle}` : 'Section filter'}</span>
          </li>)}
        </ul>
        {!results.length && <p className="site-search-empty" role="status">
          {parsed.section && !parsed.query ? `No buttons in ${parsed.section.title} yet.` : 'No matches. Try fewer words or a different section.'}
        </p>}
        <p className="site-search-help" id={helpId}>
          {parsed.section && !parsed.query
            ? `Enter: go to ${parsed.section.title}. Type to filter, or use ↑ ↓ to choose a button.`
            : parsed.sectionQuery !== undefined
              ? '↑ ↓ to choose · Enter to use section filter · Esc to close'
              : '↑ ↓ to choose · Enter to locate · Enter again to open'}
        </p>
        <span className="visually-hidden" role="status" aria-live="polite">{results.length} results</span>
      </div>}
    </div>
  );
}
