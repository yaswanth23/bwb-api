import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddTNCDto,
  DeleteTNCDto,
  EventScheduleDto,
} from '../../models/dto/event/event.dto';
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
        isactive: true,
        termsandconditionstext: addTNCDto.termsAndCondition,
        createdat: new Date().toISOString(),
        createdby: addTNCDto.userId,
      },
    });

    const allTerms = await this.prismaService.userTermsConditions.findMany({
      where: {
        userid: addTNCDto.userId,
        isactive: true,
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
        isactive: true,
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

    await this.prismaService.userTermsConditions.update({
      where: {
        termsconditionsid: BigInt(params.termsConditionsId),
      },
      data: {
        isactive: false,
        updatedat: new Date().toISOString(),
        updatedby: params.userId,
      },
    });

    const allTerms = await this.prismaService.userTermsConditions.findMany({
      where: {
        userid: BigInt(params.userId),
        isactive: true,
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

  async scheduleEvent(eventScheduleDto: EventScheduleDto) {
    let eventStatus: string;
    let eventStartTime: any;
    let eventDuration: number;
    let deliveryDate: any;

    const eventId = this.idGeneratorService.generateId();

    if (eventScheduleDto.eventScheduleOption === 'now') {
      eventStatus = 'LIVE';
      const now = new Date();
      now.setHours(now.getHours() + 5);
      now.setMinutes(now.getMinutes() + 30);
      eventStartTime = now.toISOString();
    } else {
      eventStatus = 'UPCOMING';
      let eventStartTimeDate = new Date(eventScheduleDto.eventStartTime);
      eventStartTimeDate.setHours(eventStartTimeDate.getHours() + 5);
      eventStartTimeDate.setMinutes(eventStartTimeDate.getMinutes() + 30);
      eventStartTime = eventStartTimeDate.toISOString();
    }

    if (eventScheduleDto.eventDuration === '30 mins') {
      eventDuration = 30;
    } else {
      const durationInHours = Number(
        eventScheduleDto.eventDuration.replace(/[^0-9\.]+/g, ''),
      );
      eventDuration = durationInHours * 60;
    }

    let deliveryTimeDate = new Date(eventScheduleDto.deliveryDate);
    deliveryTimeDate.setHours(deliveryTimeDate.getHours() + 5);
    deliveryTimeDate.setMinutes(deliveryTimeDate.getMinutes() + 30);
    deliveryDate = deliveryTimeDate.toISOString();

    await this.prismaService.eventDetails.create({
      data: {
        eventid: eventId,
        eventname: eventScheduleDto.eventTitle,
        userid: eventScheduleDto.userId,
        eventstatus: eventStatus,
        eventstarttime: eventStartTime,
        eventduration: eventDuration,
        deliverydate: deliveryDate,
        createdby: eventScheduleDto.userId,
        createdat: new Date().toISOString(),
      },
    });

    await this.prismaService.eventAttributesStore.createMany({
      data: [
        {
          eventid: eventId,
          key: 'AWARD_TYPE',
          value: eventScheduleDto.awardType.toString(),
          createdby: eventScheduleDto.userId,
          createdat: new Date().toISOString(),
        },
        {
          eventid: eventId,
          key: 'PRODUCT_DETAILS',
          value: JSON.stringify(eventScheduleDto.productDetails),
          createdby: eventScheduleDto.userId,
          createdat: new Date().toISOString(),
        },
        {
          eventid: eventId,
          key: 'TERMS_AND_CONDITIONS_IDS',
          value: JSON.stringify(eventScheduleDto.termsAndConditionsIds),
          createdby: eventScheduleDto.userId,
          createdat: new Date().toISOString(),
        },
      ],
    });

    return {
      data: {
        statusCode: 200,
        message: 'success',
        eventId: eventId,
      },
    };
  }
}
