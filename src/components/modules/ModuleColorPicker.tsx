'use client'

import { PRESET_COLORS } from '@/lib/types/module'

interface ModuleColorPickerProps {
  value: string
  onChange: (color: string) => void
  name?: string
}

export function ModuleColorPicker({
  value,
  onChange,
  name = 'color',
}: ModuleColorPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
        Color
      </label>
      <div className="grid grid-cols-5 gap-2">
        {PRESET_COLORS.map(({ name: colorName, value: colorValue }) => (
          <button
            key={colorValue}
            type="button"
            onClick={() => onChange(colorValue)}
            className={`
              w-10 h-10 rounded-lg border-2 transition-all
              ${value === colorValue
                ? 'border-zinc-900 ring-2 ring-zinc-900 ring-offset-2 dark:border-zinc-100 dark:ring-zinc-100'
                : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500'
              }
            `}
            style={{ backgroundColor: colorValue }}
            title={colorName}
            aria-label={`Select ${colorName}`}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
