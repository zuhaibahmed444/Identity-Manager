import { injectable } from 'inversify';
import { Contact } from '../entities/Contact';

@injectable()
export class CreateResponse{
    public create(primaryContact: Contact, secondaryContacts: Contact[]){
        return {
            contact: {
              primaryContactId: primaryContact.id,
              emails: [primaryContact.email, ...secondaryContacts.map(secondaryContact => secondaryContact.email)].filter(email => email),
              phoneNumbers:[... new Set([primaryContact.phoneNumber, ...secondaryContacts.map(secondaryContact => secondaryContact.phoneNumber)].filter(phoneNumber => phoneNumber))],
              secondaryContactIds: secondaryContacts.map(secondaryContact => secondaryContact.id),
            },
        };
    }
}