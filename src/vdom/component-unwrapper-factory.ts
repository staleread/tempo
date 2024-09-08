import { AstProvider } from '../ast/ast-provider';
import { LoggerFactory } from '../log/logger-factory';
import { ComponentUnwrapper } from './component-unwrapper';
import { VdomUnwrapper } from './vdom-unwrapper';
import {
  ComponentFunc,
  ComponentResult,
  ComponentUnwrapperContext,
  ComponentUnwrapperDto,
  VdomNode,
} from './vdom.types';

export class ComponentUnwrapperFactory {
  constructor(
    private readonly loggerFactory: LoggerFactory,
    private readonly astProvider: AstProvider,
  ) {}

  public createComponentUnwrapper(
    dto: ComponentUnwrapperDto,
    vdomUnwrapper: VdomUnwrapper,
  ): ComponentUnwrapper {
    const result: ComponentResult = dto.func(dto.props);
    const logger = this.loggerFactory.createLogger(
      dto.componentId,
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
      unwrapChildren: dto.unwrapChildren,
    };

    return new ComponentUnwrapper(
      dto.level,
      ast,
      dto.dest,
      logger,
      context,
      vdomUnwrapper,
    );
  }
}
