import 'reflect-metadata';
import { Container } from 'inversify';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import mikroOrmConfig from './mikro-orm.config';
import { TYPES } from '../helper/types';
import { ContactService } from '../service/ContactService';
import { CreateResponse } from '../helper/CreateResponse';


const configureContainer = async (): Promise<Container> => { 
    const container = new Container();

    const orm = await MikroORM.init(mikroOrmConfig);
    await orm.getSchemaGenerator().updateSchema();

    container.bind<MikroORM>(TYPES.MikroORM).toConstantValue(orm);
    container.bind<EntityManager>(TYPES.EntityManager).toDynamicValue((context) => orm.em.fork());

    container.bind<ContactService>(TYPES.ContactService).to(ContactService);
    container.bind<CreateResponse>(TYPES.CreateResponse).to(CreateResponse);
    return container;
}


export { configureContainer };
