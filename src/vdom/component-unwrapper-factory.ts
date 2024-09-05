import { AstProvider } from '../ast/ast-provider';
import { LoggerFactory } from '../log/logger-factory';
import { ComponentUnwrapper } from './component-unwrapper';
import { VdomUnwrapper } from './vdom-unwrapper';
import {
  ComponentAllocationContext,
  ComponentFunc,
  ComponentResult,
  ComponentUnwrapperContext,
  Vnode,
} from './vdom.types';

export class ComponentUnwrapperFactory {
  constructor(
    private readonly loggerFactory: LoggerFactory,
    private readonly astProvider: AstProvider,
  ) {}

  public createComponentUnwrapper(
    level: number,
    dest: Vnode[],
    allocCtx: ComponentAllocationContext,
    vdomUnwrapper: VdomUnwrapper,
  ): ComponentUnwrapper {
    const result: ComponentResult = allocCtx.func(
      allocCtx.props,
      allocCtx.ctx,
    );
    const logger = this.loggerFactory.createLogger(
      allocCtx.id,
      result.template,
    );
    const ast = this.astProvider.getAst(result.template, logger);

    const importsMap = result.imports
      ? new Map(result.imports.map((c: ComponentFunc) => [c.name, c]))
      : new Map();

    const attachMap = result.attach
      ? new Map(Object.entries(result.attach))
      : new Map();

    const context: ComponentUnwrapperContext = {
      importsMap,
      attachMap,
      ctx: allocCtx.ctx,
      childAllocCtx: allocCtx.inner,
    };

    return new ComponentUnwrapper(
      level,
      ast,
      dest,
      logger,
      context,
      vdomUnwrapper,
    );
  }
}
