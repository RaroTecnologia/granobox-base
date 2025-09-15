import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus, UserDepartment } from '../../modules/users/entities/user.entity';

export async function seedAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Verificar se já existe um admin
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@granobox.com' },
  });

  if (existingAdmin) {
    console.log('👤 Usuário administrador já existe');
    return;
  }

  // Criar usuário administrador
  const adminUser = userRepository.create({
    name: 'Administrador GranoBox',
    email: 'admin@granobox.com',
    password: 'Admin@123', // Será hasheada automaticamente
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    department: UserDepartment.MANAGEMENT,
  });

  await userRepository.save(adminUser);
  console.log('✅ Usuário administrador criado com sucesso');
  console.log('📧 Email: admin@granobox.com');
  console.log('🔑 Senha: Admin@123');
}
