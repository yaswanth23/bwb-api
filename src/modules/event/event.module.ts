import { Module } from '@nestjs/common';
import { EventController } from '../../controllers/event/event.controller';
import { EventService } from '../../services/event/event.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IdGeneratorService } from '../../services/idGenerator/idgenerator.service';
import { AwsService } from 'src/services/aws/aws.service';

@Module({
  controllers: [EventController],
  providers: [EventService, IdGeneratorService, AwsService],
  imports: [PrismaModule],
})
export class EventModule {}
