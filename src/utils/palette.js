import {
  Square, Type, Heading, TextCursorInput, Image, LayoutPanelLeft,
  Tag, Minus, Rows2, Columns2, Columns3, Columns4, StretchHorizontal,
  PanelTop, Sparkles, ListChecks, MessageSquare, Circle, CheckSquare, AlertTriangle, LoaderCircle, MessageCircleMore, ToggleLeft
} from 'lucide-react';

export const LAYOUT_PALETTE = [
  { type: 'row-1', label: '1 Column',  icon: Rows2,              cols: 1 },
  { type: 'row-2', label: '2 Columns', icon: Columns2,           cols: 2 },
  { type: 'row-3', label: '3 Columns', icon: Columns3,           cols: 3 },
  { type: 'row-4', label: '4 Columns', icon: Columns4,           cols: 4 },
  { type: 'row-5', label: '5 Columns', icon: StretchHorizontal,  cols: 5 },
  { type: 'row-6', label: '6 Columns', icon: StretchHorizontal,  cols: 6 },
];

export const ELEMENT_PALETTE = [
  { type: 'button',  label: 'Button',  icon: Square },
  { type: 'text',    label: 'Text',    icon: Type },
  { type: "radio",  label: "Radio Button", icon: Circle },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: 'heading', label: 'Heading', icon: Heading },
  { type: 'input',   label: 'Label',   icon: TextCursorInput },
  { type: 'image',   label: 'Image',   icon: Image },
  { type: 'card',    label: 'Card',    icon: LayoutPanelLeft },
  { type: 'badge',   label: 'Badge',   icon: Tag },
  { type: "alert", label: "Alert", icon: AlertTriangle},
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'modal',   label: 'Modal',   icon: MessageSquare },
  { type: 'popover', label: 'Popover', icon: MessageCircleMore },
  { type: "loader", label: "Loader",  icon: LoaderCircle },
  { type: "toggle", label: "Toggle",  icon: ToggleLeft },
];

export const BLOCK_PALETTE = [
  { type: 'navbar',    label: 'Navbar',     icon: PanelTop },
  { type: 'hero',      label: 'Hero',       icon: Sparkles },
  { type: 'formgroup', label: 'Form group', icon: ListChecks },
];

export const DRAG_TYPES = {
  LAYOUT: 'LAYOUT',
  ELEMENT: 'ELEMENT',
  CANVAS_ELEMENT: 'CANVAS_ELEMENT',
};
