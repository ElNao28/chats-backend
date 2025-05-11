import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { UserChat } from './user-chat.entity';
import { Message } from './message.entity';

@Entity()
export class Chat {
  @PrimaryColumn('uuid')
  id: string;
  @Column({
    name: 'create_on',
    type: 'timestamp',
  })
  createOn: Date;

  @OneToMany(() => UserChat, userchat => userchat.chat)
  chats: UserChat[];

  @OneToMany(() => Message, message => message.chat)
  messages: Message[];
}
