import type { Bot } from 'mineflayer';
import type { Entity } from 'prismarine-entity';
import type { Perimeter } from '#/Perimeter';
import { BotTask } from '#/tasks/bot/BotTask';
import { type RequiredDefaults, mergeOptions } from '#/utils';

interface State {
  perimeter: Perimeter;
  result: Entity[];

  checkCounter: number;
}

type Matcher = (entity: Entity) => boolean;

export type FindEntitiesInPerimeterOptions = {
  matching: Matcher;
  sortFn?: ((a: Entity, b: Entity) => number) | false;
};

export class FindEntitiesInPerimeter extends BotTask<
  Perimeter,
  unknown,
  Entity[]
> {
  private options: Required<FindEntitiesInPerimeterOptions>;

  private defaultOptions: RequiredDefaults<FindEntitiesInPerimeterOptions> = {
    sortFn: false,
  };

  private defaultState: State = {
    perimeter: null!,
    result: [],
    checkCounter: 0,
  };

  private state = structuredClone(this.defaultState);

  constructor(bot: Bot, options: FindEntitiesInPerimeterOptions) {
    super(bot);

    this.options = mergeOptions(options, this.defaultOptions);
  }

  public onStart(perimeter: Perimeter, _triggerCtx: unknown): void {
    this.state = structuredClone(this.defaultState);

    this.state.perimeter = perimeter;

    this.state.result = Object.values(this.bot.entities).filter((entity) => {
      this.state.checkCounter += 1;

      return (
        this.state.perimeter.isInPerimeter(entity.position) &&
        this.options.matching(entity)
      );
    });
  }

  public onDone(): Entity[] {
    const result = this.state.result;

    console.log(
      `Found ${result.length} entities, performed ${this.state.checkCounter} checks`,
    );

    this.state = structuredClone(this.defaultState);

    return this.options.sortFn ? result.sort(this.options.sortFn) : result;
  }

  public onFailed(): void {
    this.state = structuredClone(this.defaultState);
  }
}
