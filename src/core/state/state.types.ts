export type State = {
  tag: string;
  level: number;
  contextMap: Map<string, unknown>;
  cells: any[];
};
