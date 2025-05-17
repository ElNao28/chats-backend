import { Body, Controller, Post } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
  @Post()
  public checkChat(
    @Body()
    data: {
      to: string;
      from: string;
    },
  ) {
    return this.messageService.checkIdChat(data);
  }
}
