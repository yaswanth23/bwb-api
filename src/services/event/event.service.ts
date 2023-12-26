import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as util from 'util';
import { AwsService } from '../aws/aws.service';
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
const unlink = util.promisify(fs.unlink);

@Injectable()
export class EventService {
  constructor(
    private prismaService: PrismaService,
    private idGeneratorService: IdGeneratorService,
    private awsService: AwsService,
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
        vendorlimit: eventScheduleDto.vendorLimit,
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
            key: { in: ['AWARD_TYPE', 'PRODUCT_IDS', 'PURCHASE_ORDER_URL'] },
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

      const purchaseOrderUrl = data.eventAttributesStore.find(
        (attribute) => attribute.key === 'PURCHASE_ORDER_URL',
      );

      response.purchaseOrderUrl = purchaseOrderUrl
        ? purchaseOrderUrl.value
        : null;

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

    const count = await this.prismaService.productComparisons.groupBy({
      by: ['eventid', 'vendoruserid'],
      where: {
        eventid: productData.eventid,
      },
      _count: {
        _all: true,
      },
    });

    await this.prismaService.eventDetails.update({
      where: {
        eventid: productData.eventid,
      },
      data: {
        vendorscount: count.length,
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
            key: { in: ['AWARD_TYPE', 'PRODUCT_IDS', 'PURCHASE_ORDER_URL'] },
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

      const productIds = productDetails.map((item) => item.productid);

      const productComparisions =
        await this.prismaService.productComparisons.findMany({
          where: {
            productid: {
              in: productIds,
            },
            vendorstatus: {
              in: ['ACCEPTED', 'CLOSED', 'REJECTED', 'OPEN'],
            },
            userstatus: {
              in: ['ACCEPTED', 'CLOSED', 'REJECTED', 'OPEN'],
            },
          },
        });

      const vendorComparisons = Object.values(
        productComparisions.reduce((acc, comparison) => {
          const vendorUserIdStr = comparison.vendoruserid.toString();
          if (!acc[vendorUserIdStr]) {
            acc[vendorUserIdStr] = {
              vendoruserid: comparison.vendoruserid,
              vendorunittype: comparison.vendorunittype,
              status: comparison.status,
              vendorstatus: comparison.vendorstatus,
              userstatus: comparison.userstatus,
              sumTotal: 0,
              productQuotes: [],
            };
          }

          const productDetail = productDetails.find(
            (product) => product.productid === comparison.productid,
          );

          if (productDetail) {
            const totalPrice = comparison.vendorprice * productDetail.quantity;
            acc[vendorUserIdStr].sumTotal += totalPrice;
            acc[vendorUserIdStr].productQuotes.push({
              vendorUserId: comparison.vendoruserid,
              productid: productDetail.productid,
              product: productDetail.product,
              productvariant: productDetail.productvariant,
              quantity: productDetail.quantity,
              deliverylocation: productDetail.deliverylocation,
              status: productDetail.status,
              price: comparison.vendorprice,
              totalPrice,
            });
          }

          return acc;
        }, {}),
      );

      productDetails.forEach((product) => {
        vendorComparisons.forEach((vendorComparison: any) => {
          if (
            !vendorComparison.productQuotes.some(
              (quote) => quote.productid === product.productid,
            )
          ) {
            vendorComparison.productQuotes.push({
              vendorUserId: vendorComparison.vendoruserid,
              productid: product.productid,
              product: product.product,
              productvariant: product.productvariant,
              quantity: '-',
              deliverylocation: product.deliverylocation,
              price: '-',
              status: '-',
              totalPrice: '-',
            });
          }
        });
      });

      const purchaseOrderUrl = data.eventAttributesStore.find(
        (attribute) => attribute.key === 'PURCHASE_ORDER_URL',
      );

      response.purchaseOrderUrl = purchaseOrderUrl
        ? purchaseOrderUrl.value
        : null;

      for (let vendorComparison of vendorComparisons) {
        let vendor: any = vendorComparison;
        const vendorDetails = await this.prismaService.userDetails.findFirst({
          where: {
            userid: BigInt(vendor.vendoruserid),
          },
          select: {
            userid: true,
            organisationname: true,
            fullname: true,
          },
        });
        vendor.vendorName = vendorDetails.fullname;
        vendor.organisationname = vendorDetails.organisationname;
      }

      response.productDetails = productDetails;
      response.vendorComparisons = vendorComparisons;
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
    const data = await this.prismaService.eventAttributesStore.findFirst({
      where: {
        eventid: userProductStatusChangeDto.eventId,
        key: 'PRODUCT_IDS',
      },
    });

    if (data) {
      const productIds = JSON.parse(data.value);
      await Promise.all(
        productIds.map(async (id) => {
          const products = await this.prismaService.products.findFirst({
            where: {
              productid: id,
              userid: userProductStatusChangeDto.userId,
              status: 'OPEN',
            },
          });
          if (products) {
            await this.prismaService.products.update({
              where: {
                productid: id,
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
                  productid: id,
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
                  vendoruserid: {
                    not: userProductStatusChangeDto.vendorUserId,
                  },
                  productid: id,
                },
                data: {
                  status: 'NOT ACCEPTED',
                  updatedat: new Date().toISOString(),
                  updatedby: userProductStatusChangeDto.userId,
                },
              });
            }
          }
        }),
      );

      this.generatePurchaseOrder(userProductStatusChangeDto.eventId);
    }

    return {
      data: {
        statusCode: 200,
        message: 'success',
      },
    };
  }

  async generatePurchaseOrder(eventId: any) {
    const data = await this.prismaService.products.findMany({
      where: {
        eventid: BigInt(eventId),
      },
    });

    const counts = data.reduce(
      (acc, product) => {
        if (product.status === 'ACCEPTED') {
          acc.acceptedCount++;
        } else if (product.status === 'REJECTED') {
          acc.rejectedCount++;
        }

        return acc;
      },
      { acceptedCount: 0, rejectedCount: 0 },
    );

    const productComparisionData =
      await this.prismaService.productComparisons.findMany({
        where: {
          eventid: BigInt(eventId),
          status: 'ACCEPTED',
        },
      });

    const vendorIds = productComparisionData.map((item) => item.vendoruserid);
    const uniqueVendorIds = [...new Set(vendorIds)];

    const overallCount = data.length;

    const userDetails = await this.prismaService.userDetails.findFirst({
      where: {
        userid: data[0].userid,
      },
    });

    const eventDetails =
      await this.prismaService.eventAttributesStore.findFirst({
        where: {
          eventid: BigInt(eventId),
          key: 'TERMS_AND_CONDITIONS_IDS',
        },
      });

    const termsAndConditions =
      await this.prismaService.userTermsConditions.findMany({
        where: {
          termsconditionsid: { in: JSON.parse(eventDetails.value) },
        },
      });

    if (overallCount === counts.acceptedCount + counts.rejectedCount) {
      await Promise.all(
        uniqueVendorIds.map(async (vendor) => {
          const vendorDetails = await this.prismaService.userDetails.findFirst({
            where: {
              userid: vendor,
            },
          });

          const productComparisions =
            await this.prismaService.productComparisons.findMany({
              where: {
                vendoruserid: vendor,
                eventid: BigInt(eventId),
                status: 'ACCEPTED',
              },
            });

          let products = await Promise.all(
            productComparisions.map(async (item: any) => {
              const products = await this.prismaService.products.findFirst({
                where: {
                  productid: item.productid,
                },
              });

              return {
                name: products.product,
                quantity: products.quantity,
                amount: item.vendorprice,
                totalPrice:
                  Number(products.quantity) * Number(item.vendorprice),
              };
            }),
          );

          this.createPDF(
            eventId,
            vendorDetails,
            userDetails,
            products,
            termsAndConditions,
          )
            .then((filePath) => {
              this.awsService
                .uploadFile(filePath as string)
                .then(async (data) => {
                  const fileUrl = data.Location;
                  unlink(filePath as string)
                    .then(() => {
                      console.log(`File deleted at ${filePath}`);
                    })
                    .catch((error) => {
                      console.error('Error deleting file:', error);
                    });

                  await this.prismaService.eventAttributesStore.create({
                    data: {
                      eventid: BigInt(eventId),
                      key: 'PURCHASE_ORDER_URL',
                      value: fileUrl,
                      createdby: userDetails.userid,
                      createdat: new Date().toISOString(),
                    },
                  });
                })
                .catch((error) => {
                  console.error('Error uploading file:', error);
                });
            })
            .catch((error) => {
              console.error('Error creating PDF:', error);
            });
        }),
      );
    }

    return true;
  }

  createPDF(
    eventId: string,
    vendorDetails: any,
    userDetails: any,
    products: any,
    termsAndConditions: any,
  ) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const regularFont = 'Helvetica';
      const boldFont = 'Helvetica-Bold';

      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();

      if (!fs.existsSync('./files')) {
        fs.mkdirSync('./files');
      }
      const stream = fs.createWriteStream(`./files/${eventId}.pdf`);

      doc.pipe(stream);

      doc
        .font(boldFont)
        .fontSize(15)
        .fillColor('#0048ff')
        .text('bharatwellbeing', 50, 50)
        .font(regularFont)
        .fontSize(10)
        .fillColor('#000')
        .text(`Purchase Order: ${eventId}`, 300, 50)
        .text(`Date: ${day}-${month}-${year}`, 300, 70)
        .moveDown();

      doc.text('Vendor', 50, 150);
      doc.text(`Name: ${vendorDetails.fullname},`, 50, 165);
      doc.text(`${vendorDetails.organisationname}`, 50, 175);
      doc.text('Ship to', 300, 150);
      doc.text(`Name: ${userDetails.fullname}`, 300, 165);
      doc.text(`Organisation: ${userDetails.organisationname}`, 300, 175);
      doc.text(`Mobile: ${userDetails.mobilenumber}`, 300, 185);
      doc.moveDown();

      doc.rect(30, 240, 500, 20).fill('#0048ff');
      doc.fillColor('#fff');
      doc.text('Products', 50, 240 + 10, {
        baseline: 'middle',
      });
      doc.text('Quantity', 200, 240 + 10, {
        baseline: 'middle',
      });
      doc.text('Amount', 350, 240 + 10, {
        baseline: 'middle',
      });
      doc.text('Total', 500, 240 + 10, { baseline: 'middle' });

      let y = 270;
      let sumTotal = 0;
      products.forEach((product: any) => {
        const total = product.quantity * product.amount;
        sumTotal += total;

        doc.fillColor('#000').text(product.name, 50, y);
        doc.fillColor('#000').text(product.quantity.toString(), 200, y);
        doc.fillColor('#000').text(product.amount.toString(), 350, y);
        doc.fillColor('#000').text(total.toString(), 500, y);
        y += 20;
      });

      doc.fillColor('#000').text('Total Amount:', 350, y);
      doc.fillColor('#000').text(sumTotal.toString(), 500, y);

      y += 30;
      doc.rect(30, y, 500, 20).fill('#0048ff');
      doc
        .fillColor('#fff')
        .fontSize(10)
        .text('Terms and Conditions:', 50, y + 5);
      y += 30;

      termsAndConditions.forEach((item, index) => {
        doc
          .fillColor('#000')
          .text(`${index + 1}. ${item.termsandconditionstext}`, 50, y);
        y += 20;
      });

      doc.end();

      stream.on('finish', () => resolve(`./files/${eventId}.pdf`));
      stream.on('error', reject);
    });
  }
}
