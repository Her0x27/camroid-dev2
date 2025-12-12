import { z } from "zod";

export type ReticleShape = 
  | 'crosshair'
  | 'circle'
  | 'square'
  | 'arrow'
  | 'speech-bubble'
  | 'custom';

export type ReticlePositionType = 
  | 'center'
  | 'free';

export type WatermarkObjectType = 
  | 'text'
  | 'logo'
  | 'coordinates'
  | 'accuracy'
  | 'heading'
  | 'tilt'
  | 'timestamp'
  | 'separator-h'
  | 'separator-v'
  | 'reticle';

export interface WatermarkObjectPosition {
  x: number;
  y: number;
}

export interface WatermarkObjectSize {
  width: number;
  height: number;
}

export interface WatermarkObjectStyle {
  opacity: number;
  color: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  strokeWidth?: number;
  strokeColor?: string;
  borderRadius?: number;
}

export interface WatermarkObject {
  id: string;
  type: WatermarkObjectType;
  name: string;
  position: WatermarkObjectPosition;
  size: WatermarkObjectSize;
  style: WatermarkObjectStyle;
  rotation: number;
  locked: boolean;
  visible: boolean;
  groupId?: string;
  content?: string;
  reticleShape?: ReticleShape;
  reticlePositionType?: ReticlePositionType;
  customIconUrl?: string;
}

export interface WatermarkLayer {
  id: string;
  name: string;
  objects: WatermarkObject[];
  visible: boolean;
  locked: boolean;
  collapsed: boolean;
}

export interface WatermarkGroup {
  id: string;
  name: string;
  objectIds: string[];
}

export interface WatermarkEditorState {
  layers: WatermarkLayer[];
  groups: WatermarkGroup[];
  selectedObjectIds: string[];
  selectedLayerId: string | null;
  activeToolId: string | null;
  zoom: number;
  panOffset: WatermarkObjectPosition;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export const watermarkObjectSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'logo', 'coordinates', 'accuracy', 'heading', 'tilt', 'timestamp', 'separator-h', 'separator-v', 'reticle']),
  name: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
  style: z.object({
    opacity: z.number().min(0).max(100),
    color: z.string(),
    backgroundColor: z.string().optional(),
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.enum(['normal', 'bold']).optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
    strokeWidth: z.number().optional(),
    strokeColor: z.string().optional(),
    borderRadius: z.number().optional(),
  }),
  rotation: z.number(),
  locked: z.boolean(),
  visible: z.boolean(),
  groupId: z.string().optional(),
  content: z.string().optional(),
  reticleShape: z.enum(['crosshair', 'circle', 'square', 'arrow', 'speech-bubble', 'custom']).optional(),
  reticlePositionType: z.enum(['center', 'free']).optional(),
  customIconUrl: z.string().optional(),
});

export const watermarkLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  objects: z.array(watermarkObjectSchema),
  visible: z.boolean(),
  locked: z.boolean(),
  collapsed: z.boolean(),
});

export const watermarkEditorStateSchema = z.object({
  layers: z.array(watermarkLayerSchema),
  groups: z.array(z.object({
    id: z.string(),
    name: z.string(),
    objectIds: z.array(z.string()),
  })),
  selectedObjectIds: z.array(z.string()),
  selectedLayerId: z.string().nullable(),
  activeToolId: z.string().nullable(),
  zoom: z.number(),
  panOffset: z.object({
    x: z.number(),
    y: z.number(),
  }),
  gridEnabled: z.boolean(),
  snapToGrid: z.boolean(),
  gridSize: z.number(),
});

export type WatermarkEditorAction =
  | { type: 'ADD_OBJECT'; payload: { layerId: string; object: WatermarkObject } }
  | { type: 'UPDATE_OBJECT'; payload: { objectId: string; updates: Partial<WatermarkObject> } }
  | { type: 'DELETE_OBJECT'; payload: { objectId: string } }
  | { type: 'SELECT_OBJECTS'; payload: { objectIds: string[] } }
  | { type: 'DESELECT_ALL' }
  | { type: 'MOVE_OBJECT'; payload: { objectId: string; position: WatermarkObjectPosition } }
  | { type: 'RESIZE_OBJECT'; payload: { objectId: string; size: WatermarkObjectSize } }
  | { type: 'ROTATE_OBJECT'; payload: { objectId: string; rotation: number } }
  | { type: 'GROUP_OBJECTS'; payload: { objectIds: string[]; groupName: string } }
  | { type: 'UNGROUP_OBJECTS'; payload: { groupId: string } }
  | { type: 'ADD_LAYER'; payload: { layer: WatermarkLayer } }
  | { type: 'DELETE_LAYER'; payload: { layerId: string } }
  | { type: 'UPDATE_LAYER'; payload: { layerId: string; updates: Partial<WatermarkLayer> } }
  | { type: 'SELECT_LAYER'; payload: { layerId: string } }
  | { type: 'REORDER_LAYERS'; payload: { layerIds: string[] } }
  | { type: 'SET_ACTIVE_TOOL'; payload: { toolId: string | null } }
  | { type: 'SET_ZOOM'; payload: { zoom: number } }
  | { type: 'SET_PAN_OFFSET'; payload: { offset: WatermarkObjectPosition } }
  | { type: 'TOGGLE_GRID'; payload: { enabled: boolean } }
  | { type: 'TOGGLE_SNAP_TO_GRID'; payload: { enabled: boolean } }
  | { type: 'SET_GRID_SIZE'; payload: { size: number } }
  | { type: 'LOAD_STATE'; payload: { state: WatermarkEditorState } }
  | { type: 'RESET_STATE' };

export interface ToolbarItem {
  id: string;
  type: WatermarkObjectType | 'select' | 'pan' | 'zoom';
  name: string;
  icon: string;
  shortcut?: string;
}

export const RETICLE_SHAPES: { value: ReticleShape; label: string; icon: string }[] = [
  { value: 'crosshair', label: 'Перекрестие', icon: 'Crosshair' },
  { value: 'circle', label: 'Кружок', icon: 'Circle' },
  { value: 'square', label: 'Квадрат', icon: 'Square' },
  { value: 'arrow', label: 'Стрелка', icon: 'ArrowUp' },
  { value: 'speech-bubble', label: 'Облако диалога', icon: 'MessageCircle' },
  { value: 'custom', label: 'Свой указатель', icon: 'Shapes' },
];

export const OBJECT_TYPE_NAMES: Record<WatermarkObjectType, string> = {
  'text': 'Текст',
  'logo': 'Логотип',
  'coordinates': 'Координаты',
  'accuracy': 'Погрешность',
  'heading': 'Азимут',
  'tilt': 'Наклон',
  'timestamp': 'Время',
  'separator-h': 'Разделитель Г',
  'separator-v': 'Разделитель В',
  'reticle': 'Прицел',
};

export function createDefaultObject(type: WatermarkObjectType): Omit<WatermarkObject, 'id'> {
  const baseObject = {
    type,
    name: OBJECT_TYPE_NAMES[type],
    position: { x: 50, y: 50 },
    size: { width: 100, height: 30 },
    style: {
      opacity: 100,
      color: '#22c55e',
      fontSize: 14,
      fontFamily: 'monospace',
      fontWeight: 'normal' as const,
      textAlign: 'left' as const,
    },
    rotation: 0,
    locked: false,
    visible: true,
  };

  switch (type) {
    case 'reticle':
      return {
        ...baseObject,
        size: { width: 80, height: 80 },
        reticleShape: 'crosshair',
        reticlePositionType: 'center',
        style: {
          ...baseObject.style,
          strokeWidth: 2,
        },
      };
    case 'separator-h':
      return {
        ...baseObject,
        size: { width: 200, height: 2 },
        style: {
          ...baseObject.style,
          strokeWidth: 2,
        },
      };
    case 'separator-v':
      return {
        ...baseObject,
        size: { width: 2, height: 100 },
        style: {
          ...baseObject.style,
          strokeWidth: 2,
        },
      };
    case 'logo':
      return {
        ...baseObject,
        size: { width: 60, height: 60 },
      };
    case 'text':
      return {
        ...baseObject,
        content: 'Текст',
        size: { width: 100, height: 24 },
      };
    case 'coordinates':
      return {
        ...baseObject,
        content: '00.0000°N 00.0000°E',
        size: { width: 180, height: 24 },
      };
    case 'accuracy':
      return {
        ...baseObject,
        content: '±0m',
        size: { width: 60, height: 24 },
      };
    case 'heading':
      return {
        ...baseObject,
        content: '0° N',
        size: { width: 80, height: 24 },
      };
    case 'tilt':
      return {
        ...baseObject,
        content: '0°',
        size: { width: 50, height: 24 },
      };
    case 'timestamp':
      return {
        ...baseObject,
        content: '00:00:00',
        size: { width: 100, height: 24 },
      };
    default:
      return baseObject;
  }
}

export function generateId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createDefaultLayer(name: string = 'Слой 1'): WatermarkLayer {
  return {
    id: `layer_${Date.now()}`,
    name,
    objects: [],
    visible: true,
    locked: false,
    collapsed: false,
  };
}

export const initialEditorState: WatermarkEditorState = {
  layers: [createDefaultLayer()],
  groups: [],
  selectedObjectIds: [],
  selectedLayerId: null,
  activeToolId: 'select',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  gridEnabled: false,
  snapToGrid: false,
  gridSize: 10,
};
