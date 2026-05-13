export type DesignSystemComponentId =
  | 'avatar'
  | 'badge'
  | 'button'
  | 'checkbox'
  | 'datepicker'
  | 'table'

/** Token or spec row scoped to a component *type* (Figma-style). */
export interface CatalogDesignToken {
  name: string
  value: string
  /** Design-system token path when applicable. */
  tokenRef?: string
}

export interface CatalogVariant {
  id: string
  label: string
  /** Variation-level props shown in the inspector. */
  props: { name: string; value: string }[]
}

/** Types of component → variations + shared tokens for that type. */
export interface CatalogComponentType {
  id: string
  label: string
  summary?: string
  tokens: CatalogDesignToken[]
  variants: CatalogVariant[]
}

export interface CatalogDemoDimensionOption {
  value: string
  label: string
}

/** Single control axis in the inspector Demo deck. */
export interface CatalogDemoDimension {
  id: string
  label: string
  options: CatalogDemoDimensionOption[]
}

export interface CatalogDemoSchema {
  dimensions: CatalogDemoDimension[]
  defaultValues: Record<string, string>
}

export interface CatalogComponent {
  id: DesignSystemComponentId
  name: string
  layer: string
  summary: string
  types: CatalogComponentType[]
  /** When set, Demo uses these axes (Button matrix). Otherwise derived from preset dimension. */
  demoSchema?: CatalogDemoSchema
  /** Short paragraphs for the inspector “Usage and rules” tab (documentation tone). */
  usageAndRules: string[]
}

const BUTTON_DEMO_SCHEMA: CatalogDemoSchema = {
  dimensions: [
    {
      id: 'hierarchy',
      label: 'Hierarchy',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'outline', label: 'Outline' },
        { value: 'ghost', label: 'Ghost' },
        { value: 'destructive', label: 'Destructive' },
      ],
    },
    {
      id: 'size',
      label: 'Size',
      options: [
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ],
    },
    {
      id: 'state',
      label: 'State',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'disabled', label: 'Disabled' },
        { value: 'loading', label: 'Loading' },
      ],
    },
    {
      id: 'icon',
      label: 'Icon layout',
      options: [
        { value: 'none', label: 'Text only' },
        { value: 'leading', label: 'Leading icon' },
        { value: 'trailing', label: 'Trailing icon' },
        { value: 'dual', label: 'Leading + trailing' },
        { value: 'icon-only', label: 'Icon only' },
      ],
    },
  ],
  defaultValues: {
    hierarchy: 'primary',
    size: 'md',
    state: 'default',
    icon: 'leading',
  },
}

/** Merged button tokens (solid, icons, loading). */
const BUTTON_MERGED_TOKENS: CatalogDesignToken[] = [
  { name: 'button/radius-md', value: '8px', tokenRef: 'radius/md' },
  { name: 'button/height-sm', value: '32px', tokenRef: 'size/button-sm' },
  { name: 'button/height-md', value: '40px', tokenRef: 'size/button-md' },
  { name: 'button/height-lg', value: '44px', tokenRef: 'size/button-lg' },
  { name: 'button/primary/bg', value: 'brand/600', tokenRef: 'color/button-primary-bg' },
  { name: 'button/secondary/bg', value: 'gray/100', tokenRef: 'color/button-secondary-bg' },
  { name: 'button/outline/border', value: 'gray/300', tokenRef: 'border/button-outline' },
  { name: 'button/icon/gap', value: '8px', tokenRef: 'space/button-icon-gap' },
  { name: 'button/icon/size-md', value: '20px', tokenRef: 'size/icon-md' },
  { name: 'button/icon-only/min-tap', value: '40×40', tokenRef: 'size/button-icon-only' },
  { name: 'button/loading/spinner', value: '16px', tokenRef: 'size/spinner-sm' },
  { name: 'button/loading/min-width', value: 'match default', tokenRef: 'layout/button-loading' },
]

/** Aligns with design-system Table stories + Size, Selection mode, and Table footer axes. */
const TABLE_DEMO_SCHEMA: CatalogDemoSchema = {
  dimensions: [
    {
      id: 'story',
      label: 'Component variation',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'dropdown-actions', label: 'With dropdown menu actions' },
        { value: 'sorting', label: 'With sorting' },
        { value: 'columns-selector', label: 'With columns selector' },
        { value: 'columns-always-visible', label: 'With always visible columns' },
        { value: 'columns-tabbed', label: 'With tabbed columns selector' },
        { value: 'sticky-columns', label: 'With sticky columns' },
        { value: 'empty', label: 'Empty state' },
      ],
    },
    {
      id: 'density',
      label: 'Size',
      options: [
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'compact', label: 'Compact' },
      ],
    },
    {
      id: 'selection',
      label: 'Selection mode',
      options: [
        { value: 'multiple', label: 'Multiple (checkboxes)' },
        { value: 'none', label: 'None' },
      ],
    },
    {
      id: 'footer',
      label: 'Table footer',
      options: [
        { value: 'none', label: 'None' },
        { value: 'pagination', label: 'With pagination' },
      ],
    },
  ],
  defaultValues: {
    story: 'default',
    density: 'comfortable',
    selection: 'multiple',
    footer: 'none',
  },
}

const TABLE_STORY_VALUES = TABLE_DEMO_SCHEMA.dimensions[0]!.options.map((o) => o.value)

const TABLE_TOKENS: CatalogDesignToken[] = [
  { name: 'table/surface', value: '#ffffff', tokenRef: 'color/table-surface' },
  { name: 'table/header/bg', value: 'zinc-50', tokenRef: 'color/table-header-bg' },
  { name: 'table/border', value: 'zinc-200', tokenRef: 'border/table-outer' },
  { name: 'table/header/label', value: 'zinc-900 · semibold · text-xs', tokenRef: 'typography/table-header' },
  { name: 'table/cell/text', value: 'zinc-900 · text-sm', tokenRef: 'typography/table-body' },
  { name: 'table/search/icon', value: 'SearchSm · zinc-400', tokenRef: 'icon/table-search' },
  { name: 'table/cell/comfortable', value: 'px-5 py-3', tokenRef: 'spacing/table-comfortable' },
  { name: 'table/cell/compact', value: 'px-4 py-2.5 · text-xs', tokenRef: 'spacing/table-compact' },
  { name: 'table/row/divider', value: 'border-b zinc-200', tokenRef: 'border/table-row' },
  { name: 'table/row/hover', value: 'zinc-50/90', tokenRef: 'color/table-row-hover' },
]

function normalizeTableStory(value: string): string {
  return TABLE_STORY_VALUES.includes(value) ? value : 'default'
}

export function tableAxesFromSyntheticId(variantId: string): Record<string, string> {
  const d = { ...TABLE_DEMO_SCHEMA.defaultValues }
  if (!variantId.startsWith('tbl-demo~')) return d
  const parts = variantId.split('~')
  if (parts.length === 5 && parts[0] === 'tbl-demo') {
    const [, story, density, selection, footer] = parts
    return {
      story: normalizeTableStory(story ?? 'default'),
      density: density === 'compact' ? 'compact' : 'comfortable',
      selection: selection === 'none' ? 'none' : 'multiple',
      footer: footer === 'pagination' ? 'pagination' : 'none',
    }
  }
  if (parts.length === 2 && parts[0] === 'tbl-demo') {
    return legacySingleSegmentTableAxes(parts[1] ?? '')
  }
  return d
}

/** Older `tbl-demo~tbl-*` ids from earlier catalog builds. */
function legacySingleSegmentTableAxes(segment: string): Record<string, string> {
  const d = { ...TABLE_DEMO_SCHEMA.defaultValues }
  const legacy: Record<string, Partial<Record<string, string>>> = {
    'tbl-default': { story: 'default', selection: 'multiple', footer: 'none' },
    'tbl-search-only': { story: 'default' },
    'tbl-no-toolbar': { story: 'default' },
    'tbl-empty': { story: 'empty' },
    'tbl-all-selected': { story: 'default', selection: 'multiple' },
    'tbl-none-selected': { story: 'default', selection: 'multiple' },
    'tbl-sort-asc': { story: 'sorting' },
    'tbl-sort-desc': { story: 'sorting' },
    'tbl-no-status': { story: 'default' },
    'tbl-wide': { story: 'sticky-columns' },
    'tbl-single-row': { story: 'default' },
    'tbl-mixed-status': { story: 'default' },
  }
  return { ...d, ...(legacy[segment] ?? {}) } as Record<string, string>
}

export function getComponentDemoSchema(c: CatalogComponent): CatalogDemoSchema {
  if (c.demoSchema) return c.demoSchema
  const variants = catalogAllVariants(c)
  return {
    dimensions: [
      {
        id: 'preset',
        label: 'Variation',
        options: variants.map((v) => ({ value: v.id, label: v.label })),
      },
    ],
    defaultValues: { preset: variants[0]!.id },
  }
}

export function getDefaultDemoAxes(c: CatalogComponent): Record<string, string> {
  return { ...getComponentDemoSchema(c).defaultValues }
}

function buildButtonSyntheticVariant(axes: Record<string, string>): CatalogVariant {
  const hierarchy = axes.hierarchy ?? 'primary'
  const size = axes.size ?? 'md'
  const state = axes.state ?? 'default'
  const icon = axes.icon ?? 'none'
  const hierarchyLabel =
    BUTTON_DEMO_SCHEMA.dimensions[0]!.options.find((o) => o.value === hierarchy)?.label ?? hierarchy
  const sizeLabel = BUTTON_DEMO_SCHEMA.dimensions[1]!.options.find((o) => o.value === size)?.label ?? size
  const stateLabel = BUTTON_DEMO_SCHEMA.dimensions[2]!.options.find((o) => o.value === state)?.label ?? state
  const iconLabel = BUTTON_DEMO_SCHEMA.dimensions[3]!.options.find((o) => o.value === icon)?.label ?? icon
  return {
    id: `btn-demo~${hierarchy}~${size}~${state}~${icon}`,
    label: `${hierarchyLabel} · ${sizeLabel} · ${stateLabel} · ${iconLabel}`,
    props: [
      { name: 'Hierarchy', value: hierarchy },
      { name: 'Size', value: size },
      { name: 'State', value: state },
      { name: 'Icon layout', value: icon },
    ],
  }
}

function tableVariantProps(axes: Record<string, string>): { name: string; value: string }[] {
  const story = normalizeTableStory(axes.story ?? 'default')
  const density = axes.density === 'compact' ? 'compact' : 'comfortable'
  const selection = axes.selection === 'none' ? 'none' : 'multiple'
  const footer = axes.footer === 'pagination' ? 'pagination' : 'none'
  const storyLabel =
    TABLE_DEMO_SCHEMA.dimensions[0]!.options.find((o) => o.value === story)?.label ?? story
  return [
    { name: 'Variation', value: storyLabel },
    { name: 'Size', value: density },
    { name: 'Selection mode', value: selection },
    { name: 'Table footer', value: footer },
  ]
}

function buildTableSyntheticVariant(axes: Record<string, string>): CatalogVariant {
  const story = normalizeTableStory(axes.story ?? 'default')
  const density = axes.density === 'compact' ? 'compact' : 'comfortable'
  const selection = axes.selection === 'none' ? 'none' : 'multiple'
  const footer = axes.footer === 'pagination' ? 'pagination' : 'none'
  const id = `tbl-demo~${story}~${density}~${selection}~${footer}`
  const storyLabel =
    TABLE_DEMO_SCHEMA.dimensions[0]!.options.find((o) => o.value === story)?.label ?? story
  const densityLabel =
    TABLE_DEMO_SCHEMA.dimensions[1]!.options.find((o) => o.value === density)?.label ?? density
  const selectionLabel =
    TABLE_DEMO_SCHEMA.dimensions[2]!.options.find((o) => o.value === selection)?.label ?? selection
  const footerLabel =
    TABLE_DEMO_SCHEMA.dimensions[3]!.options.find((o) => o.value === footer)?.label ?? footer
  return {
    id,
    label: `${storyLabel} · ${densityLabel} · ${selectionLabel} · ${footerLabel}`,
    props: tableVariantProps(axes),
  }
}

export function resolveDemoVariant(c: CatalogComponent, axes: Record<string, string>): CatalogVariant {
  if (c.id === 'button') return buildButtonSyntheticVariant(axes)
  if (c.id === 'table') return buildTableSyntheticVariant(axes)
  const variants = catalogAllVariants(c)
  const id = axes.preset ?? variants[0]!.id
  return variants.find((v) => v.id === id) ?? variants[0]!
}

export function catalogAllVariants(c: CatalogComponent): CatalogVariant[] {
  return c.types.flatMap((t) => t.variants)
}

export function catalogVariantCount(c: CatalogComponent): number {
  if (c.id === 'button') {
    return BUTTON_DEMO_SCHEMA.dimensions.reduce((n, d) => n * d.options.length, 1)
  }
  if (c.id === 'table') {
    return TABLE_DEMO_SCHEMA.dimensions.reduce((n, dim) => n * dim.options.length, 1)
  }
  return catalogAllVariants(c).length
}

export function catalogTypeForVariant(
  c: CatalogComponent,
  variantId: string,
): CatalogComponentType | undefined {
  if (c.id === 'button' && variantId.startsWith('btn-demo~')) {
    return c.types[0]
  }
  if (c.id === 'table' && variantId.startsWith('tbl-demo~')) {
    return c.types[0]
  }
  return c.types.find((t) => t.variants.some((v) => v.id === variantId))
}

export const DESIGN_SYSTEM_COMPONENTS: CatalogComponent[] = [
  {
    id: 'avatar',
    name: 'Avatar',
    layer: 'Atom',
    summary: 'User or entity image with sizes and fallback states for lists, headers, and messaging.',
    usageAndRules: [
      'Use avatars wherever a person or workspace needs a quick visual anchor: reservation timelines, message threads, and account settings. The photo variant should always receive meaningful alternative text or be marked decorative when the name appears beside it.',
      'Pick the size that matches the density of the surrounding list or header. Small works well in compact tables; large belongs in profile headers or empty states where the face is the focal point.',
      'When an image fails to load or is missing, fall back to initials rather than a broken image. Presence dots communicate availability in real-time contexts; keep them aligned to the bottom-right and use token colors for online versus offline.',
      'Stacked groups imply multiple participants—limit how many circles you show before summarizing with a +N label so the row stays scannable.',
    ],
    types: [
      {
        id: 'photo',
        label: 'Photo',
        summary: 'Image-backed avatar at standard sizes.',
        tokens: [
          { name: 'avatar/size-sm', value: '32px', tokenRef: 'size/avatar-sm' },
          { name: 'avatar/size-md', value: '40px', tokenRef: 'size/avatar-md' },
          { name: 'avatar/size-lg', value: '48px', tokenRef: 'size/avatar-lg' },
          { name: 'avatar/radius', value: 'full', tokenRef: 'radius/full' },
          { name: 'avatar/border', value: '1px · subtle', tokenRef: 'border/avatar' },
        ],
        variants: [
          {
            id: 'av-sm-img',
            label: 'Small · Photo',
            props: [
              { name: 'Size', value: 'sm' },
              { name: 'Src', value: 'set' },
              { name: 'Alt', value: 'Guest' },
            ],
          },
          {
            id: 'av-md-img',
            label: 'Medium · Photo',
            props: [
              { name: 'Size', value: 'md' },
              { name: 'Src', value: 'set' },
            ],
          },
          {
            id: 'av-lg-img',
            label: 'Large · Photo',
            props: [
              { name: 'Size', value: 'lg' },
              { name: 'Src', value: 'set' },
            ],
          },
        ],
      },
      {
        id: 'fallback',
        label: 'Fallback',
        summary: 'Initials when no image URL resolves.',
        tokens: [
          { name: 'avatar/fallback/bg', value: 'surface-muted', tokenRef: 'color/surface-muted' },
          { name: 'avatar/fallback/type', value: 'initials', tokenRef: 'content/avatar-fallback' },
          { name: 'avatar/fallback/typography', value: 'Label sm · Semibold', tokenRef: 'type/label-sm' },
        ],
        variants: [
          {
            id: 'av-initials',
            label: 'Fallback · Initials',
            props: [
              { name: 'Size', value: 'md' },
              { name: 'Fallback', value: 'AB' },
            ],
          },
        ],
      },
      {
        id: 'presence',
        label: 'Presence',
        summary: 'Status indicator overlaid on the avatar.',
        tokens: [
          { name: 'avatar/status/dot-size', value: '12px', tokenRef: 'size/status-dot' },
          { name: 'avatar/status/online', value: 'success/500', tokenRef: 'color/success-500' },
          { name: 'avatar/status/ring', value: '2px · surface', tokenRef: 'border/status-ring' },
        ],
        variants: [
          {
            id: 'av-status',
            label: 'With status dot',
            props: [
              { name: 'Size', value: 'md' },
              { name: 'Status', value: 'online' },
            ],
          },
        ],
      },
      {
        id: 'group',
        label: 'Stacked group',
        summary: 'Overlapping avatars for participant lists.',
        tokens: [
          { name: 'avatar/group/overlap', value: '-8px', tokenRef: 'space/avatar-overlap' },
          { name: 'avatar/group/max-visible', value: '3+', tokenRef: 'layout/avatar-stack' },
          { name: 'avatar/group/z-index', value: 'ascending', tokenRef: 'z-index/avatar-stack' },
        ],
        variants: [
          {
            id: 'av-group',
            label: 'Stacked group',
            props: [
              { name: 'Count', value: '3' },
              { name: 'Overlap', value: 'true' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'badge',
    name: 'Badge',
    layer: 'Atom',
    summary: 'Compact status and count labels with semantic color treatments.',
    usageAndRules: [
      'Badges summarize state at a glance. Reserve strong semantic colors (connected, disconnected, pending) for sync and channel health so operators learn a consistent vocabulary across screens.',
      'Keep labels short—usually a single word or two. If you need a full sentence, consider a tooltip or inline helper text instead of stretching the pill.',
      'Do not rely on color alone: pair hue with clear wording. Neutral badges work for counts and filters where no urgency is implied.',
      'In dense tables, default to the medium size and align badges to the start of the cell so they scan vertically with other status columns.',
    ],
    types: [
      {
        id: 'semantic',
        label: 'Semantic status',
        summary: 'Channel and sync states with fixed color ramps.',
        tokens: [
          { name: 'badge/radius', value: 'full', tokenRef: 'radius/pill' },
          { name: 'badge/padding-x', value: '8px', tokenRef: 'space/badge-x' },
          { name: 'badge/typography', value: 'Caption · Medium', tokenRef: 'type/caption-md' },
          { name: 'badge/connected', value: 'success/surface', tokenRef: 'color/badge-connected' },
          { name: 'badge/pending', value: 'warning/surface', tokenRef: 'color/badge-pending' },
          { name: 'badge/importing', value: 'info/surface', tokenRef: 'color/badge-importing' },
          { name: 'badge/disconnected', value: 'error/surface', tokenRef: 'color/badge-disconnected' },
          { name: 'badge/neutral', value: 'gray/surface', tokenRef: 'color/badge-neutral' },
        ],
        variants: [
          {
            id: 'bd-connected',
            label: 'Connected',
            props: [
              { name: 'Variant', value: 'connected' },
              { name: 'Size', value: 'md' },
            ],
          },
          {
            id: 'bd-pending',
            label: 'Pending',
            props: [
              { name: 'Variant', value: 'pending' },
              { name: 'Size', value: 'md' },
            ],
          },
          {
            id: 'bd-importing',
            label: 'Importing',
            props: [
              { name: 'Variant', value: 'importing' },
              { name: 'Size', value: 'md' },
            ],
          },
          {
            id: 'bd-disconnected',
            label: 'Disconnected',
            props: [
              { name: 'Variant', value: 'disconnected' },
              { name: 'Size', value: 'md' },
            ],
          },
          {
            id: 'bd-default',
            label: 'Neutral',
            props: [
              { name: 'Variant', value: 'default' },
              { name: 'Size', value: 'md' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'button',
    name: 'Button',
    layer: 'Atom',
    summary: 'Primary actions and triggers; hierarchy, size, state, and icon layouts.',
    demoSchema: BUTTON_DEMO_SCHEMA,
    usageAndRules: [
      'One primary action per view or card. Primary buttons answer the question “what should I do next?” Secondary and outline actions support reversible choices; ghost buttons suit tertiary navigation.',
      'Match size to context: default height for forms and dialogs, small for toolbars, large for marketing-style hero blocks. Loading states should preserve width so the layout does not jump when a request starts.',
      'Icon-only buttons need an accessible name. Pair leading icons with verbs that describe the outcome (“Add reservation”), and use trailing icons for “continue” or forward motion.',
      'Destructive actions should use explicit copy (“Remove”, “Delete channel”) and appear after calmer options when possible. Disabled buttons must explain why elsewhere—helper text, tooltip, or inline validation.',
    ],
    types: [
      {
        id: 'button-all',
        label: 'Button',
        summary: 'All hierarchies share spacing, radius, and motion tokens; icon and loading specs layer on top.',
        tokens: BUTTON_MERGED_TOKENS,
        variants: [],
      },
    ],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    layer: 'Atom',
    summary: 'Selectable options in forms, tables, and filter panels.',
    usageAndRules: [
      'Checkboxes represent independent on/off choices. When options are mutually exclusive, use radio inputs instead so screen readers announce the correct pattern.',
      'Always provide a visible label; clicking the label should toggle the control. In tables, keep a column header that states what selection means (“Include in export”).',
      'Indeterminate state is for “some but not all children selected” in parent rows. Return to checked or unchecked once the user makes an explicit choice.',
      'Disabled checkboxes should appear together with a short explanation—either inline or in a summary—so users understand what would unlock the field.',
    ],
    types: [
      {
        id: 'states',
        label: 'States',
        summary: 'Checked, unchecked, indeterminate, and disabled.',
        tokens: [
          { name: 'checkbox/size', value: '16px', tokenRef: 'size/checkbox' },
          { name: 'checkbox/radius', value: '4px', tokenRef: 'radius/sm' },
          { name: 'checkbox/border-default', value: 'gray/300', tokenRef: 'border/checkbox' },
          { name: 'checkbox/fill-checked', value: 'brand/600', tokenRef: 'color/checkbox-checked' },
          { name: 'checkbox/disabled-opacity', value: '0.5', tokenRef: 'opacity/disabled' },
        ],
        variants: [
          {
            id: 'cb-off',
            label: 'Unchecked',
            props: [
              { name: 'Checked', value: 'false' },
              { name: 'Disabled', value: 'false' },
            ],
          },
          {
            id: 'cb-on',
            label: 'Checked',
            props: [
              { name: 'Checked', value: 'true' },
              { name: 'Disabled', value: 'false' },
            ],
          },
          {
            id: 'cb-ind',
            label: 'Indeterminate',
            props: [
              { name: 'Indeterminate', value: 'true' },
              { name: 'Disabled', value: 'false' },
            ],
          },
          {
            id: 'cb-disabled-off',
            label: 'Disabled · unchecked',
            props: [
              { name: 'Checked', value: 'false' },
              { name: 'Disabled', value: 'true' },
            ],
          },
          {
            id: 'cb-disabled-on',
            label: 'Disabled · checked',
            props: [
              { name: 'Checked', value: 'true' },
              { name: 'Disabled', value: 'true' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'datepicker',
    name: 'DatePicker',
    layer: 'Atom',
    summary: 'Single date, range, and calendar-style inputs for booking flows.',
    usageAndRules: [
      'Date controls anchor booking workflows. Prefer the single-date field when only one moment matters; switch to an explicit range when pricing or availability depends on both endpoints.',
      'Always show the expected format near the field on first use, or rely on a placeholder that matches regional settings. Validate ranges so checkout cannot precede check-in.',
      'Month pickers suit reporting filters; pair them with a clear reset so users can return to “all months” without hunting for an empty state.',
      'When a calendar is unavailable (read-only summaries), show the formatted string in body text instead of a disabled picker, which can feel like broken functionality.',
    ],
    types: [
      {
        id: 'modes',
        label: 'Modes',
        summary: 'Single, range, and month selection with shared field chrome.',
        tokens: [
          { name: 'datepicker/field-height', value: '40px', tokenRef: 'size/input-md' },
          { name: 'datepicker/field-radius', value: '8px', tokenRef: 'radius/md' },
          { name: 'datepicker/popover/shadow', value: 'lg', tokenRef: 'elevation/popover' },
          { name: 'datepicker/calendar/cell', value: '36px', tokenRef: 'size/calendar-cell' },
        ],
        variants: [
          {
            id: 'dp-single',
            label: 'Single date',
            props: [
              { name: 'Type', value: 'date' },
              { name: 'Format', value: 'native' },
            ],
          },
          {
            id: 'dp-range',
            label: 'Date range',
            props: [
              { name: 'Type', value: 'range' },
              { name: 'Fields', value: '2' },
            ],
          },
          {
            id: 'dp-month',
            label: 'Month picker',
            props: [
              { name: 'Type', value: 'month' },
              { name: 'Format', value: 'native' },
            ],
          },
          {
            id: 'dp-disabled',
            label: 'Disabled',
            props: [{ name: 'Disabled', value: 'true' }],
          },
        ],
      },
    ],
  },
  {
    id: 'table',
    name: 'Table',
    layer: 'Molecule',
    summary:
      'Operational data grid matching design-system stories: toolbar, sorting, row actions, column visibility, sticky columns, size, selection, and footer.',
    demoSchema: TABLE_DEMO_SCHEMA,
    usageAndRules: [
      'Table cells use a white surface so sticky columns match the rest of the grid (avoid tinting them with the page background token). Headers use the channel accent surface (#f6f9fc). Turn on sticky columns only when horizontal scroll is expected.',
      'Size: Comfortable is the default for primary workspaces; Compact increases density for nested panels or modal lists. Selection mode “None” removes the checkbox column for read-only reporting tables.',
      'Table footer is optional: use it for pagination, row counts, or bulk-action hints. Keep footer actions aligned with pagination controls in the design system.',
      'Column selector patterns: simple checklist, always-visible (locked) identifiers, or tabbed groups when many optional attributes exist. Row actions belong in a trailing column with an accessible menu button.',
      'Empty states need a short explanation and a recovery path (clear filters, connect a channel). Match copy to the filters and search the user applied.',
    ],
    types: [
      {
        id: 'data-table',
        label: 'DataTable',
        summary: 'Primitives from @/components/ui/DataTable — compose columns, status mapping, and selection for each route.',
        tokens: TABLE_TOKENS,
        variants: [],
      },
    ],
  },
]

export function getCatalogComponent(id: DesignSystemComponentId): CatalogComponent | undefined {
  return DESIGN_SYSTEM_COMPONENTS.find((c) => c.id === id)
}
