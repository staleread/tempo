export type VnodeType = 'Root' | 'Text' | 'Tag' | 'Blank';

export type Vnode = {
  type: VnodeType;
  [key: string]: any;
};

export type AnyObject = { [key: string]: any };
export type Attr = { id: string; value: any };

export type ComponentFunc = (
  props: AnyObject,
  ctx: AnyObject,
) => ComponentResult;

export type ComponentResult = {
  imports?: ComponentFunc[];
  template: string;
  attach?: AnyObject;
};

export type ComponentAllocationContext = {
  id: string;
  func: ComponentFunc;
  props: AnyObject;
  ctx: AnyObject;
  inner?: ComponentAllocationContext;
};

export type ComponentUnwrapperContext = {
  importsMap: Map<string, ComponentFunc>;
  attachMap: Map<string, any>;
  ctx: AnyObject;
  childAllocCtx?: ComponentAllocationContext;
};
