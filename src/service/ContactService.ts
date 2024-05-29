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

    if (contacts.length === 0) {
      //  to add the primary contact
      primaryContact = this.entityManager.create(Contact, {
        phoneNumber,
        email,
        linkPrecedence: 'primary',
      } as Contact);
      await this.entityManager.persistAndFlush(primaryContact);
    } else if (contacts.length >1){
      // if already primary and secondary exist
      contacts.forEach((contact) =>{
        if(contact.linkedId){
          secondaryContacts.push(contact);
        }else{
          primaryContact = contact
        }
      })
      if(this.allPrimaryContacts(contacts)){
        // if only primary exist and convert to primary 
        contacts.sort((a,b) => a.id - b.id);
        primaryContact = contacts[0];
        const contactToUpdate = this.entityManager.create(Contact, { id : contacts[1].id, linkedId : contacts[0].linkedId, email : contacts[1].email ,phoneNumber : contacts[1].phoneNumber, createdAt : contacts[1].createdAt, updatedAt : new Date() , deletedAt: contacts[1].deletedAt,linkPrecedence :'secondary'})
        await this.entityManager.upsert(contactToUpdate);
        secondaryContacts.push(contactToUpdate);
        return this.createResponse.create(primaryContact!, secondaryContacts)
      }
    }else if (contacts.length > 0 && contacts[0].linkedId){
      // if secondary contacts email is passed 
      primaryContact = await this.entityManager.findOne(Contact, { id : contacts[0].linkedId})
      secondaryContacts = contacts;
    }else if (contacts.length > 0 && !contacts[0].linkedId){
      // if primary contacts email is passed
      primaryContact = contacts[0];

      // find secondary based on primary
      const secondaryContactsFromprimary = await this.entityManager.find(Contact, {  $or: [
        { email : primaryContact.email},
        { phoneNumber: primaryContact.phoneNumber }
      ], linkPrecedence:'secondary'});


      if(secondaryContactsFromprimary.length === 0){
        // create secondary if does not exist
        const secondaryContact = this.entityManager.create(Contact, {
          phoneNumber,
          email,
          linkPrecedence: 'secondary',
          linkedId: primaryContact.id
        } as Contact);
        secondaryContacts.push(secondaryContact);
        await this.entityManager.persistAndFlush(secondaryContact);
      }else{
        // if secondary already exists
        secondaryContacts = secondaryContactsFromprimary
      }
    }

    return this.createResponse.create(primaryContact!, secondaryContacts);
  }


  private allPrimaryContacts(contacts : Contact[]): boolean{
    console.log("Inthe primary contacts validatios")
    contacts.forEach((contact) =>{
      if(contact.linkPrecedence !== 'primary') return false;
    })
    return true
  }
  
}
