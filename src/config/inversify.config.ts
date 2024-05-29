import 'reflect-metadata';
import { Container } from 'inversify';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import mikroOrmConfig from './mikro-orm.config';
import { TYPES } from './types';

const container = new Container();

container.bind<MikroORM>(TYPES.MikroORM).toDynamicValue(async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getSchemaGenerator().updateSchema();
  return orm;
}).inSingletonScope();

container.bind<EntityManager>(TYPES.EntityManager).toDynamicValue((context) => {
  const orm = context.container.get<MikroORM>(TYPES.MikroORM);
  return orm.em.fork();
});

export { container };
