import { Message } from 'src/message/entities/message.entity';
import { UserChat } from 'src/message/entities/user-chat.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @OneToMany(() => UserChat, (userchat) => userchat.user)
  chats: UserChat[];
  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];
}
