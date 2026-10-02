import Link from "next/link";
import { cn } from "@/lib/cn";
import { buildPageHref, buildPaginationItems } from "@/lib/pagination";

type PaginationProps = {
  pathname: string;
  searchParams: URLSearchParams;
  currentPage: number;
  totalPages: number;
};

const itemClassName =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600";
const linkClassName =
  "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";
const disabledClassName = "border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600";

/** Page links that keep the rest of the query string. Renders nothing when there is a single page. */
export function Pagination({ pathname, searchParams, currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => buildPageHref(pathname, searchParams, page);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav aria-label="Paginación" className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {hasPrevious ? (
            // Beyond the last page, going back lands on the last page that exists.
            <Link href={hrefFor(Math.min(currentPage - 1, totalPages))} rel="prev" className={cn(itemClassName, linkClassName)}>
              Anterior
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(itemClassName, disabledClassName)}>
              Anterior
            </span>
          )}
        </li>
        {buildPaginationItems(currentPage, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-zinc-500">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefFor(item)}
                aria-label={`Página ${item}`}
                aria-current={item === currentPage ? "page" : undefined}
                className={cn(
                  itemClassName,
                  item === currentPage ? "border-sky-700 bg-sky-700 text-white" : linkClassName,
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        <li>
          {hasNext ? (
            <Link href={hrefFor(currentPage + 1)} rel="next" className={cn(itemClassName, linkClassName)}>
              Siguiente
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(itemClassName, disabledClassName)}>
              Siguiente
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
