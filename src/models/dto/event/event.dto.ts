import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumberString } from 'class-validator';

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
