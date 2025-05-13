import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/create')
  public createNeUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createNewUser(createUserDto);
  }

  @Get('/all')
  public getAllUsers() {
    return this.userService.findAllUsers();
  }
}
