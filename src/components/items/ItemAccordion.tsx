'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig, type Transition } from 'motion/react';
import { ChevronDown, Clock, Star } from 'lucide-react';
import useMeasure from 'react-use-measure';
import type { Item, TodoMetadata } from '@/types/item';
import { getItemTypeIcon } from './registry';
import { getDueDateUrgency } from '@/lib/due-date';
import { ItemCard } from './ItemCard';

/**
 * "Card split" accordion for the items inside a category.
 *
 * Collapsed rows read as one joined, rounded block. Opening a row splits it
 * away from its neighbours: it gets fully rounded corners and breathing room,
 * and the rows directly above and below round off the edges that now face it.
 * One row is open at a time.
 *
 * The corner/border logic is adapted from Watermelon UI's Card Split
 * Accordion (MIT, github.com/WatermelonCorp/watermellon-registry), restyled
 * for this app's glass look. Differences from the original:
 *   - rows hold real items, and the body only mounts while open, so a closed
 *     row never loads a map iframe and a playing video stops when you close it
 *   - thin dividers between collapsed rows
 *   - respects the OS "reduce motion" setting
 */

const RADIUS = 16;
const BORDER = '1px';
const RIM = 'rgba(255, 255, 255, 0.9)'; // bright glass edge
const DIVIDER = 'rgba(31, 41, 55, 0.09)'; // hairline between collapsed rows

const spring: Transition = { type: 'spring', stiffness: 600, damping: 50, mass: 1 };

export function ItemAccordion({ items }: { items: Item[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openIndex = items.findIndex((item) => item.id === openId);

  return (
    <MotionConfig transition={spring} reducedMotion="user">
      <ul>
        {items.map((item, index) => (
          <AccordionRow
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            openIndex={openIndex}
            onToggle={() => setOpenId(item.id === openId ? null : item.id)}
          />
        ))}
      </ul>
    </MotionConfig>
  );
}

function AccordionRow({
  item,
  index,
  total,
  openIndex,
  onToggle
}: {
  item: Item;
  index: number;
  total: number;
  openIndex: number;
  onToggle: () => void;
}) {
  const [ref, bounds] = useMeasure();
  const rowRef = useRef<HTMLDivElement>(null);
  const Icon = getItemTypeIcon(item.type);
  const isOpen = index === openIndex;

  // After the row has finished expanding, scroll it into view if the card
  // (or page) cut it off. Does nothing when it is already fully visible.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      rowRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }, 350);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Body mounts when opened and unmounts once the close animation finishes.
  const [mounted, setMounted] = useState(false);
  if (isOpen && !mounted) setMounted(true);

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isBeforeOpen = index === openIndex - 1;
  const isAfterOpen = index === openIndex + 1;
  // A neighbour of the open row that is also the end of the list is rounded on both sides.
  const isAlone = (isAfterOpen && isLast) || (isBeforeOpen && isFirst);

  const topIsRim = isFirst || isAfterOpen || isOpen;
  const borderTopWidth = topIsRim || index > 0 ? BORDER : '0px';
  const borderBottomWidth = isLast || isBeforeOpen || isOpen ? BORDER : '0px';

  let topRadius = 0;
  let bottomRadius = 0;
  if (isOpen || isAlone) {
    topRadius = RADIUS;
    bottomRadius = RADIUS;
  } else if (isBeforeOpen) {
    bottomRadius = RADIUS;
  } else if (isAfterOpen) {
    topRadius = RADIUS;
  } else {
    if (isFirst) topRadius = RADIUS;
    if (isLast) bottomRadius = RADIUS;
  }

  // Small at-a-glance status so a collapsed row still tells you something.
  const todo = item.type === 'todo' ? (item.metadata as TodoMetadata) : null;
  const checklist = todo?.checklist ?? [];
  const doneCount = checklist.filter((l) => l.done).length;
  const overdue = todo?.dueDate ? getDueDateUrgency(todo.dueDate) === 'overdue' : false;

  return (
    <motion.li layout>
      <motion.div
        ref={rowRef}
        data-accordion-row
        animate={{
          borderTopLeftRadius: topRadius,
          borderTopRightRadius: topRadius,
          borderBottomLeftRadius: bottomRadius,
          borderBottomRightRadius: bottomRadius
        }}
        className={`overflow-hidden transition-shadow will-change-transform ${
          isOpen ? 'shadow-[0_10px_24px_-10px_rgba(31,41,55,0.28)]' : ''
        }`}
        style={{
          borderStyle: 'solid',
          borderColor: RIM,
          borderTopColor: topIsRim ? RIM : DIVIDER,
          borderLeftWidth: BORDER,
          borderRightWidth: BORDER,
          borderTopWidth,
          borderBottomWidth,
          marginBlock: isOpen ? '10px' : '0px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.84), rgba(255,255,255,0.54))'
        }}
      >
        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex min-h-[48px] w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        >
          <span className="flex min-w-0 items-center gap-3">
            <Icon size={18} className="shrink-0 text-teal" />
            <span className="truncate font-display text-sm font-semibold text-ink">{item.title}</span>
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {overdue && <Clock size={14} className="text-coral" aria-label="Overdue" />}
            {checklist.length > 0 && (
              <span className="text-xs tabular-nums text-muted">
                {doneCount}/{checklist.length}
              </span>
            )}
            {item.isFavorite && <Star size={14} className="fill-coral text-coral" aria-label="Favorite" />}
            <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="flex">
              <ChevronDown size={18} className="text-muted" />
            </motion.span>
          </span>
        </button>

        <motion.div
          initial={false}
          animate={{ height: isOpen ? bounds.height : 0, opacity: isOpen ? 1 : 0 }}
          onAnimationComplete={() => {
            if (!isOpen) setMounted(false);
          }}
          // inert: keep closed content out of the tab order and away from screen readers
          inert={!isOpen}
          className="overflow-hidden will-change-transform"
        >
          <div ref={ref}>
            {mounted && (
              <div className="px-4 pb-4">
                <ItemCard item={item} bare />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.li>
  );
}
