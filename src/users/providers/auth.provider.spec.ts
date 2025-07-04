import { Repository } from 'typeorm';
import { AuthProvider } from './auth.provider';
import { User } from '../user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from '../dtos/register.dto';

describe('Auth Provider', () => {
  const REPOSITORY_TOKEN = getRepositoryToken(User);

  let authProvider: AuthProvider;
  let authRepository: Repository<User>;
  let mailService: MailService;
  let configService: ConfigService;

  const registerDto: RegisterDto = {
    username: 'Lahcen Alhiane',
    email: 'lahcen@email.com',
    password: 'lahcen@1234',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthProvider,
        {
          provide: REPOSITORY_TOKEN,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn((dto: RegisterDto) => ({ ...dto })),
            save: jest.fn((user: User) => Promise.resolve({ ...user, id: 1 })),
          },
        },
        { provide: JwtService, useValue: {} },
        {
          provide: MailService,
          useValue: {
            sendEmailVerificationLink: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    // authProvider = new AuthProvider()
    authProvider = module.get<AuthProvider>(AuthProvider);
    // authRepository = new Repository(User)
    authRepository = module.get<Repository<User>>(REPOSITORY_TOKEN);
    // mailService = new MailService()
    mailService = module.get<MailService>(MailService);
    // configService = new ConfigService()
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should auth provider be defined', () => {
    expect(authProvider).toBeDefined();
  });

  it('should auth repository be defined', () => {
    expect(authRepository).toBeDefined();
  });

  describe('register()', () => {
    it('should call "findOne" method in users repository', async () => {
      await authProvider.register(registerDto);
      expect(authRepository.findOne).toHaveBeenCalled();
      expect(authRepository.findOne).toHaveBeenCalledTimes(1);
    });
    it('should call "create" method in users repository', async () => {
      await authProvider.register(registerDto);
      expect(authRepository.create).toHaveBeenCalled();
      expect(authRepository.create).toHaveBeenCalledTimes(1);
    });
    it('should call "save" method in users repository', async () => {
      await authProvider.register(registerDto);
      expect(authRepository.save).toHaveBeenCalled();
      expect(authRepository.save).toHaveBeenCalledTimes(1);
    });
    it('should call "sendEmailVerificationLink" method in mail service', async () => {
      await authProvider.register(registerDto);
      expect(mailService.sendEmailVerificationLink).toHaveBeenCalled();
      expect(mailService.sendEmailVerificationLink).toHaveBeenCalledTimes(1);
    });
    it('should call "get" method in config service', async () => {
      await authProvider.register(registerDto);
      expect(configService.get).toHaveBeenCalled();
      expect(configService.get).toHaveBeenCalledTimes(1);
    });
  });
});
