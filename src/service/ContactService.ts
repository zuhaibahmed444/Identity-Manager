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
    let contacts : Contact[] = []

    if (phoneNumber || email){
      contacts = await this.entityManager.find(Contact, {  $or: [
        { email},
        { phoneNumber }
      ]});
    }

    console.log(contacts);
    if (contacts.length === 0) {
      primaryContact = this.entityManager.create(Contact, {
        phoneNumber,
        email,
        linkPrecedence: 'primary',
      } as Contact);
      await this.entityManager.persistAndFlush(primaryContact);
    } else if (contacts.length >1){
      contacts.forEach((contact) =>{
        if(contact.linkedId){
          secondaryContacts.push(contact);
        }else{
          primaryContact = contact
        }
      })
    }else if (contacts.length > 0 && contacts[0].linkedId){
      console.log("I am here in FIRST1",contacts)
      primaryContact = await this.entityManager.findOne(Contact, { id : contacts[0].linkedId})
      secondaryContacts = contacts;
    }else if (contacts.length > 0 && !contacts[0].linkedId){
      console.log("I am in the second",contacts)
      primaryContact = contacts[0];
      const secondaryContactsFromprimary = await this.entityManager.find(Contact, {  $or: [
        { email : primaryContact.email},
        { phoneNumber: primaryContact.phoneNumber }
      ], linkPrecedence:'secondary'});
      if(secondaryContactsFromprimary.length === 0){
        console.log("I am in the THIRD",contacts)
        const secondaryContact = this.entityManager.create(Contact, {
          phoneNumber,
          email,
          linkPrecedence: 'secondary',
          linkedId: primaryContact.id
        } as Contact);
        secondaryContacts.push(secondaryContact);
        await this.entityManager.persistAndFlush(secondaryContact);
      }else{
        console.log("I am in the FOURTH",contacts)
        secondaryContacts = secondaryContactsFromprimary
      }
    }
    return this.createResponse.create(primaryContact!, secondaryContacts);
  }
}
