import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpPost } from 'inversify-express-utils';
import { ContactService } from '../service/ContactService';
import { TYPES } from '../helper/types';

@controller('/api')
export class ContactController {
  constructor(
    @inject(TYPES.ContactService) private contactService: ContactService
  ) {}

  @httpPost('/identify')
  public async identify(req: Request, res: Response) {
    const { email, phoneNumber } = req.body;
    try {
      const result = await this.contactService.createOrUpdateIdentity(email, phoneNumber);
      res.status(200).json(result);
    } catch (error : any) {
      res.status(500).json({ error: error.message });
    }
  }
}
