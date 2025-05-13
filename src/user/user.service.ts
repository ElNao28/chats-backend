import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { HandlerResponse } from 'src/utils/Handler-response.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  public async createNewUser(createUserDto: CreateUserDto) {
    try {
      const { password, ...newUserData } = createUserDto;
      const newUser = this.userRepository.create({
        id: uuidv4(),
        password: bcrypt.hashSync(password, 10),
        ...newUserData,
      });
      await this.userRepository.save(newUser);

      return new HandlerResponse<User>(
        HttpStatus.CREATED,
        newUser,
        'User created successfully',
      );
    } catch (error) {
      console.error(error);
      return new HandlerResponse<null>(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while creating the user',
      );
    }
  }
  public async findAllUsers() {
    try {
      const foundAllUsers = await this.userRepository.find();
      return new HandlerResponse<User[]>(
        HttpStatus.OK,
        foundAllUsers,
        'Users retrieved successfully',
      );
    } catch (error) {
      console.error(error);
      return new HandlerResponse<null>(
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while retrieving the users',
      );
    }
  }
}
