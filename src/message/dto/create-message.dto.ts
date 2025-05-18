export class CreateMessageDto {
  from: string;
  to: string;
  message: string;
  chatId?: string;
}
