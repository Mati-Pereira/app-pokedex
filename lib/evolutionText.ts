import type { Language } from './i18n';
import { localizedType, t } from './i18n';
import type { EvolutionDetails } from '../types/evolution';

const readableName = (value: string) => value.replaceAll('-', ' ');

function getEvolutionDetailLabels(detail: EvolutionDetails, language: Language): string[] {
  const labels: string[] = [];
  const trigger = detail.trigger.name;

  if (detail.min_level !== null) {
    labels.push(t(language, 'evolutionLevel', { level: detail.min_level }));
  }
  if (trigger === 'level-up' && detail.min_level === null) {
    labels.push(t(language, 'evolutionLevelUp'));
  } else if (trigger === 'trade') {
    labels.push(t(language, 'evolutionTrade'));
  } else if (trigger === 'use-item') {
    labels.push(
      detail.item
        ? t(language, 'evolutionUseItem', { item: readableName(detail.item.name) })
        : t(language, 'evolutionUseItemUnknown')
    );
  } else if (trigger === 'shed') {
    labels.push(t(language, 'evolutionShed'));
  } else if (!['level-up', 'trade', 'use-item'].includes(trigger)) {
    labels.push(t(language, 'evolutionMethod', { method: readableName(trigger) }));
  }

  if (detail.item && trigger !== 'use-item') {
    labels.push(t(language, 'evolutionUseItem', { item: readableName(detail.item.name) }));
  }
  if (detail.held_item) {
    labels.push(t(language, 'evolutionHolding', { item: readableName(detail.held_item.name) }));
  }
  if (detail.gender === 1) labels.push(t(language, 'evolutionFemale'));
  if (detail.gender === 2) labels.push(t(language, 'evolutionMale'));
  if (detail.known_move) {
    labels.push(t(language, 'evolutionKnows', { move: readableName(detail.known_move.name) }));
  }
  if (detail.known_move_type) {
    labels.push(
      t(language, 'evolutionKnowsType', {
        type: localizedType(language, detail.known_move_type.name),
      })
    );
  }
  if (detail.location) {
    labels.push(t(language, 'evolutionLocation', { location: readableName(detail.location.name) }));
  }
  if (detail.min_happiness !== null) {
    labels.push(t(language, 'evolutionHappiness', { value: detail.min_happiness }));
  }
  if (detail.min_beauty !== null) {
    labels.push(t(language, 'evolutionBeauty', { value: detail.min_beauty }));
  }
  if (detail.min_affection !== null) {
    labels.push(t(language, 'evolutionAffection', { value: detail.min_affection }));
  }
  if (detail.time_of_day) {
    const time =
      detail.time_of_day === 'day'
        ? t(language, 'evolutionDay')
        : detail.time_of_day === 'night'
          ? t(language, 'evolutionNight')
          : detail.time_of_day === 'dusk'
            ? t(language, 'evolutionTwilight')
            : readableName(detail.time_of_day);
    labels.push(t(language, 'evolutionAtTime', { time }));
  }
  if (detail.needs_overworld_rain) labels.push(t(language, 'evolutionRain'));
  if (detail.party_species) {
    labels.push(
      t(language, 'evolutionWithSpecies', { name: readableName(detail.party_species.name) })
    );
  }
  if (detail.party_type) {
    labels.push(
      t(language, 'evolutionWithType', {
        type: localizedType(language, detail.party_type.name),
      })
    );
  }
  if (detail.trade_species) {
    labels.push(
      t(language, 'evolutionTradeFor', { name: readableName(detail.trade_species.name) })
    );
  }
  if (detail.relative_physical_stats === 1) labels.push(t(language, 'evolutionAttackHigher'));
  if (detail.relative_physical_stats === 0) labels.push(t(language, 'evolutionEqualStats'));
  if (detail.relative_physical_stats === -1) labels.push(t(language, 'evolutionDefenseHigher'));
  if (detail.turn_upside_down) labels.push(t(language, 'evolutionUpsideDown'));

  return labels.length > 0 ? labels : [t(language, 'evolutionConditionUnknown')];
}

export function getEvolutionConditionGroups(
  details: EvolutionDetails[],
  language: Language
): string[][] {
  if (details.length === 0) return [[t(language, 'evolutionConditionUnknown')]];
  return details.map(detail => getEvolutionDetailLabels(detail, language));
}

export function getEvolutionConditionLabels(
  details: EvolutionDetails[],
  language: Language
): string[] {
  return getEvolutionConditionGroups(details, language).map(group => group.join(' · '));
}
