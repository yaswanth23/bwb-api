import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumberString,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddTNCDto {
  @ApiProperty()
  @IsNumberString()
  userId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  termsAndCondition: string;
}

export class DeleteTNCDto {
  @ApiProperty()
  @IsNumberString()
  userId: number;

  @ApiProperty()
  @IsNumberString()
  termsConditionsId: number;
}

export class ProductDetailsDto {
  product: string;
  productVariant: string;
  quantity: number;
  deliveryLocation: string;
}

export class EventScheduleDto {
  userId: bigint;
  eventTitle: string;
  awardType: number;
  deliveryDate: Date;
  productDetails: ProductDetailsDto[];
  termsAndConditionsIds: bigint[];
  eventScheduleOption: string;
  eventStartTime: Date;
  eventDurationOption: string;
  eventDuration: string;
}

export class GetEventsDto {
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @IsString()
  @IsIn(['LIVE', 'UPCOMING', 'CLOSED'], {
    message: 'Status must be LIVE or UPCOMING or CLOSED',
  })
  status: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;
}

export class GetEventsListDto {
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @IsString()
  @IsIn(['LIVE', 'CLOSED'], {
    message: 'Status must be LIVE or CLOSED',
  })
  status: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;
}

export class VendorPriceSubmitDto {
  @ApiProperty()
  @IsNumberString()
  vendorUserId: number;

  @ApiProperty()
  @IsNumberString()
  productId: number;

  @ApiProperty()
  @IsNumber()
  vendorPrice: number;
}

export class CounterPriceSubmitDto {
  @ApiProperty()
  @IsNumberString()
  userId: number;

  @ApiProperty()
  @IsNumberString()
  productId: number;

  @ApiProperty()
  @IsNumber()
  counterPrice: number;
}

export class CounterPriceStatusChangeDto {
  @ApiProperty()
  @IsNumberString()
  vendorUserId: number;

  @ApiProperty()
  @IsNumberString()
  productId: number;

  @ApiProperty()
  @IsString()
  status: string;
}
