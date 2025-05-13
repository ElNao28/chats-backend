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
  public async handlerMessages(
    server: Server,
    clientSocket: Socket,
    createMessageDto: CreateMessageDto,
  ) {
    const { from, to, message, chatId } = createMessageDto;
    let chat: Chat | null = null;

    if (!chatId) {
      chat = await this.createNewChat(from, to);
    } else {
      chat = await this.chatRepository.findOne({
        where: {
          id: chatId,
        },
      });
    }
    await this.createMessage(from, chat!, message);
    await this.sendMessageToUser(server, clientSocket, chat!);
    await this.getChatsById(server, from);
    await this.getChatsById(server, to);
  }
  private async createNewChat(from: string, to: string): Promise<Chat | null> {
    try {
      const newChat = this.chatRepository.create({
        id: uuidv4(),
        createOn: new Date(),
      });
      const saveChat = await this.chatRepository.save(newChat);
      await this.createNewUserChat(from, to, saveChat);
      return saveChat;
    } catch (error) {
      console.log('Error creating new chat', error);
      return null;
    }
  }
  private async createNewUserChat(
    from: string,
    to: string,
    chat: Chat,
  ): Promise<void> {
    try {
      const fromUser = await this.userRepository.findOne({
        where: {
          id: from,
        },
      });
      const toUser = await this.userRepository.findOne({
        where: {
          id: to,
        },
      });

      const newUserChat = this.userChatRepository.create({
        id: uuidv4(),
        title: toUser!.username,
        user: fromUser!,
        chat,
      });
      const newUserChat2 = this.userChatRepository.create({
        id: uuidv4(),
        title: fromUser!.username,
        user: toUser!,
        chat,
      });
      await this.userChatRepository.save(newUserChat);
      await this.userChatRepository.save(newUserChat2);
    } catch (error) {
      console.log('Error creating new user chat', error);
    }
  }
  private async createMessage(
    from: string,
    chat: Chat,
    message: string,
  ): Promise<void> {
    try {
      const fromUser = await this.userRepository.findOne({
        where: {
          id: from,
        },
      });
      const newMessage = this.messageRepository.create({
        id: uuidv4(),
        message,
        createdAt: new Date(),
        user: fromUser!,
        chat,
      });
      await this.messageRepository.save(newMessage);
    } catch (error) {
      console.log('Error creating new message', error);
    }
  }
  private async sendMessageToUser(
    server: Server,
    clienSocket: Socket,
    chat: Chat,
  ): Promise<void> {
    try {
      await this.getMessagesByChat(server, chat.id, clienSocket);
    } catch (error) {
      console.log('Error sending message to user', error);
    }
  }

  public async getChatsById(
    server: Server,
    idUser: string,
    clientSocket?: Socket,
  ) {
    try {
      const foundUser = await this.userRepository.findOne({
        where: {
          id: idUser,
        },
        relations: ['chats', 'messages'],
      });
      const foundChats = await this.userChatRepository.find({
        where: {
          user: foundUser!,
        },
        relations: ['chat', 'chat.messages'],
      });

      if (clientSocket) {
        clientSocket.join(idUser);
      }
      server.to(idUser).emit('chatsRoom', foundChats);
    } catch (error) {
      console.log('Error getting messages by contacts', error);
    }
  }

  public async getMessagesByChat(
    server: Server,
    chatId: string,
    clientSocket: Socket,
  ) {
    try {
      const foundChat = await this.chatRepository.findOne({
        where: {
          id: chatId,
        },
      });
      const messages = await this.messageRepository.find({
        where: {
          chat: foundChat!,
        },
        relations: ['user', 'user.chats', 'user.chats.chat'],
        order: {
          createdAt: 'ASC',
        },
      });
      clientSocket.join(chatId);
      server.to(chatId).emit('messagesRoom', messages);
    } catch (error) {
      console.log('Error getting messages by chat', error);
    }
  }
}
