import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
const nodemailer = require('nodemailer');
import { genSaltSync, hashSync } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto, LoginDto } from '../../models/dto/auth/auth.dto';
import { IdGeneratorService } from '../idGenerator/idgenerator.service';

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

    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILER_ID,
        pass: process.env.MAILER_PASSWORD,
      },
    });

    const mailOptions = {
      from: 'yaswanth.k23@gmail.com',
      to: signUpDto.emailId,
      subject: 'Congratulations! Your Registration is Complete',
      html: `
        <p>Hello ${signUpDto.fullName},</p>
        
        <p>Congratulations! Your registration is complete, and you can now log in to our service using your credentials. Thank you for choosing our service.</p>
        
        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        
        <p>Best regards,<br/>BWB</p>
        
        <p>Visit our website: <a href="https://app-bwb.netlify.app/">https://app-bwb.netlify.app/</a></p>
      `,
    };

    transporter.sendMail(mailOptions);

    return {
      data: { statusCode: 200, userId: userId },
    };
  }

  async login(loginDto: LoginDto) {
    const userData = await this.prismaService.userDetails.findFirst({
      where: {
        OR: [
          { mobilenumber: loginDto.userIdentifier },
          { emailid: loginDto.userIdentifier },
        ],
      },
      include: {
        userAuthPassDetails: true,
      },
    });

    if (!userData) {
      throw new HttpException('Account not found', HttpStatus.UNAUTHORIZED);
    }

    const hashedPassword = hashSync(
      loginDto.password,
      userData.userAuthPassDetails.saltkey,
    );

    if (hashedPassword !== userData.userAuthPassDetails.hashedkey) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return {
      data: {
        statusCode: 200,
        userDetails: {
          userId: userData.userid,
          fullName: userData.fullname,
          organisationName: userData.organisationname,
          roleId: userData.roleid,
          emailId: userData.emailid,
          mobileNumber: userData.mobilenumber,
        },
      },
    };
  }
}
