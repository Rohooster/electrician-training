/**
 * Admin Router Tests
 *
 * Comprehensive test suite for admin tRPC procedures
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Mock logger to avoid console spam in tests
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(async (label, fn) => await fn()),
  }),
}));

import { adminRouter } from '../admin';
import { prisma } from '@/lib/prisma';

type MockPrisma = DeepMockProxy<PrismaClient>;

describe('Admin Router', () => {
  const mockPrisma = prisma as unknown as MockPrisma;
  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'admin@test.com',
      role: 'ADMIN' as const,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };

  beforeEach(() => {
    mockReset(mockPrisma);
  });

  describe('listItems', () => {
    it('should list items with default pagination', async () => {
      const mockItems = [
        {
          id: 'item-1',
          stem: 'Test question 1',
          optionA: 'Option A',
          optionB: 'Option B',
          optionC: 'Option C',
          optionD: 'Option D',
          correctAnswer: 'A' as const,
          topic: 'conductor_sizing',
          cognitive: 'LOOKUP' as const,
          difficulty: 'MEDIUM' as const,
          isActive: true,
          jurisdiction: { id: 'juris-1', name: 'CA General' },
          codeEdition: { id: 'code-1', name: 'NEC 2020' },
        },
      ];

      mockPrisma.item.findMany.mockResolvedValue(mockItems as any);
      mockPrisma.item.count.mockResolvedValue(1);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.listItems({
        limit: 50,
        offset: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe('item-1');
    });

    it('should filter items by topic', async () => {
      mockPrisma.item.findMany.mockResolvedValue([]);
      mockPrisma.item.count.mockResolvedValue(0);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      await caller.listItems({
        topic: 'conductor_sizing',
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            topic: 'conductor_sizing',
          }),
        })
      );
    });

    it('should filter items by search term', async () => {
      mockPrisma.item.findMany.mockResolvedValue([]);
      mockPrisma.item.count.mockResolvedValue(0);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      await caller.listItems({
        search: 'conductor',
        limit: 50,
        offset: 0,
      });

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ stem: expect.anything() }),
            ]),
          }),
        })
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrisma.item.findMany.mockResolvedValue([]);
      mockPrisma.item.count.mockResolvedValue(100);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      await caller.listItems({
        limit: 20,
        offset: 40,
      });

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 40,
        })
      );
    });
  });

  describe('createItem', () => {
    it('should create a new item successfully', async () => {
      const newItem = {
        id: 'new-item-id',
        jurisdictionId: 'juris-1',
        codeEditionId: 'code-1',
        stem: 'What is the minimum size conductor?',
        optionA: '12 AWG',
        optionB: '10 AWG',
        optionC: '8 AWG',
        optionD: '6 AWG',
        correctAnswer: 'A' as const,
        explanation: 'Per NEC 240.4',
        topic: 'conductor_sizing',
        cognitive: 'LOOKUP' as const,
        difficulty: 'MEDIUM' as const,
        necArticleRefs: ['240.4'],
        cecAmendmentRefs: [],
        isActive: true,
        vendorStyle: 'PSI',
        createdAt: new Date(),
        updatedAt: new Date(),
        irtA: null,
        irtB: null,
        irtC: null,
      };

      mockPrisma.item.create.mockResolvedValue(newItem);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.createItem({
        jurisdictionId: 'juris-1',
        codeEditionId: 'code-1',
        stem: 'What is the minimum size conductor?',
        optionA: '12 AWG',
        optionB: '10 AWG',
        optionC: '8 AWG',
        optionD: '6 AWG',
        correctAnswer: 'A',
        explanation: 'Per NEC 240.4',
        topic: 'conductor_sizing',
        cognitive: 'LOOKUP',
        difficulty: 'MEDIUM',
        necArticleRefs: ['240.4'],
      });

      expect(result.id).toBe('new-item-id');
      expect(result.stem).toBe('What is the minimum size conductor?');
      expect(mockPrisma.item.create).toHaveBeenCalledOnce();
    });

    it('should handle missing NEC references', async () => {
      const newItem = {
        id: 'new-item-id',
        necArticleRefs: [],
        cecAmendmentRefs: [],
      };

      mockPrisma.item.create.mockResolvedValue(newItem as any);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      await caller.createItem({
        jurisdictionId: 'juris-1',
        codeEditionId: 'code-1',
        stem: 'Test',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'A',
        topic: 'test',
        cognitive: 'LOOKUP',
        difficulty: 'EASY',
        necArticleRefs: [],
      });

      expect(mockPrisma.item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            necArticleRefs: [],
            cecAmendmentRefs: [],
          }),
        })
      );
    });
  });

  describe('updateItem', () => {
    it('should update an existing item', async () => {
      const updatedItem = {
        id: 'item-1',
        stem: 'Updated question',
      };

      mockPrisma.item.update.mockResolvedValue(updatedItem as any);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.updateItem({
        id: 'item-1',
        data: {
          stem: 'Updated question',
        },
      });

      expect(result.stem).toBe('Updated question');
      expect(mockPrisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { stem: 'Updated question' },
      });
    });

    it('should handle partial updates', async () => {
      mockPrisma.item.update.mockResolvedValue({ id: 'item-1' } as any);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      await caller.updateItem({
        id: 'item-1',
        data: {
          difficulty: 'HARD',
        },
      });

      expect(mockPrisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { difficulty: 'HARD' },
      });
    });
  });

  describe('deleteItem', () => {
    it('should delete an item successfully', async () => {
      const mockItem = {
        id: 'item-1',
        topic: 'test_topic',
        cognitive: 'LOOKUP',
        stem: 'Test question to be deleted',
      };

      mockPrisma.item.findUnique.mockResolvedValue(mockItem as any);
      mockPrisma.item.delete.mockResolvedValue(mockItem as any);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.deleteItem({ id: 'item-1' });

      expect(result.success).toBe(true);
      expect(mockPrisma.item.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });

    it('should throw error if item not found', async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      await expect(caller.deleteItem({ id: 'non-existent' })).rejects.toThrow(
        'Item not found'
      );
    });
  });

  describe('getTopics', () => {
    it('should return unique topics', async () => {
      const mockTopics = [
        { topic: 'conductor_sizing' },
        { topic: 'grounding_bonding' },
        { topic: 'ocpd' },
      ];

      mockPrisma.item.findMany.mockResolvedValue(mockTopics as any);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.getTopics({});

      expect(result).toEqual(['conductor_sizing', 'grounding_bonding', 'ocpd']);
      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          distinct: ['topic'],
        })
      );
    });

    it('should filter topics by jurisdiction', async () => {
      mockPrisma.item.findMany.mockResolvedValue([]);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      await caller.getTopics({ jurisdictionId: 'juris-1' });

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jurisdictionId: 'juris-1',
          }),
        })
      );
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings for items without them', async () => {
      const mockItems = [
        { id: 'item-1', stem: 'Test 1', explanation: 'Exp 1', topic: 'topic1' },
        { id: 'item-2', stem: 'Test 2', explanation: 'Exp 2', topic: 'topic2' },
      ];

      mockPrisma.item.findMany.mockResolvedValue(mockItems as any);
      mockPrisma.itemEmbedding.create.mockResolvedValue({} as any);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.generateEmbeddings({ batchSize: 50 });

      expect(result.count).toBe(2);
      expect(mockPrisma.itemEmbedding.create).toHaveBeenCalledTimes(2);
    });

    it('should return zero count if no items need embeddings', async () => {
      mockPrisma.item.findMany.mockResolvedValue([]);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.generateEmbeddings({ batchSize: 50 });

      expect(result.count).toBe(0);
      expect(result.message).toContain('No items need embeddings');
    });

    it('should handle embedding creation errors gracefully', async () => {
      const mockItems = [
        { id: 'item-1', stem: 'Test 1', explanation: null, topic: 'topic1' },
        { id: 'item-2', stem: 'Test 2', explanation: null, topic: 'topic2' },
      ];

      mockPrisma.item.findMany.mockResolvedValue(mockItems as any);
      mockPrisma.itemEmbedding.create
        .mockResolvedValueOnce({} as any) // First succeeds
        .mockRejectedValueOnce(new Error('Creation failed')); // Second fails

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.generateEmbeddings({ batchSize: 50 });

      expect(result.count).toBe(1);
      expect(result.message).toContain('1 errors');
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.item.count
        .mockResolvedValueOnce(150) // totalItems
        .mockResolvedValueOnce(50); // itemsNeedingEmbeddings
      mockPrisma.concept.count.mockResolvedValue(25);
      mockPrisma.examAttempt.count.mockResolvedValue(5);
      mockPrisma.drillSession.count.mockResolvedValue(20);

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.getDashboardStats();

      expect(result.totalUsers).toBe(10);
      expect(result.totalItems).toBe(150);
      expect(result.totalConcepts).toBe(25);
      expect(result.itemsNeedingEmbeddings).toBe(50);
      expect(result.examsCompleted30d).toBe(5);
      expect(result.drillsCompleted30d).toBe(20);
    });
  });

  describe('importItems', () => {
    it('should bulk import items', async () => {
      const mockItems = [
        {
          stem: 'Question 1',
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
          correctAnswer: 'A' as const,
          topic: 'test',
          cognitive: 'LOOKUP' as const,
          difficulty: 'MEDIUM' as const,
          necArticleRefs: [],
        },
      ];

      mockPrisma.item.createMany.mockResolvedValue({ count: 1 });

      const caller = adminRouter.createCaller({
        session: mockSession,
        prisma: mockPrisma as any,
      });

      const result = await caller.importItems({
        jurisdictionId: 'juris-1',
        codeEditionId: 'code-1',
        items: mockItems,
      });

      expect(result.count).toBe(1);
      expect(result.message).toContain('Successfully imported 1 items');
    });
  });
});
