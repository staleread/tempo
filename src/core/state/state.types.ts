export type State = {
  tag: string;
  level: number;
  key: any;
  contextMap: Map<string, unknown>;
  cells: any[];
};
