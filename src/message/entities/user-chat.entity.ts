import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Chat } from './chats.entity';

@Entity({ name: 'user_chat' })
export class UserChat {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => User, (user) => user.chats)
  user: User;
  @ManyToOne(() => Chat, (chat) => chat.chats)
  chat: Chat;
}
