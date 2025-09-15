import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(clientId: string, rootOnly?: boolean): Promise<Category[]> {
    const query = this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.clientId = :clientId', { clientId })
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('category.parent', 'parent')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC');

    if (rootOnly) {
      query.andWhere('category.parentId IS NULL');
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({
      where: { id },
      relations: ['children', 'parent', 'products'],
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
    await this.categoriesRepository.update(id, updateCategoryDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.categoriesRepository.delete(id);
  }

  async getTree(clientId: string): Promise<Category[]> {
    return this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.clientId = :clientId', { clientId })
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('category.parent', 'parent')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();
  }
}