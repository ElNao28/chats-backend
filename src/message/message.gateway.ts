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
    socket.join('chat_one');
    this.server.to('chat_one').emit('message', message.message);
    //this.server.emit('message', messages);
  }
}
