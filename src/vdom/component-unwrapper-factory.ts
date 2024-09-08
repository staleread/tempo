import { AstProvider } from '../ast/ast-provider';
import { LoggerFactory } from '../log/logger-factory';
import { ComponentUnwrapper } from './component-unwrapper';
import { VdomUnwrapper } from './vdom-unwrapper';
import {
  ComponentFunc,
  ComponentResult,
  ComponentUnwrapperContext,
  VdomNode,
  VdomUnwrapperContext,
} from './vdom.types';

export class ComponentUnwrapperFactory {
  constructor(
    private readonly loggerFactory: LoggerFactory,
    private readonly astProvider: AstProvider,
  ) {}

  public createComponentUnwrapper(
    level: number,
    dest: VdomNode[],
    ctx: VdomUnwrapperContext,
    vdomUnwrapper: VdomUnwrapper,
  ): ComponentUnwrapper {
    const result: ComponentResult = ctx.func(ctx.props);
    const logger = this.loggerFactory.createLogger(
      ctx.componentId,
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
      unwrapChildren: ctx.unwrapChildren,
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
