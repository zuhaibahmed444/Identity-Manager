import 'reflect-metadata';
import { Container } from 'inversify';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import mikroOrmConfig from './mikro-orm.config';
import { TYPES } from '../helper/types';
import { ContactService } from '../service/ContactService';
import { CreateResponse } from '../helper/CreateResponse';

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

container.bind<ContactService>(TYPES.ContactService).to(ContactService);
container.bind<CreateResponse>(TYPES.CreateResponse).to(CreateResponse);

export { container };
