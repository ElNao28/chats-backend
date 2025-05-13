export class HandlerResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
  error?: string;

  constructor(
    statusCode: number,
    data: T,
    message: string = 'Completed successfully',
    error?: string,
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.error = error;
    this.message = message;
  }
}
