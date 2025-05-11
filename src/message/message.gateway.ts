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
  @SubscribeMessage('createMessage')
  create(
    @MessageBody() message: CreateMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    this.messageService.handlerMessages(this.server, socket, message);
  }
}
