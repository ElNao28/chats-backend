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
    console.log(`Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createMessage')
  create(
    @MessageBody() message: CreateMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    this.messageService.handlerMessages(this.server, socket, message);
  }

  @SubscribeMessage('createRoom')
  async createRoom(
    @MessageBody() data: { idUser: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { idUser } = data;
    await this.messageService.getChatsById(this.server, idUser, socket);
  }
}
