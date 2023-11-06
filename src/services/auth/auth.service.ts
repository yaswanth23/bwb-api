import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from '../../models/dto/auth/auth.dto';
import { IdGeneratorService } from '../idGenerator/idgenerator.service';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private idGeneratorService: IdGeneratorService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    return true;
  }
}
