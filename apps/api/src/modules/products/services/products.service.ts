import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '../dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Gerar código automaticamente se não fornecido
    if (!createProductDto.code) {
      createProductDto.code = await this.generateNextCode(createProductDto.clientId, createProductDto.type);
    }
    
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  private getCodePrefix(productType: string): string {
    const prefixes = {
      'raw_material': 'MP',     // Matéria Prima
      'semi_finished': 'SF',    // Semi Finished
      'finished': 'PA',         // Produto Acabado
      'manipulated': 'MAN'      // Manipulado
    };
    return prefixes[productType] || 'PRD';
  }

  private async generateNextCode(clientId: string, productType: string = 'finished'): Promise<string> {
    const prefix = this.getCodePrefix(productType);
    
    // Buscar todos os produtos do cliente para gerar o próximo código
    const products = await this.productsRepository.find({
      where: { clientId },
      select: ['code'],
    });

    if (products.length === 0) {
      return `${prefix}001`;
    }

    // Filtrar códigos que seguem o padrão do tipo atual
    const pattern = new RegExp(`^${prefix}\\d+$`);
    const numericCodes = products
      .map(p => p.code)
      .filter(code => code && pattern.test(code))
      .map(code => parseInt(code.replace(prefix, ''), 10))
      .filter(num => !isNaN(num));

    if (numericCodes.length === 0) {
      return `${prefix}001`;
    }

    const maxNumber = Math.max(...numericCodes);
    const nextNumber = maxNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  async findAll(clientId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: { clientId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'client'],
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product | null> {
    await this.productsRepository.update(id, updateProductDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.productsRepository.delete(id);
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: { categoryId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async search(clientId: string, query: string): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .where('product.clientId = :clientId', { clientId })
      .andWhere(
        '(product.name ILIKE :query OR product.description ILIKE :query OR product.sku ILIKE :query OR product.barcode ILIKE :query)',
        { query: `%${query}%` },
      )
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }
}


