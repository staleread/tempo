export type State = {
  componentId: string | number;
  level: number;
  cells: any[];
  contextMap?: Map<string, unknown>;
};
