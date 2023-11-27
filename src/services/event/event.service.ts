import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddTNCDto, DeleteTNCDto } from '../../models/dto/event/event.dto';
import { IdGeneratorService } from '../idGenerator/idgenerator.service';

@Injectable()
export class EventService {
  constructor(
    private prismaService: PrismaService,
    private idGeneratorService: IdGeneratorService,
  ) {}

  async addTermsAndConditions(addTNCDto: AddTNCDto) {
    const userData = await this.prismaService.userDetails.findFirst({
      where: { userid: addTNCDto.userId },
    });

    if (!userData) {
      throw new HttpException('Account not found', HttpStatus.UNAUTHORIZED);
    }

    const termsId = this.idGeneratorService.generateId();

    await this.prismaService.userTermsConditions.create({
      data: {
        termsconditionsid: termsId,
        userid: addTNCDto.userId,
        termsandconditionstext: addTNCDto.termsAndCondition,
        createdat: new Date().toISOString(),
        createdby: addTNCDto.userId,
      },
    });

    const allTerms = await this.prismaService.userTermsConditions.findMany({
      where: {
        userid: addTNCDto.userId,
      },
    });

    return {
      data: {
        statusCode: 200,
        message: 'success',
        termsAndConditions: allTerms,
      },
    };
  }

  async getTermsAndConditions(userId: string) {
    const userData = await this.prismaService.userDetails.findFirst({
      where: { userid: BigInt(userId) },
    });

    if (!userData) {
      throw new HttpException('Account not found', HttpStatus.UNAUTHORIZED);
    }

    const allTerms = await this.prismaService.userTermsConditions.findMany({
      where: {
        userid: BigInt(userId),
      },
    });

    return {
      data: {
        statusCode: 200,
        message: 'success',
        termsAndConditions: allTerms,
      },
    };
  }

  async deleteTermsAndConditions(params: DeleteTNCDto) {
    const userData = await this.prismaService.userDetails.findFirst({
      where: { userid: BigInt(params.userId) },
    });

    if (!userData) {
      throw new HttpException('Account not found', HttpStatus.UNAUTHORIZED);
    }

    await this.prismaService.userTermsConditions.delete({
      where: {
        termsconditionsid: BigInt(params.termsConditionsId),
      },
    });

    const allTerms = await this.prismaService.userTermsConditions.findMany({
      where: {
        userid: BigInt(params.userId),
      },
    });

    return {
      data: {
        statusCode: 200,
        message: 'success',
        termsAndConditions: allTerms,
      },
    };
  }
}
