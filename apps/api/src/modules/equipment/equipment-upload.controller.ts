import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Param,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../../upload/upload.service';
import { EquipmentService } from './equipment.service';

@ApiTags('Equipment Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentUploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly equipmentService: EquipmentService,
  ) {}

  @Post(':id/photos')
  @ApiOperation({ summary: 'Upload de fotos do equipamento' })
  @ApiParam({ name: 'id', description: 'ID do equipamento' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('photos', 5, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB por arquivo
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Apenas arquivos de imagem são permitidos'), false);
      }
      cb(null, true);
    },
  }))
  async uploadPhotos(
    @Param('id') equipmentId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhuma foto foi enviada');
    }

    // Verificar se o equipamento existe
    const equipment = await this.equipmentService.findOne(equipmentId);
    if (!equipment) {
      throw new BadRequestException('Equipamento não encontrado');
    }

    // Upload das fotos para R2
    const uploadResults = await this.uploadService.uploadMultipleFiles(
      files,
      `equipment/${equipmentId}/photos`
    );

    // Atualizar o equipamento com as URLs das fotos
    const photoUrls = uploadResults.map(result => result.url);
    const existingPhotos = equipment.photos || [];
    const updatedPhotos = [...existingPhotos, ...photoUrls];

    await this.equipmentService.update(equipmentId, {
      photos: updatedPhotos,
    });

    return {
      message: 'Fotos enviadas com sucesso',
      photos: photoUrls,
      totalPhotos: updatedPhotos.length,
    };
  }

  @Post(':id/invoice')
  @ApiOperation({ summary: 'Upload da nota fiscal do equipamento' })
  @ApiParam({ name: 'id', description: 'ID do equipamento' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('invoice', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new BadRequestException('Apenas arquivos PDF ou imagens são permitidos'), false);
      }
      cb(null, true);
    },
  }))
  async uploadInvoice(
    @Param('id') equipmentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhuma nota fiscal foi enviada');
    }

    // Verificar se o equipamento existe
    const equipment = await this.equipmentService.findOne(equipmentId);
    if (!equipment) {
      throw new BadRequestException('Equipamento não encontrado');
    }

    // Se já existe uma nota fiscal, deletar a anterior
    if (equipment.invoiceUrl) {
      try {
        const oldKey = equipment.invoiceUrl.split('/').pop();
        if (oldKey) {
          await this.uploadService.deleteFile(`equipment/${equipmentId}/invoice/${oldKey}`);
        }
      } catch (error) {
        console.warn('Erro ao deletar nota fiscal anterior:', error);
      }
    }

    // Upload da nova nota fiscal para R2
    const uploadResult = await this.uploadService.uploadFile(
      file,
      `equipment/${equipmentId}/invoice`
    );

    // Atualizar o equipamento com a URL da nota fiscal
    await this.equipmentService.update(equipmentId, {
      invoiceUrl: uploadResult.url,
    });

    return {
      message: 'Nota fiscal enviada com sucesso',
      invoiceUrl: uploadResult.url,
    };
  }
}
