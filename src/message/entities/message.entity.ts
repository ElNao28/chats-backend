import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Chat } from './chats.entity';

@Entity()
export class Message {
  @PrimaryColumn('uuid')
  id: string;
  @Column()
  message: string;

  @ManyToOne(() => User, (user) => user.messages)
  user: User;
  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat: Chat;
}
