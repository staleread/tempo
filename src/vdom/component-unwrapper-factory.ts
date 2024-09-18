import { AstProvider } from '../ast/ast-provider';
import { LoggerFactory } from '../log/logger-factory';
import { ComponentUnwrapper } from './component-unwrapper';
import { VdomUnwrapper } from './vdom-unwrapper';
import {
  ComponentFunc,
  ComponentResult,
  ComponentUnwrapDto,
  ComponentUnwrapperContext,
  VdomNode,
} from './vdom.types';

export class ComponentUnwrapperFactory {
  constructor(
    private readonly loggerFactory: LoggerFactory,
    private readonly astProvider: AstProvider,
  ) {}

  public createComponentUnwrapper(
    dto: ComponentUnwrapDto,
    vdomUnwrapper: VdomUnwrapper,
  ): ComponentUnwrapper {
    const result: ComponentResult = dto.componentFunc(dto.props);
    const logger = this.loggerFactory.createLogger(
      dto.componentFunc.name,
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
      unwrapChildrenCallback: dto.unwrapChildrenCallback,
    };

    return new ComponentUnwrapper(
      dto.stateLevel,
      ast,
      dto.dest,
      logger,
      context,
      vdomUnwrapper,
    );
  }
}
