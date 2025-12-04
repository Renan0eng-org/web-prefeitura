"use client"

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import React from 'react'

type Props = {
    columns: Record<string, boolean>
    onChange: (cols: Record<string, boolean>) => void
    labels?: Record<string, string>
    buttonLabel?: React.ReactNode
    contentClassName?: string
}

export default function ColumnsDropdown({ columns, onChange, labels = {}, buttonLabel = 'Colunas', contentClassName }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">{buttonLabel}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={contentClassName ?? 'p-2'}>
                {Object.entries(columns).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between px-2 py-1 space-x-4">
                        <span className="capitalize">{labels[key] ?? key}</span>
                        <Switch checked={Boolean(value)} onCheckedChange={() => onChange({ ...columns, [key]: !columns[key] })} />
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
