import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from '../../models/dto/auth/auth.dto';
import { IdGeneratorService } from '../idGenerator/idgenerator.service';
import { genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private idGeneratorService: IdGeneratorService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const signUpKeyData = await this.prismaService.signupRequests.findFirst({
      where: {
        uniquekey: signUpDto.key,
        isused: false,
      },
    });

    if (!signUpKeyData) {
      throw new NotFoundException(
        'Signup request not found',
        'SIGNUP_NOT_FOUND',
      );
    }

    const currentDateTime = new Date();
    const deadlineDateTime = new Date(signUpKeyData.deadline);

    if (deadlineDateTime < currentDateTime) {
      throw new BadRequestException(
        'Signup request has expired',
        'SIGNUP_EXPIRED',
      );
    }

    const userExists = await this.prismaService.userDetails.findFirst({
      where: {
        OR: [
          { mobilenumber: signUpDto.mobileNumber },
          { emailid: signUpDto.emailId },
        ],
      },
    });

    if (userExists) {
      if (userExists.mobilenumber === signUpDto.mobileNumber) {
        throw new HttpException(
          'Mobile Number already exists.',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException(
          'Email Id already exists.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const userId = this.idGeneratorService.generateId();

    const saltRounds = 10;
    const saltKey = genSaltSync(saltRounds);
    const hashedKey = hashSync(signUpDto.password, saltKey);

    await this.prismaService.userDetails.create({
      data: {
        userid: userId,
        fullname: signUpDto.fullName,
        organisationname: signUpDto.organisationName,
        emailid: signUpDto.emailId,
        mobilenumber: signUpDto.mobileNumber,
        roleid: signUpDto.roleId,
        token: null,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      },
    });

    await this.prismaService.userAuthPassDetails.create({
      data: {
        userid: userId,
        hashedkey: hashedKey,
        saltkey: saltKey,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      },
    });

    await this.prismaService.signupRequests.update({
      where: {
        id: signUpKeyData.id,
      },
      data: {
        isused: true,
        updatedat: new Date().toISOString(),
      },
    });

    return {
      data: { statusCode: 200, userId: userId },
    };
  }
}
