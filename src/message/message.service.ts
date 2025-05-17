import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chats.entity';
import { UserChat } from './entities/user-chat.entity';
import { v4 as uuidv4 } from 'uuid';
import { UserConected } from 'src/utils/UserConected.interface';

let listUsersApp: UserConected[] = [];

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(UserChat)
    private userChatRepository: Repository<UserChat>,
  ) {}

  public async enterUserToApp(userId: string, socketClient: Socket) {
    try {
      await this.userRepository.update(
        { id: userId },
        {
          status: 'online',
        },
      );
      await this.sendListChatsByUser(socketClient, userId);
      listUsersApp.push({ userId, socketId: socketClient.id });
    } catch (error) {
      console.log('Error entering user to app', error);
    }
  }
  public async exitUser(socketClient: Socket) {
    try {
      const foundUser = await listUsersApp.find(
        (socket) => socket.socketId === socketClient.id,
      );
      await this.userRepository.update(
        { id: foundUser?.userId },
        {
          status: 'offline',
          lastConection: new Date(),
        },
      );
      listUsersApp = listUsersApp.filter(
        (socket) => socket.socketId !== socketClient.id,
      );
    } catch (error) {
      console.log('Error checking user existence', error);
    }
  }

  public async sendListChatsByUser(clientService: Socket, userId: string) {
    try {
      const chats = await this.chatRepository.find({
        relations: ['chats', 'chats.user', 'messages'],
      });
      const chatByUser = chats.filter((chat) => {
        return chat.chats.some((userChat) => userChat.user.id === userId);
      });
      const chatFilter = chatByUser.map((chat) => {
        const { chats, ...chatRest } = chat;
        return {
          chat: chats.filter((userChat) => userChat.user.id !== userId)[0],
          ...chatRest,
        };
      });
      const listChats = chatFilter.map((chat) => {
        const { messages, ...restChat } = chat;
        const lastMessage = messages[messages.length - 1];
        return {
          lastMessage,
          ...restChat,
        };
      });
      clientService.emit('listChats', listChats);
    } catch (error) {
      console.log('Error sending list of chats', error);
    }
  }
}
