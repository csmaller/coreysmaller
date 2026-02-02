import { Test, TestingModule } from '@nestjs/testing';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { CreateMusicTrackDto } from './dto/create-music-track.dto';
import { UpdateMusicTrackDto } from './dto/update-music-track.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('MusicController', () => {
  let controller: MusicController;
  let service: MusicService;

  const mockMusicService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MusicController],
      providers: [
        {
          provide: MusicService,
          useValue: mockMusicService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MusicController>(MusicController);
    service = module.get<MusicService>(MusicService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new music track', async () => {
      const createDto: CreateMusicTrackDto = {
        title: 'Test Song',
        description: 'A test song',
        audioUrl: 'https://example.com/song.mp3',
        genre: 'Rock',
        duration: 180,
      };

      const mockTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...createDto,
        playCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        releaseDate: null,
      };

      mockMusicService.create.mockResolvedValue(mockTrack);

      const result = await controller.create(createDto);

      expect(mockMusicService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockTrack);
    });
  });

  describe('findAll', () => {
    it('should return all music tracks', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Song 1',
          genre: 'Rock',
        },
        {
          id: '2',
          title: 'Song 2',
          genre: 'Jazz',
        },
      ];

      mockMusicService.findAll.mockResolvedValue(mockTracks);

      const result = await controller.findAll();

      expect(mockMusicService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTracks);
    });
  });

  describe('findOne', () => {
    it('should return a music track by id', async () => {
      const mockTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Song',
        genre: 'Rock',
      };

      mockMusicService.findOne.mockResolvedValue(mockTrack);

      const result = await controller.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(mockMusicService.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(mockTrack);
    });
  });

  describe('update', () => {
    it('should update a music track', async () => {
      const updateDto: UpdateMusicTrackDto = {
        title: 'Updated Song',
        genre: 'Jazz',
      };

      const mockTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Updated Song',
        genre: 'Jazz',
      };

      mockMusicService.update.mockResolvedValue(mockTrack);

      const result = await controller.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(mockMusicService.update).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', updateDto);
      expect(result).toEqual(mockTrack);
    });
  });

  describe('remove', () => {
    it('should delete a music track', async () => {
      mockMusicService.remove.mockResolvedValue(undefined);

      await controller.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(mockMusicService.remove).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });
  });
});