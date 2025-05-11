export class CreateMessageDto {
  from: string;
  to: string;
  chatId?: string;
  message: string;
}
