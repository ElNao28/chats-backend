import { HttpStatus, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  public async loginUser(loginDto: LoginDto) {
    try {
      const { username, password } = loginDto;
      const foundUser = await this.userRepository.findOne({
        where: {
          username,
        },
      });
      if (!foundUser)
        throw new Error('User not found', {
          cause: {
            code: 404,
            message: 'User not found',
          },
        });
      const isMatch = await bcrypt.compare(password, foundUser.password);
      if (!isMatch)
        throw new Error('Invalid credentials', {
          cause: {
            code: 401,
            message: 'Invalid credentials',
          },
        });

      const payload = { id: foundUser.id, username: foundUser.username };
      const token = await this.jwtService.signAsync(payload);

      return {
        message: 'User authenticated successfully',
        token,
        status: HttpStatus.OK,
      };
    } catch (error) {
      console.log('Error en login', error);
      throw error;
    }
  }
}
