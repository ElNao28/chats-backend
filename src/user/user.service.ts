import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

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
      return {
        message: 'User created successfully',
        status: HttpStatus.CREATED,
        user: newUser,
      };
    } catch (error) {
      console.error(error);
      return {
        message: 'Error creating user',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
