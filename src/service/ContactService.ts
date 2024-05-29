import { inject, injectable } from 'inversify';
import { EntityManager } from '@mikro-orm/core';
import { Contact } from '../entities/Contact';
import { TYPES } from '../helper/types';
import { CreateResponse } from '../helper/CreateResponse';

@injectable()
export class ContactService {
  constructor(
    @inject(TYPES.EntityManager) private entityManager: EntityManager,
    @inject(TYPES.CreateResponse) private createResponse: CreateResponse,
  ) {}

  public async createOrUpdateIdentity(email?: string, phoneNumber?: string) {
    const contacts = await this.entityManager.find(Contact, {
      $or: [
        { email },
        { phoneNumber },
      ],
    });

    if (contacts.length === 0) {
      const newContact = this.entityManager.create(Contact, {
        phoneNumber,
        email,
        linkPrecedence: 'primary',
      } as Contact);
      await this.entityManager.persistAndFlush(newContact);
      return this.createResponse.create(newContact, []);
    }

    let primaryContact = contacts.find(contact => contact.linkPrecedence === 'primary');
    if (!primaryContact) {
      primaryContact = contacts[0];
      primaryContact.linkPrecedence = 'primary';
      await this.entityManager.persistAndFlush(primaryContact);
    }

    const secondaryContacts = contacts.filter(contact => contact.id !== primaryContact!.id);
    for (const contact of secondaryContacts) {
      if (contact.linkPrecedence === 'primary') {
        contact.linkPrecedence = 'secondary';
        contact.linkedId = primaryContact!.id;
        await this.entityManager.persistAndFlush(contact);
      } else {
        contact.linkedId = primaryContact!.id;
        await this.entityManager.persistAndFlush(contact);
      }
    }

    if (!contacts.some(contact => contact.email === email || contact.phoneNumber === phoneNumber)) {
      const newContact = this.entityManager.create(Contact, {
        phoneNumber,
        email,
        linkedId: primaryContact!.id,
        linkPrecedence: 'secondary',
      } as Contact);
      secondaryContacts.push(newContact);
      await this.entityManager.persistAndFlush(newContact);
    }

    return this.createResponse.create(primaryContact!, secondaryContacts);
  }

}
