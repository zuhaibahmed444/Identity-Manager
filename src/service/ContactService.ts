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
    let primaryContact: Contact | null = null;
    let secondaryContacts: Contact[] = [];

    const contacts = await this.findContacts(email, phoneNumber);

    if (contacts.length === 0) {
      primaryContact = await this.createPrimaryContact(email, phoneNumber);
    } else if (contacts.length > 1) {
      primaryContact = await this.handleMultipleContacts(contacts, secondaryContacts);
    } else if (contacts.length === 1) {
      primaryContact = await this.handleSingleContact(contacts[0],secondaryContacts,email, phoneNumber);
    }

    return this.createResponse.create(primaryContact!, secondaryContacts);
  }

  private async findContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
    if (!phoneNumber && !email) return [];
    return this.entityManager.find(Contact, { $or: [{ email }, { phoneNumber }] });
  }

  private async createPrimaryContact(email?: string, phoneNumber?: string): Promise<Contact> {
    const primaryContact = this.entityManager.create(Contact, {
      phoneNumber,
      email,
      linkPrecedence: 'primary',
    } as Contact)
    await this.entityManager.persistAndFlush(primaryContact);
    return primaryContact;
  }

  private async handleMultipleContacts(contacts: Contact[], secondaryContacts: Contact[]): Promise<Contact> {
    if (this.allPrimaryContacts(contacts)) {
      contacts.sort((a, b) => a.id - b.id);
      const primaryContact = contacts[0];
      await this.convertToSecondaryContact(contacts[1], primaryContact);
      secondaryContacts.push({ ...contacts[1], linkedId: primaryContact.id, linkPrecedence: 'secondary' });
      return primaryContact;
    }
    return this.segregatePrimaryAndSecondaryContacts(contacts, secondaryContacts);
  }

  private async convertToSecondaryContact(contact: Contact, primaryContact: Contact) {
    const updatedContact = this.entityManager.create(Contact, {
      linkedId: primaryContact.id,
      email: contact.email,
      phoneNumber: contact.phoneNumber,
      createdAt: contact.createdAt,
      updatedAt: new Date(),
      deletedAt: contact.deletedAt,
      linkPrecedence: 'secondary',
    });
    await this.entityManager.nativeUpdate(Contact, { id: contact.id }, updatedContact);
  }

  private segregatePrimaryAndSecondaryContacts(contacts: Contact[], secondaryContacts: Contact[]): Contact {
    let primaryContact: Contact | null = null;
    contacts.forEach(contact => {
      if (contact.linkedId) {
        secondaryContacts.push(contact);
      } else {
        primaryContact = contact;
      }
    });
    return primaryContact!;
  }

  private async handleSingleContact(contact: Contact, secondaryContacts: Contact[], email?: string, phoneNumber?: string): Promise<Contact> {
    let primaryContact: Contact;

    if (contact.linkedId) {
      // If the contact is secondary, find its primary contact
      primaryContact = await this.entityManager.findOne(Contact, { id: contact.linkedId }) as Contact ;
      secondaryContacts.push(contact);
    } else {
      // If the contact is primary
      primaryContact = contact;
      const secondaryContactsFromPrimary = await this.findSecondaryContacts(primaryContact);

      if (secondaryContactsFromPrimary.length === 0) {
        // Create a new secondary contact if none exist
        const newSecondaryContact = await this.createSecondaryContact(primaryContact, email, phoneNumber);
        secondaryContacts.push(newSecondaryContact);
      } else {
        // Use existing secondary contacts
        secondaryContacts.push(...secondaryContactsFromPrimary);
      }
    }

    return primaryContact;
  }

  private async findSecondaryContacts(primaryContact: Contact): Promise<Contact[]> {
    return this.entityManager.find(Contact, {
      $or: [{ email: primaryContact.email }, { phoneNumber: primaryContact.phoneNumber }],
      linkPrecedence: 'secondary',
    });
  }

  private async createSecondaryContact(primaryContact: Contact, email?: string, phoneNumber?: string): Promise<Contact> {
    const secondaryContact = this.entityManager.create(Contact, {
      phoneNumber,
      email,
      linkPrecedence: 'secondary',
      linkedId: primaryContact.id,
    } as Contact);
    await this.entityManager.persistAndFlush(secondaryContact);
    return secondaryContact;
  }

  private allPrimaryContacts(contacts: Contact[]): boolean {
    return contacts.every(contact => contact.linkPrecedence === 'primary');
  }
}
