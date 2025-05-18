import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: ['*'],
  namespace: 'message',
})
export class MessageGateway {
  constructor(private readonly messageService: MessageService) {}

  @WebSocketServer()
  private server: Server;

  handleConnection(client: Socket) {
    // console.log(`Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    this.messageService.exitUser(client);
  }

  @SubscribeMessage('enterApp')
  public async enterApp(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    await this.messageService.enterUserToApp(data.userId, socket, this.server);
  }

  @SubscribeMessage('joinRoom')
  public async joinRoom(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(data.chatId);
  }

  @SubscribeMessage('sendMessage')
  public async getMessagesByChat(
    @MessageBody()
    data: CreateMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    await this.messageService.handlerSendMessage(data, socket, this.server);
  }
}
