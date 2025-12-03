"use client"

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizes?: number[]
  selectedCount?: number
}

export default function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizes = [5, 10, 20, 30, 40, 50],
  selectedCount = 0,
}: PaginationProps) {
  const goFirst = () => onPageChange(1)
  const goPrev = () => onPageChange(Math.max(1, page - 1))
  const goNext = () => onPageChange(Math.min(totalPages, page + 1))
  const goLast = () => onPageChange(totalPages)

  return (
    <div className="flex items-center justify-between px-4 bg-muted rounded-b-md py-2">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {selectedCount} of {total} row(s) selected.
      </div>

      <div className="flex w-full items-center gap-8 lg:w-fit bg-muted">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger className="w-20" id="rows-per-page">
              <SelectValue placeholder={`${pageSize}`} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((ps) => (
                <SelectItem key={ps} value={`${ps}`}>
                  {ps}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {page} of {totalPages}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={goFirst}
            disabled={page === 1}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>

          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={goPrev}
            disabled={page === 1}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>

          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={goNext}
            disabled={page === totalPages}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>

          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={goLast}
            disabled={page === totalPages}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
