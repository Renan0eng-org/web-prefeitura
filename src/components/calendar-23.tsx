"use client"

import { ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type Props = {
  onRangeChange?: (range: DateRange | undefined) => void
className?: string
}

export function Calendar23({ onRangeChange, className }: Props) {
  const [range, setRange] = React.useState<DateRange | undefined>(undefined)

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      <Label htmlFor="dates" className="px-1">
        Período
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="dates"
            className={`w-56 justify-between font-normal hover:text-white ${className}`}
          >
            {range?.from && range?.to
              ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
              : "Selecione data"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            captionLayout="dropdown"
            onSelect={(r) => {
              setRange(r)
              onRangeChange?.(r)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default Calendar23
