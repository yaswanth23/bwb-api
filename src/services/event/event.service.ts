import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddTNCDto,
  DeleteTNCDto,
  EventScheduleDto,
  GetEventsDto,
  GetEventsListDto,
  VendorPriceSubmitDto,
  CounterPriceSubmitDto,
  CounterPriceStatusChangeDto,
  UserProductStatusChangeDto,
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
    let fromDeliveryDate: any;
    let toDeliveryDate: any;

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

    let deliveryTimeDate = new Date(eventScheduleDto.fromDeliveryDate);
    deliveryTimeDate.setHours(deliveryTimeDate.getHours() + 5);
    deliveryTimeDate.setMinutes(deliveryTimeDate.getMinutes() + 30);
    fromDeliveryDate = deliveryTimeDate.toISOString();

    deliveryTimeDate = new Date(eventScheduleDto.toDeliveryDate);
    deliveryTimeDate.setHours(deliveryTimeDate.getHours() + 5);
    deliveryTimeDate.setMinutes(deliveryTimeDate.getMinutes() + 30);
    toDeliveryDate = deliveryTimeDate.toISOString();

    let productIds: any = [];

    await Promise.all(
      eventScheduleDto.productDetails.map(async (item) => {
        const product = await this.prismaService.products.create({
          data: {
            userid: eventScheduleDto.userId,
            eventid: eventId,
            product: item.product,
            productvariant: item.productVariant,
            quantity: Number(item.quantity),
            deliverylocation: item.deliveryLocation,
            status: 'OPEN',
            createdat: new Date().toISOString(),
            createdby: eventScheduleDto.userId,
          },
        });
        productIds.push(product.productid);
      }),
    );

    await this.prismaService.eventDetails.create({
      data: {
        eventid: eventId,
        eventname: eventScheduleDto.eventTitle,
        userid: eventScheduleDto.userId,
        eventstatus: eventStatus,
        eventstarttime: eventStartTime,
        eventduration: eventDuration,
        fromDeliverydate: fromDeliveryDate,
        todeliverydate: toDeliveryDate,
        vendorscount: 0,
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
          key: 'PRODUCT_IDS',
          value: JSON.stringify(productIds.map((id) => Number(id))),
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

  async getEvents(params: GetEventsDto) {
    const page: number = params.page || 1;
    const limit: number = params.limit || 10;
    const offset: number = (page - 1) * limit;

    const data = await this.prismaService.eventDetails.findMany({
      where: {
        userid: params.userId,
        eventstatus: params.status,
      },
      include: {
        eventAttributesStore: {
          where: {
            key: 'PRODUCT_IDS',
          },
        },
      },
      take: Number(limit),
      skip: offset,
    });

    return {
      data: {
        statusCode: 200,
        events: data,
      },
    };
  }

  async getEventsCount(userId: string) {
    const totalEventCount = await this.prismaService.eventDetails.count({
      where: {
        userid: BigInt(userId),
      },
    });

    const liveEventCount = await this.prismaService.eventDetails.count({
      where: {
        userid: BigInt(userId),
        eventstatus: 'LIVE',
      },
    });

    const closedEventCount = await this.prismaService.eventDetails.count({
      where: {
        userid: BigInt(userId),
        eventstatus: 'CLOSED',
      },
    });

    return {
      data: {
        statusCode: 200,
        liveEventCount,
        totalEventCount,
        closedEventCount,
      },
    };
  }

  async getVendorEventsCount(userId: string) {
    const totalEventCount = await this.prismaService.eventDetails.count({});

    const liveEventCount = await this.prismaService.eventDetails.count({
      where: {
        eventstatus: 'LIVE',
      },
    });

    const closedEventCount = await this.prismaService.eventDetails.count({
      where: {
        eventstatus: 'CLOSED',
      },
    });

    return {
      data: {
        statusCode: 200,
        liveEventCount,
        totalEventCount,
        closedEventCount,
      },
    };
  }

  async getEventsList(params: GetEventsListDto) {
    const page: number = params.page || 1;
    const limit: number = params.limit || 10;
    const offset: number = (page - 1) * limit;

    const data = await this.prismaService.eventDetails.findMany({
      where: {
        eventstatus: params.status,
      },
      include: {
        eventAttributesStore: {
          where: {
            key: 'PRODUCT_IDS',
          },
        },
      },
      take: Number(limit),
      skip: offset,
    });

    return {
      data: {
        statusCode: 200,
        events: data,
      },
    };
  }

  async getEventDetails(userId: string, eventId: string) {
    const data = await this.prismaService.eventDetails.findFirst({
      where: {
        eventid: BigInt(eventId),
      },
      include: {
        eventAttributesStore: {
          where: {
            key: { in: ['AWARD_TYPE', 'PRODUCT_IDS'] },
          },
        },
      },
    });

    let response: any = data;
    if (data) {
      const productIdsAttribute = data.eventAttributesStore.find(
        (attribute) => attribute.key === 'PRODUCT_IDS',
      );
      let productDetails = await this.prismaService.products.findMany({
        where: {
          productid: { in: JSON.parse(productIdsAttribute.value) },
        },
      });

      await Promise.all(
        productDetails.map(async (item: any) => {
          const productComparision =
            await this.prismaService.productComparisons.findMany({
              where: {
                productid: item.productid,
                vendoruserid: BigInt(userId),
                vendorstatus: {
                  in: ['ACCEPTED', 'CLOSED', 'REJECTED', 'OPEN'],
                },
                userstatus: {
                  in: ['ACCEPTED', 'CLOSED', 'REJECTED', 'OPEN'],
                },
              },
            });

          item.productComparisions = productComparision;
        }),
      );

      response.productDetails = productDetails;
    }

    return {
      data: {
        statusCode: 200,
        eventDetails: response,
      },
    };
  }

  async vendorPriceSubmit(vendorPriceSubmitDto: VendorPriceSubmitDto) {
    const productData = await this.prismaService.products.findFirst({
      where: {
        productid: vendorPriceSubmitDto.productId,
      },
    });

    const data = await this.prismaService.productComparisons.findFirst({
      where: {
        productid: vendorPriceSubmitDto.productId,
        vendoruserid: vendorPriceSubmitDto.vendorUserId,
        status: { in: ['ACCEPTED', 'NOT ACCEPTED'] },
      },
    });

    if (data) {
      return {
        data: {
          statusCode: 200,
          message: 'success',
        },
      };
    }

    if (['ACCEPTED', 'CLOSED', 'REJECTED'].includes(data?.vendorstatus)) {
      return {
        data: {
          statusCode: 200,
          message: 'success',
        },
      };
    }

    await this.prismaService.productComparisons.upsert({
      where: {
        productid_vendoruserid: {
          productid: vendorPriceSubmitDto.productId,
          vendoruserid: vendorPriceSubmitDto.vendorUserId,
        },
      },
      update: {
        vendorprice: vendorPriceSubmitDto.vendorPrice,
        updatedat: new Date().toISOString(),
        updatedby: vendorPriceSubmitDto.vendorUserId,
      },
      create: {
        productid: vendorPriceSubmitDto.productId,
        vendoruserid: vendorPriceSubmitDto.vendorUserId,
        eventid: productData.eventid,
        counterprice: null,
        vendorprice: vendorPriceSubmitDto.vendorPrice,
        vendorunittype: null,
        status: 'OPEN',
        vendorstatus: 'OPEN',
        userstatus: 'OPEN',
        createdat: new Date().toISOString(),
        createdby: vendorPriceSubmitDto.vendorUserId,
      },
    });

    return {
      data: {
        statusCode: 200,
        message: 'success',
      },
    };
  }

  async counterPriceSubmit(counterPriceSubmitDto: CounterPriceSubmitDto) {
    await this.prismaService.productComparisons.upsert({
      where: {
        productid_vendoruserid: {
          productid: counterPriceSubmitDto.productId,
          vendoruserid: counterPriceSubmitDto.vendorUserId,
        },
      },
      update: {
        counterprice: counterPriceSubmitDto.counterPrice,
        updatedat: new Date().toISOString(),
        updatedby: counterPriceSubmitDto.userId,
      },
      create: {
        productid: counterPriceSubmitDto.productId,
        vendoruserid: null,
        counterprice: counterPriceSubmitDto.counterPrice,
        vendorprice: null,
        vendorunittype: null,
        status: 'OPEN',
        vendorstatus: 'OPEN',
        userstatus: 'OPEN',
        createdat: new Date().toISOString(),
        createdby: counterPriceSubmitDto.userId,
      },
    });

    return {
      data: {
        statusCode: 200,
        message: 'success',
      },
    };
  }

  async changeStatusCounterPrice(
    counterPriceStatusChangeDto: CounterPriceStatusChangeDto,
  ) {
    const data = await this.prismaService.productComparisons.findFirst({
      where: {
        productid: counterPriceStatusChangeDto.productId,
        vendoruserid: counterPriceStatusChangeDto.vendorUserId,
        vendorstatus: 'OPEN',
      },
    });

    if (data) {
      await this.prismaService.productComparisons.update({
        where: {
          productid_vendoruserid: {
            productid: counterPriceStatusChangeDto.productId,
            vendoruserid: counterPriceStatusChangeDto.vendorUserId,
          },
        },
        data: {
          vendorstatus: counterPriceStatusChangeDto.status,
          updatedat: new Date().toISOString(),
          updatedby: counterPriceStatusChangeDto.vendorUserId,
        },
      });
    }

    return {
      data: {
        statusCode: 200,
        message: 'success',
      },
    };
  }

  async getUserEventDetails(userId: string, eventId: string) {
    const data = await this.prismaService.eventDetails.findFirst({
      where: {
        eventid: BigInt(eventId),
        userid: BigInt(userId),
      },
      include: {
        eventAttributesStore: {
          where: {
            key: { in: ['AWARD_TYPE', 'PRODUCT_IDS'] },
          },
        },
      },
    });

    let response: any = null;

    if (data) {
      response = {
        eventId: data.eventid,
        eventName: data.eventname,
        eventStatus: data.eventstatus,
      };

      const productIdsAttribute = data.eventAttributesStore.find(
        (attribute) => attribute.key === 'PRODUCT_IDS',
      );
      let productDetails: any = await this.prismaService.products.findMany({
        where: {
          productid: { in: JSON.parse(productIdsAttribute.value) },
        },
      });

      await Promise.all(
        productDetails.map(async (item: any) => {
          let productComparision: any =
            await this.prismaService.productComparisons.findMany({
              where: {
                productid: item.productid,
                vendorstatus: {
                  in: ['ACCEPTED', 'CLOSED', 'REJECTED', 'OPEN'],
                },
                userstatus: {
                  in: ['ACCEPTED', 'CLOSED', 'REJECTED', 'OPEN'],
                },
              },
            });

          if (productComparision.length > 0) {
            await Promise.all(
              productComparision.map(async (data: any) => {
                const vendorDetails =
                  await this.prismaService.userDetails.findFirst({
                    where: {
                      userid: data.vendoruserid,
                    },
                    select: {
                      userid: true,
                      organisationname: true,
                    },
                  });
                data.totalPrice = item.quantity * data.vendorprice;
                data.vendorDetails = vendorDetails;
              }),
            );
          }

          item.productComparisions = productComparision;
        }),
      );

      response.productDetails = productDetails;
    }

    return {
      data: {
        statusCode: 200,
        eventDetails: response,
      },
    };
  }

  async changeUserProductStatus(
    userProductStatusChangeDto: UserProductStatusChangeDto,
  ) {
    const data = await this.prismaService.products.findFirst({
      where: {
        productid: userProductStatusChangeDto.productId,
        userid: userProductStatusChangeDto.userId,
        status: 'OPEN',
      },
    });

    if (data) {
      await this.prismaService.products.update({
        where: {
          productid: userProductStatusChangeDto.productId,
          userid: userProductStatusChangeDto.userId,
        },
        data: {
          status: userProductStatusChangeDto.status,
          updatedat: new Date().toISOString(),
          updatedby: userProductStatusChangeDto.userId,
        },
      });

      await this.prismaService.productComparisons.update({
        where: {
          productid_vendoruserid: {
            vendoruserid: userProductStatusChangeDto.vendorUserId,
            productid: userProductStatusChangeDto.productId,
          },
        },
        data: {
          status: userProductStatusChangeDto.status,
          updatedat: new Date().toISOString(),
          updatedby: userProductStatusChangeDto.userId,
        },
      });

      if (userProductStatusChangeDto.status === 'ACCEPTED') {
        await this.prismaService.productComparisons.updateMany({
          where: {
            vendoruserid: { not: userProductStatusChangeDto.vendorUserId },
            productid: userProductStatusChangeDto.productId,
          },
          data: {
            status: 'NOT ACCEPTED',
            updatedat: new Date().toISOString(),
            updatedby: userProductStatusChangeDto.userId,
          },
        });
      }
    }

    return {
      data: {
        statusCode: 200,
        message: 'success',
      },
    };
  }
}
