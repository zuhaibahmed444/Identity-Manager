import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Contact {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  phoneNumber?: string;

  @Property({ nullable: true })
  email?: string;

  @Property({ nullable: true })
  linkedId?: number;

  @Property()
  linkPrecedence: 'primary' | 'secondary' = 'primary';

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date;
}
