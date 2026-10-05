import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { fetchEvolutionChain, getEvolutionSpriteUrl } from '../lib/evolution';
import { getEvolutionConditionGroups } from '../lib/evolutionText';
import { t } from '../lib/i18n';
import { usePokeApi } from '../lib/usePokeApi';
import type { EvolutionNode } from '../types/evolution';

interface EvolutionChainProps {
  speciesUrl: string;
  currentName: string;
}

interface EvolutionTreeProps {
  node: EvolutionNode;
  currentName: string;
  selectedName: string | null;
  onSelect: (name: string) => void;
  isRoot?: boolean;
}

interface EvolutionTransition {
  from: string;
  to: EvolutionNode;
}

const radialSlots: Record<number, number[]> = {
  2: [3, 5],
  3: [1, 6, 8],
  4: [0, 2, 6, 8],
  5: [0, 1, 2, 6, 8],
  6: [0, 1, 2, 6, 7, 8],
  7: [0, 1, 2, 3, 5, 6, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
};

const gridSlotClasses = [
  'col-start-1 row-start-1',
  'col-start-2 row-start-1',
  'col-start-3 row-start-1',
  'col-start-1 row-start-2',
  'col-start-2 row-start-2',
  'col-start-3 row-start-2',
  'col-start-1 row-start-3',
  'col-start-2 row-start-3',
  'col-start-3 row-start-3',
];

const radialPoints: Record<number, { x: number; y: number }> = {
  0: { x: 167, y: 125 },
  1: { x: 500, y: 125 },
  2: { x: 833, y: 125 },
  3: { x: 167, y: 375 },
  5: { x: 833, y: 375 },
  6: { x: 167, y: 625 },
  7: { x: 500, y: 625 },
  8: { x: 833, y: 625 },
};

function collectTransitions(node: EvolutionNode): EvolutionTransition[] {
  return node.evolves_to.flatMap(child => [
    { from: node.species.name, to: child },
    ...collectTransitions(child),
  ]);
}

function getTransitionSummary(node: EvolutionNode, language: 'pt-BR' | 'en'): string {
  const groups = getEvolutionConditionGroups(node.evolution_details, language);
  if (groups.length > 1) {
    return t(language, 'evolutionMethodCount', { count: groups.length });
  }

  return groups
    .map(group => {
      const genericLevelUp = t(language, 'evolutionLevelUp');
      const summaryIndex = group.length > 1 && group[0] === genericLevelUp ? 1 : 0;
      const firstCondition = group[summaryIndex] ?? t(language, 'evolutionConditionUnknown');
      const remainingConditions = Math.max(0, group.length - summaryIndex - 1);
      return remainingConditions > 0
        ? firstCondition +
            ' ' +
            t(language, 'evolutionMoreConditions', { count: remainingConditions })
        : firstCondition;
    })
    .join(' ' + t(language, 'evolutionOr') + ' ');
}

function EvolutionPokemonCard({
  node,
  currentName,
  selectedName,
  onSelect,
  isRoot = false,
}: EvolutionTreeProps) {
  const { language } = useLanguage();
  const isCurrent = node.species.name === currentName;
  const isSelected = node.species.name === selectedName;
  const spriteUrl = getEvolutionSpriteUrl(node.species.url);

  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <Link
        href={'/' + node.species.name}
        aria-current={isCurrent ? 'page' : undefined}
        aria-label={t(language, 'viewDetails', { name: node.species.name })}
        className={
          'focus-visible:outline-pokedex flex min-w-36 flex-col items-center rounded-xl border p-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:focus-visible:outline-blue-300 ' +
          (isCurrent
            ? 'border-pokedex bg-pokedex-soft shadow-sm dark:border-blue-300 dark:bg-slate-700'
            : isSelected
              ? 'border-pokedex ring-pokedex/30 bg-paper ring-2 dark:border-blue-300 dark:bg-slate-800'
              : 'border-paper-border bg-paper hover:bg-pokedex-soft dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700')
        }
      >
        {spriteUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={spriteUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-20 w-20 object-contain [image-rendering:pixelated]"
          />
        ) : (
          <span className="h-20 w-20" aria-hidden="true" />
        )}
        <span className="text-paper-ink font-semibold dark:text-slate-100">
          {node.species.name.toUpperCase()}
        </span>
        {isCurrent && (
          <span className="text-pokedex-soft-ink mt-1 text-xs font-semibold dark:text-blue-200">
            {t(language, 'evolutionCurrent')}
          </span>
        )}
      </Link>
      {!isRoot && (
        <button
          type="button"
          aria-pressed={isSelected}
          aria-label={t(language, 'evolutionViewConditionsFor', { name: node.species.name })}
          onClick={() => onSelect(node.species.name)}
          className="focus-visible:outline-pokedex text-pokedex min-h-8 rounded-md px-2 text-xs font-semibold underline decoration-transparent underline-offset-2 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-blue-300 dark:focus-visible:outline-blue-300"
        >
          {isSelected ? t(language, 'evolutionSelected') : t(language, 'evolutionViewConditions')}
        </button>
      )}
    </div>
  );
}

function EvolutionArrow({
  node,
  selectedName,
}: {
  node: EvolutionNode;
  selectedName: string | null;
}) {
  const isSelected = node.species.name === selectedName;
  return (
    <svg
      data-testid="evolution-arrow"
      data-target={node.species.name}
      data-selected={isSelected}
      aria-hidden="true"
      viewBox="0 0 120 32"
      className={
        'h-9 w-44 shrink-0 sm:w-52 ' +
        (isSelected ? 'text-pokedex dark:text-blue-300' : 'text-slate-300 dark:text-slate-700')
      }
    >
      <path
        d="M4 16H102M88 4L104 16 88 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RadialEvolution({
  node,
  currentName,
  selectedName,
  onSelect,
  isRoot = false,
}: EvolutionTreeProps) {
  const markerId = 'evolution-arrow-' + node.species.name;
  const slots = radialSlots[node.evolves_to.length] ?? radialSlots[8] ?? [];

  return (
    <div
      data-testid="evolution-radial"
      className="relative mx-auto aspect-[4/3] w-full max-w-[64rem] min-w-[48rem]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1000 750"
        preserveAspectRatio="none"
        className="text-pokedex pointer-events-none absolute inset-0 h-full w-full dark:text-blue-300"
      >
        <defs>
          <marker id={markerId} markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
            <path d="M0 0L12 6 0 12Z" fill="currentColor" />
          </marker>
        </defs>
        {slots.slice(0, node.evolves_to.length).map(slot => {
          const point = radialPoints[slot];
          const child = node.evolves_to[slots.indexOf(slot)];
          if (!point || !child) return null;
          const endX = 500 + (point.x - 500) * 0.72;
          const endY = 375 + (point.y - 375) * 0.72;
          const isSelected = child.species.name === selectedName;
          return (
            <path
              key={child.species.name}
              data-testid="evolution-radial-arrow"
              data-target={child.species.name}
              data-selected={isSelected}
              d={'M500 375L' + endX + ' ' + endY}
              fill="none"
              stroke="currentColor"
              strokeWidth={isSelected ? 9 : 7}
              strokeLinecap="round"
              markerEnd={'url(#' + markerId + ')'}
              className={isSelected ? 'opacity-100' : 'opacity-30'}
            />
          );
        })}
      </svg>

      <div className="relative z-10 grid h-full grid-cols-3 grid-rows-3 place-items-center">
        {node.evolves_to.map((child, index) => {
          const slot = slots[index];
          const slotClass = slot === undefined ? undefined : gridSlotClasses[slot];
          if (!slotClass) return null;
          return (
            <div
              key={child.species.name}
              className={slotClass + ' flex min-w-0 items-center justify-center'}
            >
              <EvolutionTree
                node={child}
                currentName={currentName}
                selectedName={selectedName}
                onSelect={onSelect}
              />
            </div>
          );
        })}
        <div className="col-start-2 row-start-2">
          <EvolutionPokemonCard
            node={node}
            currentName={currentName}
            selectedName={selectedName}
            onSelect={onSelect}
            isRoot={isRoot}
          />
        </div>
      </div>
    </div>
  );
}

function EvolutionTree({
  node,
  currentName,
  selectedName,
  onSelect,
  isRoot = false,
}: EvolutionTreeProps) {
  if (node.evolves_to.length > 8) {
    return (
      <div className="mx-auto flex w-max flex-col items-center gap-4">
        <EvolutionPokemonCard
          node={node}
          currentName={currentName}
          selectedName={selectedName}
          onSelect={onSelect}
          isRoot={isRoot}
        />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {node.evolves_to.map(child => (
            <li key={child.species.name} className="flex flex-col items-center gap-2">
              <EvolutionArrow node={child} selectedName={selectedName} />
              <EvolutionTree
                node={child}
                currentName={currentName}
                selectedName={selectedName}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (node.evolves_to.length > 1) {
    return (
      <RadialEvolution
        node={node}
        currentName={currentName}
        selectedName={selectedName}
        onSelect={onSelect}
        isRoot={isRoot}
      />
    );
  }

  if (node.evolves_to.length === 1) {
    const child = node.evolves_to[0];
    if (!child) {
      return (
        <EvolutionPokemonCard
          node={node}
          currentName={currentName}
          selectedName={selectedName}
          onSelect={onSelect}
          isRoot={isRoot}
        />
      );
    }
    return (
      <div className="mx-auto flex w-max items-center justify-center gap-4 sm:gap-6">
        <EvolutionPokemonCard
          node={node}
          currentName={currentName}
          selectedName={selectedName}
          onSelect={onSelect}
          isRoot={isRoot}
        />
        <EvolutionArrow node={child} selectedName={selectedName} />
        <EvolutionTree
          node={child}
          currentName={currentName}
          selectedName={selectedName}
          onSelect={onSelect}
        />
      </div>
    );
  }

  return (
    <EvolutionPokemonCard
      node={node}
      currentName={currentName}
      selectedName={selectedName}
      onSelect={onSelect}
      isRoot={isRoot}
    />
  );
}

function EvolutionDetailsPanel({
  transitions,
  selectedName,
  onSelect,
}: {
  transitions: EvolutionTransition[];
  selectedName: string | null;
  onSelect: (name: string) => void;
}) {
  const { language } = useLanguage();
  const selected = transitions.find(transition => transition.to.species.name === selectedName);
  const grouped = new Map<string, EvolutionTransition[]>();
  transitions.forEach(transition => {
    const group = grouped.get(transition.from) ?? [];
    group.push(transition);
    grouped.set(transition.from, group);
  });

  return (
    <aside
      aria-labelledby="evolution-conditions-heading"
      className="border-paper-border bg-paper rounded-xl border p-4 dark:border-slate-700 dark:bg-slate-800"
    >
      <h3 id="evolution-conditions-heading" className="text-lg font-bold">
        {t(language, 'evolutionOptions')}
      </h3>

      <div className="mt-3 space-y-4">
        {Array.from(grouped.entries()).map(([from, options]) => (
          <section key={from}>
            <h4 className="text-paper-ink mb-2 text-sm font-semibold dark:text-slate-200">
              {t(language, 'evolutionOptionsFrom', { name: from.toUpperCase() })}
            </h4>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {options.map(({ to }) => {
                const isSelected = to.species.name === selectedName;
                return (
                  <li key={to.species.name}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelect(to.species.name)}
                      className={
                        'focus-visible:outline-pokedex w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:focus-visible:outline-blue-300 ' +
                        (isSelected
                          ? 'border-pokedex bg-pokedex-soft dark:border-blue-300 dark:bg-slate-700'
                          : 'border-paper-border hover:bg-pokedex-soft dark:border-slate-600 dark:hover:bg-slate-700')
                      }
                    >
                      <span className="flex items-center justify-between gap-2 font-semibold">
                        <span>{to.species.name.toUpperCase()}</span>
                        {isSelected && (
                          <span className="text-xs font-medium">
                            {t(language, 'evolutionSelected')}
                          </span>
                        )}
                      </span>
                      <span className="text-paper-ink mt-1 block text-sm dark:text-slate-200">
                        {getTransitionSummary(to, language)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {selected ? (
        <section className="border-paper-border mt-5 border-t pt-4 dark:border-slate-600">
          <h4 className="text-base font-bold">
            {t(language, 'evolutionConditionsFor', {
              name: selected.to.species.name.toUpperCase(),
            })}
          </h4>
          <p className="text-paper-ink mt-1 text-sm dark:text-slate-300">
            {t(language, 'evolutionAllConditions')}
          </p>
          <ul className="mt-3 space-y-3">
            {getEvolutionConditionGroups(selected.to.evolution_details, language).map(
              (group, index) => (
                <li
                  key={index}
                  className="border-paper-border rounded-lg border p-3 dark:border-slate-600"
                >
                  {index > 0 && (
                    <p className="text-pokedex mb-2 text-xs font-bold uppercase dark:text-blue-300">
                      {t(language, 'evolutionOr')}
                    </p>
                  )}
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {group.map((condition, conditionIndex) => (
                      <li key={conditionIndex}>{condition}</li>
                    ))}
                  </ul>
                </li>
              )
            )}
          </ul>
        </section>
      ) : (
        <p className="text-paper-ink mt-4 text-sm dark:text-slate-300">
          {t(language, 'evolutionEmpty')}
        </p>
      )}
    </aside>
  );
}

export function EvolutionTreeView({
  node,
  currentName,
}: {
  node: EvolutionNode;
  currentName: string;
}) {
  const transitions = collectTransitions(node);
  const matchingCurrent = transitions.find(
    transition => transition.to.species.name === currentName
  );
  const initialSelection =
    matchingCurrent?.to.species.name ?? transitions[0]?.to.species.name ?? null;
  const [selectedName, setSelectedName] = useState<string | null>(initialSelection);

  useEffect(() => {
    setSelectedName(initialSelection);
  }, [node, currentName, initialSelection]);

  return (
    <div className="flex flex-col gap-5">
      <div className="min-w-0 overflow-x-auto pb-2">
        <EvolutionTree
          node={node}
          currentName={currentName}
          selectedName={selectedName}
          onSelect={setSelectedName}
          isRoot
        />
      </div>
      {transitions.length > 0 && (
        <EvolutionDetailsPanel
          transitions={transitions}
          selectedName={selectedName}
          onSelect={setSelectedName}
        />
      )}
    </div>
  );
}

export default function EvolutionChain({ speciesUrl, currentName }: EvolutionChainProps) {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleSpeciesUrl, setVisibleSpeciesUrl] = useState<string | null>(null);
  const isVisible = visibleSpeciesUrl === speciesUrl;
  const { data, isLoading, error, retry } = usePokeApi<EvolutionNode>(
    isVisible ? speciesUrl : null,
    signal => fetchEvolutionChain(speciesUrl, signal),
    t(language, 'evolutionError')
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isVisible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisibleSpeciesUrl(speciesUrl);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisibleSpeciesUrl(speciesUrl);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [isVisible, speciesUrl]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="evolution-heading"
      aria-busy={isVisible && isLoading}
      className="border-paper-border bg-paper-card mt-5 rounded-2xl border p-5 shadow-md sm:mt-8 sm:p-6 dark:border-slate-600 dark:bg-slate-900"
    >
      <h2 id="evolution-heading" className="mb-4 text-xl font-bold">
        {t(language, 'evolutionTitle')}
      </h2>

      {!isVisible && <div aria-hidden="true" className="h-2" />}
      {isVisible && isLoading && (
        <p role="status" className="text-paper-ink text-sm dark:text-slate-200">
          {t(language, 'evolutionLoading')}
        </p>
      )}
      {isVisible && error && (
        <div role="alert" className="flex flex-wrap items-center gap-3">
          <p>{error}</p>
          <button
            type="button"
            onClick={retry}
            className="bg-pokedex hover:bg-pokedex/90 focus-visible:outline-pokedex min-h-11 rounded-lg px-4 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus-visible:outline-blue-300"
          >
            {t(language, 'retry')}
          </button>
        </div>
      )}
      {isVisible && data && (
        <>
          <EvolutionTreeView node={data} currentName={currentName} />
          {data.evolves_to.length === 0 && (
            <p className="text-paper-ink mt-3 text-sm dark:text-slate-200">
              {t(language, 'evolutionEmpty')}
            </p>
          )}
        </>
      )}
    </section>
  );
}
