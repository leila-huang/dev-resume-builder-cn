import { RefObject, useEffect, useState } from 'react';
import { calcPageHeightPx } from '../utils/pdf';

const toPx = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export const usePagination = (
  containerRef: RefObject<HTMLElement>,
  dependencies: unknown[] = []
) => {
  const [breakIndices, setBreakIndices] = useState<Set<number>>(new Set());
  const [fallbackPageHeight] = useState<number>(calcPageHeightPx());
  const [pageHeight, setPageHeight] = useState<number>(fallbackPageHeight);

  useEffect(() => {
    const computeBreaks = () => {
      const container = containerRef.current;
      if (!container) return;

      // Compute usable content height based on rendered .page size and padding
      const firstPage = container.querySelector<HTMLElement>('.page');
      let nextPageHeight = fallbackPageHeight;
      if (firstPage) {
        const pageRect = firstPage.getBoundingClientRect();
        const style = window.getComputedStyle(firstPage);
        const paddingTop = toPx(style.paddingTop);
        const paddingBottom = toPx(style.paddingBottom);
        const usable = pageRect.height - paddingTop - paddingBottom;
        if (Number.isFinite(usable) && usable > 0) nextPageHeight = usable;
      }
      setPageHeight(nextPageHeight);

      const blocks = Array.from(container.querySelectorAll<HTMLElement>('[data-block]'));
      const nextBreaks = new Set<number>();
      let accumulated = 0;

      blocks.forEach((block, index) => {
        // Use real rendered height and include margins to avoid overflow/clipping.
        const rect = block.getBoundingClientRect();
        const style = window.getComputedStyle(block);
        const height = rect.height + toPx(style.marginTop) + toPx(style.marginBottom);
        if (accumulated + height > nextPageHeight) {
          nextBreaks.add(index);
          accumulated = height;
        } else {
          accumulated += height;
        }
      });
      setBreakIndices(nextBreaks);
    };

    computeBreaks();
    const resizeObserver = new ResizeObserver(() => computeBreaks());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { breakIndices, pageHeight };
};
