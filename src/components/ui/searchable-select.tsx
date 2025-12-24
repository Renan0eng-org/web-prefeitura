import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import * as React from "react"

export interface SearchableSelectItem {
  value: string
  label: string
}

interface SearchableSelectProps {
  items: SearchableSelectItem[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
}

export function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder = "Selecionar...",
  searchPlaceholder = "Buscar...",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredItems = items.filter((item) =>
    // compara ignorando maiúsculas, minúsculas, espaços em branco, acentuados, etc.
    item.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  )

  const selectedItem = items.find((item) => item.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input-border bg-input-background px-3 py-2 text-sm ring-offset-background placeholder:text-text-foreground/50 outline-none outline-0 disabled:cursor-not-allowed",
            className
          )}
        >
          <span className="text-sm">
            {selectedItem?.label || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b border-input-border">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border border-input"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto px-1 space-y-1 scrollable">
          {filteredItems.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              Nenhum item encontrado
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.value}
                onClick={(e) => {
                  e.preventDefault()
                  onValueChange(item.value)
                  setOpen(false)
                  setSearch("")
                }}
                className={cn(
                  "w-full rounded-sm text-left px-2 py-1.5 text-sm outline-none cursor-pointer flex items-center justify-between",
                  "hover:bg-primary/10",
                  value === item.value && "bg-primary/10 text-accent-foreground"
                )}
              >
                {item.label}
                {value === item.value && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
