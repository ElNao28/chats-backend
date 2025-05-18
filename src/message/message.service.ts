import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chats.entity';
import { UserChat } from './entities/user-chat.entity';
import { v4 as uuidv4 } from 'uuid';
import { UserConected } from 'src/utils/UserConected.interface';
import { WebSocketServer } from '@nestjs/websockets';
import { HandlerResponse } from 'src/utils/Handler-response.util';

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
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  public async enterUserToApp(
    userId: string,
    socketClient: Socket,
    server: Server,
  ) {
    try {
      await this.userRepository.update(
        { id: userId },
        {
          status: 'online',
        },
      );
      socketClient.join(userId);
      await this.sendListChatsByUser(userId, server);
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
  public async sendListChatsByUser(userId: string, server: Server) {
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
      server.to(userId).emit('listChats', listChats);
    } catch (error) {
      console.log('Error sending list of chats', error);
    }
  }
  public async checkIdChat(usersData: { to: string; from: string }) {
    try {
      const { to, from } = usersData;
      const foundChat = await this.dataSource
        .getRepository(Chat)
        .createQueryBuilder('chat')
        .leftJoinAndSelect('chat.messages', 'message')
        .innerJoin('chat.chats', 'userChatOne')
        .innerJoin('chat.chats', 'userChatTwo')
        .where('userChatOne.user.id = :to', {
          to,
        })
        .andWhere('userChatTwo.user.id = :from', {
          from,
        })
        .getOne();
      if (!foundChat)
        return new HandlerResponse(HttpStatus.NOT_FOUND, {}, 'Chat not found');
      return this.getMessagesByChat(foundChat.id);
    } catch (error) {
      console.log('Error getting messages between users', error);
    }
  }
  public async checkStatusUser(userId: string, clientSocket: Socket) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      clientSocket.emit('statusUser', user);
    } catch (error) {
      console.log('Error checking user status', error);
      throw error;
    }
  }
  public async getMessagesByChat(chatId: string) {
    try {
      const messages = await this.chatRepository.findOne({
        where: { id: chatId },
        relations: ['messages', 'messages.user'],
      });
      return new HandlerResponse(HttpStatus.OK, messages, 'Messages found');
    } catch (error) {
      console.log('Error getting messages by chat', error);
    }
  }
  public async handlerSendMessage(
    data: CreateMessageDto,
    clientSocket: Socket,
    server: Server,
  ) {
    try {
      const { from, to, message, chatId } = data;
      let chat: Chat;

      if (!chatId) {
        chat = await this.createNewChat();
        await this.createUserChat(from, to, chat);
      } else {
        chat = (await this.chatRepository.findOneBy({ id: chatId }))!;
      }
      await this.sendMessage(message, chat, from, to, server);
    } catch (error) {
      console.log('Error sending message', error);
      throw error;
    }
  }
  private async createNewChat(): Promise<Chat> {
    try {
      const newChat = this.chatRepository.create({
        id: uuidv4(),
        createOn: new Date(),
      });
      const saveChat = await this.chatRepository.save(newChat);
      return saveChat;
    } catch (error) {
      console.log('Error creating new chat', error);
      throw error;
    }
  }
  private async createUserChat(
    userOneId: string,
    userTwoId: string,
    chat: Chat,
  ) {
    try {
      const userOne = await this.userRepository.findOneBy({ id: userOneId });
      const userTwo = await this.userRepository.findOneBy({ id: userTwoId });

      const newUserChat = this.userChatRepository.create({
        id: uuidv4(),
        title: `${userOne!.username} and ${userTwo!.username}`,
        user: userOne!,
        chat,
      });
      const newUserChatTwo = this.userChatRepository.create({
        id: uuidv4(),
        title: `${userOne!.username} and ${userTwo!.username}`,
        user: userTwo!,
        chat,
      });
      await this.userChatRepository.save(newUserChat);
      await this.userChatRepository.save(newUserChatTwo);
    } catch (error) {
      console.log('Error creating user chat', error);
      throw error;
    }
  }
  private async sendMessage(
    message: string,
    chat: Chat,
    idUser: string,
    to: string,
    server: Server,
  ) {
    try {
      const user = (await this.userRepository.findOneBy({ id: idUser }))!;
      const newMessage = this.messageRepository.create({
        id: uuidv4(),
        message,
        createdAt: new Date(),
        chat,
        user,
      });
      const savedMessage = await this.messageRepository.save(newMessage);
      if (savedMessage) {
        const message = await this.messageRepository.findOne({
          where: { id: savedMessage.id },
          relations: ['user'],
        });
        server.to(chat.id).emit('newMessage', message);
        this.sendListChatsByUser(to, server);
      }
    } catch (error) {
      console.log('Error sending message', error);
      throw error;
    }
  }
}
